import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserId, isAuthError } from '@/lib/auth-helpers'
import { startOfWeek, endOfWeek, subWeeks, addWeeks, format, eachDayOfInterval, isAfter } from 'date-fns'

interface MealSummary {
  mealType: string
  mealName: string
  eaten: boolean
  skipped: boolean
  isLeftover: boolean
  calories: number
  protein: number
  netCarbs: number
  fat: number
  fiber: number
}

interface DailySummary {
  date: string
  dayOfWeek: string
  totalCalories: number
  totalProtein: number
  totalNetCarbs: number
  totalFat: number
  totalFiber: number
  mealsPlanned: number
  mealsEaten: number
  mealsSkipped: number
  adherenceRate: number
  calorieTargetMet: boolean
  proteinTargetMet: boolean
  carbsUnderLimit: boolean
  meals: MealSummary[]
}

interface WeeklySummary {
  weekOf: string
  weekEnd: string
  avgCalories: number
  avgProtein: number
  avgNetCarbs: number
  avgFat: number
  avgFiber: number
  totalMealsPlanned: number
  totalMealsEaten: number
  totalMealsSkipped: number
  adherenceRate: number
  daysTracked: number
  days: DailySummary[]
}

// GET /api/aip-diet/report - Generate progress report
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    const searchParams = request.nextUrl.searchParams
    const weeksBack = searchParams.get('weeks') ? parseInt(searchParams.get('weeks')!, 10) : null
    // Append T12:00:00 to avoid timezone day-shift (midnight UTC = previous day in US timezones)
    const endDateParam = searchParams.get('endDate') ? new Date(searchParams.get('endDate')! + 'T12:00:00') : new Date()
    const startDateParam = searchParams.get('startDate') ? new Date(searchParams.get('startDate')! + 'T12:00:00') : null

    // Get questionnaire with restrictions for protocol info
    const questionnaire = await prisma.aIPQuestionnaire.findUnique({
      where: { userId },
      include: { restrictions: true },
    })

    if (!questionnaire) {
      return NextResponse.json(
        { error: 'No questionnaire found. Please complete onboarding first.' },
        { status: 400 }
      )
    }

    // Week-aligned boundaries for display structure
    const displayEnd = endOfWeek(endDateParam, { weekStartsOn: 0 })
    let displayStart: Date
    if (startDateParam) {
      displayStart = startOfWeek(startDateParam, { weekStartsOn: 0 })
    } else if (weeksBack) {
      displayStart = subWeeks(startOfWeek(endDateParam, { weekStartsOn: 0 }), weeksBack - 1)
    } else {
      // Default: 4 weeks back
      displayStart = subWeeks(startOfWeek(endDateParam, { weekStartsOn: 0 }), 3)
    }

    // Actual requested range for DB query (don't include days outside user's filter)
    const queryStart = startDateParam || displayStart
    const queryEnd = endDateParam

    // Get all AIP daily logs with recipe join (fixes zero-macro bug)
    const dailyLogs = await prisma.aIPDailyLog.findMany({
      where: {
        userId,
        date: {
          gte: queryStart,
          lte: queryEnd,
        },
      },
      include: {
        meals: {
          orderBy: { mealType: 'asc' },
          include: {
            recipe: {
              select: {
                id: true,
                name: true,
                calories: true,
                protein: true,
                carbs: true,
                fiber: true,
                fat: true,
                netCarbs: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'asc' },
    })

    // Track meal name frequencies for insights
    const mealNameCounts: Record<string, number> = {}
    let totalDaysTracked = 0

    // Group by week - dynamic iteration from displayStart to displayEnd
    const weeklyData: WeeklySummary[] = []
    let currentWeekStart = displayStart

    while (!isAfter(currentWeekStart, displayEnd)) {
      const weekStart = startOfWeek(currentWeekStart, { weekStartsOn: 0 })
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 })

      const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd })
      const dailySummaries: DailySummary[] = []

      let weekTotalCalories = 0
      let weekTotalProtein = 0
      let weekTotalNetCarbs = 0
      let weekTotalFat = 0
      let weekTotalFiber = 0
      let weekMealsPlanned = 0
      let weekMealsEaten = 0
      let weekMealsSkipped = 0
      let daysWithData = 0

      for (const day of daysInWeek) {
        const dayStr = format(day, 'yyyy-MM-dd')
        const dayLog = dailyLogs.find(
          (log) => new Date(log.date).toISOString().slice(0, 10) === dayStr
        )
        const dayItems = dayLog?.meals || []

        if (dayItems.length === 0) {
          dailySummaries.push({
            date: dayStr,
            dayOfWeek: format(day, 'EEEE'),
            totalCalories: 0,
            totalProtein: 0,
            totalNetCarbs: 0,
            totalFat: 0,
            totalFiber: 0,
            mealsPlanned: 0,
            mealsEaten: 0,
            mealsSkipped: 0,
            adherenceRate: 0,
            calorieTargetMet: false,
            proteinTargetMet: false,
            carbsUnderLimit: true,
            meals: [],
          })
          continue
        }

        daysWithData++
        totalDaysTracked++

        // Calculate macros using recipe-fallback pattern with servings multiplier
        let dayCalories = 0
        let dayProtein = 0
        let dayNetCarbs = 0
        let dayFat = 0
        let dayFiber = 0
        const mealSummaries: MealSummary[] = []

        for (const item of dayItems) {
          const recipe = item.recipe as { calories?: number | null; protein?: number | null; carbs?: number | null; fiber?: number | null; fat?: number | null; netCarbs?: number | null } | null
          const servingsMultiplier = item.actualServings ?? item.servings ?? 1

          const mealCal = (recipe?.calories ?? item.calories ?? 0) * servingsMultiplier
          const mealProt = (recipe?.protein ?? item.protein ?? 0) * servingsMultiplier
          const mealNC = (recipe?.netCarbs ?? item.netCarbs ?? 0) * servingsMultiplier
          const mealFat = (recipe?.fat ?? item.fat ?? 0) * servingsMultiplier
          const mealFiber = (recipe?.fiber ?? item.fiber ?? 0) * servingsMultiplier

          dayCalories += mealCal
          dayProtein += mealProt
          dayNetCarbs += mealNC
          dayFat += mealFat
          dayFiber += mealFiber

          // Track meal frequencies (only eaten meals)
          if (item.eaten) {
            mealNameCounts[item.mealName] = (mealNameCounts[item.mealName] || 0) + 1
          }

          mealSummaries.push({
            mealType: item.mealType || 'UNKNOWN',
            mealName: item.mealName || 'Unknown meal',
            eaten: item.eaten,
            skipped: item.skipped,
            isLeftover: item.isLeftover,
            calories: Math.round(mealCal),
            protein: Math.round(mealProt),
            netCarbs: Math.round(mealNC),
            fat: Math.round(mealFat),
            fiber: Math.round(mealFiber),
          })
        }

        const dayMealsPlanned = dayItems.length
        const dayMealsEaten = dayItems.filter((item) => item.eaten).length
        const dayMealsSkipped = dayItems.filter((item) => item.skipped).length

        weekTotalCalories += dayCalories
        weekTotalProtein += dayProtein
        weekTotalNetCarbs += dayNetCarbs
        weekTotalFat += dayFat
        weekTotalFiber += dayFiber
        weekMealsPlanned += dayMealsPlanned
        weekMealsEaten += dayMealsEaten
        weekMealsSkipped += dayMealsSkipped

        const roundedCal = Math.round(dayCalories)
        const roundedProt = Math.round(dayProtein)
        const roundedNC = Math.round(dayNetCarbs)

        dailySummaries.push({
          date: dayStr,
          dayOfWeek: format(day, 'EEEE'),
          totalCalories: roundedCal,
          totalProtein: roundedProt,
          totalNetCarbs: roundedNC,
          totalFat: Math.round(dayFat),
          totalFiber: Math.round(dayFiber),
          mealsPlanned: dayMealsPlanned,
          mealsEaten: dayMealsEaten,
          mealsSkipped: dayMealsSkipped,
          adherenceRate: dayMealsPlanned > 0 ? Math.round((dayMealsEaten / dayMealsPlanned) * 100) : 0,
          calorieTargetMet: roundedCal >= questionnaire.dailyCalories * 0.9,
          proteinTargetMet: roundedProt >= questionnaire.dailyProtein * 0.9,
          carbsUnderLimit: roundedNC <= questionnaire.dailyNetCarbs,
          meals: mealSummaries,
        })
      }

      weeklyData.push({
        weekOf: format(weekStart, 'yyyy-MM-dd'),
        weekEnd: format(weekEnd, 'yyyy-MM-dd'),
        avgCalories: daysWithData > 0 ? Math.round(weekTotalCalories / daysWithData) : 0,
        avgProtein: daysWithData > 0 ? Math.round(weekTotalProtein / daysWithData) : 0,
        avgNetCarbs: daysWithData > 0 ? Math.round(weekTotalNetCarbs / daysWithData) : 0,
        avgFat: daysWithData > 0 ? Math.round(weekTotalFat / daysWithData) : 0,
        avgFiber: daysWithData > 0 ? Math.round(weekTotalFiber / daysWithData) : 0,
        totalMealsPlanned: weekMealsPlanned,
        totalMealsEaten: weekMealsEaten,
        totalMealsSkipped: weekMealsSkipped,
        adherenceRate: weekMealsPlanned > 0 ? Math.round((weekMealsEaten / weekMealsPlanned) * 100) : 0,
        daysTracked: daysWithData,
        days: dailySummaries,
      })

      currentWeekStart = addWeeks(currentWeekStart, 1)
    }

    // Calculate overall summary
    const totalMealsPlanned = weeklyData.reduce((sum, w) => sum + w.totalMealsPlanned, 0)
    const totalMealsEaten = weeklyData.reduce((sum, w) => sum + w.totalMealsEaten, 0)
    const totalMealsSkipped = weeklyData.reduce((sum, w) => sum + w.totalMealsSkipped, 0)
    const weeksWithData = weeklyData.filter((w) => w.totalMealsPlanned > 0).length

    const overallAvgCalories = weeksWithData > 0
      ? Math.round(weeklyData.reduce((sum, w) => sum + w.avgCalories, 0) / weeksWithData)
      : 0
    const overallAvgProtein = weeksWithData > 0
      ? Math.round(weeklyData.reduce((sum, w) => sum + w.avgProtein, 0) / weeksWithData)
      : 0
    const overallAvgNetCarbs = weeksWithData > 0
      ? Math.round(weeklyData.reduce((sum, w) => sum + w.avgNetCarbs, 0) / weeksWithData)
      : 0
    const overallAvgFat = weeksWithData > 0
      ? Math.round(weeklyData.reduce((sum, w) => sum + w.avgFat, 0) / weeksWithData)
      : 0
    const overallAvgFiber = weeksWithData > 0
      ? Math.round(weeklyData.reduce((sum, w) => sum + w.avgFiber, 0) / weeksWithData)
      : 0

    // Build insights
    const allDaysWithData = weeklyData.flatMap(w => w.days).filter(d => d.mealsPlanned > 0)
    const daysUnderProtein = allDaysWithData.filter(d => !d.proteinTargetMet).length
    const daysOverCarbs = allDaysWithData.filter(d => !d.carbsUnderLimit).length
    const daysLowCalories = allDaysWithData.filter(d => d.totalCalories < questionnaire.dailyCalories * 0.8).length

    // Most common meals (top 5)
    const mostCommonMeals = Object.entries(mealNameCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))

    // Week-over-week trends
    const weeklyTrends = weeklyData.map((week, i) => {
      const prev = i > 0 ? weeklyData[i - 1] : null
      return {
        weekOf: week.weekOf,
        caloriesDelta: prev ? week.avgCalories - prev.avgCalories : 0,
        proteinDelta: prev ? week.avgProtein - prev.avgProtein : 0,
        netCarbsDelta: prev ? week.avgNetCarbs - prev.avgNetCarbs : 0,
        adherenceDelta: prev ? week.adherenceRate - prev.adherenceRate : 0,
      }
    })

    // Generate flags
    const flags: string[] = []
    const weeksUnderProtein = weeklyData.filter(w => w.daysTracked > 0 && w.avgProtein < questionnaire.dailyProtein * 0.9).length
    if (weeksUnderProtein >= Math.ceil(weeksWithData / 2) && weeksWithData > 0) {
      flags.push(`Protein below target ${weeksUnderProtein} of ${weeksWithData} weeks`)
    }
    const weeksOverCarbs = weeklyData.filter(w => w.daysTracked > 0 && w.avgNetCarbs > questionnaire.dailyNetCarbs).length
    if (weeksOverCarbs >= Math.ceil(weeksWithData / 2) && weeksWithData > 0) {
      flags.push(`Net carbs over limit ${weeksOverCarbs} of ${weeksWithData} weeks`)
    }
    if (daysLowCalories > totalDaysTracked * 0.3 && totalDaysTracked > 0) {
      flags.push(`Low calorie intake on ${daysLowCalories} of ${totalDaysTracked} tracked days`)
    }
    const overallAdherence = totalMealsPlanned > 0 ? Math.round((totalMealsEaten / totalMealsPlanned) * 100) : 0
    if (overallAdherence < 70 && totalMealsPlanned > 0) {
      flags.push(`Overall adherence below 70% (${overallAdherence}%)`)
    }

    // Build protocol from questionnaire
    const restrictionsByType: Record<string, { foodName: string; severity: string; notes: string | null }[]> = {}
    for (const r of questionnaire.restrictions) {
      if (!restrictionsByType[r.restrictionType]) {
        restrictionsByType[r.restrictionType] = []
      }
      restrictionsByType[r.restrictionType].push({
        foodName: r.foodName,
        severity: r.severity,
        notes: r.notes,
      })
    }

    return NextResponse.json({
      reportGenerated: new Date().toISOString(),
      dateRange: {
        start: format(queryStart, 'yyyy-MM-dd'),
        end: format(queryEnd, 'yyyy-MM-dd'),
        weeks: weeklyData.length,
      },
      protocol: {
        phase: 'ELIMINATION',
        eatingWindow: `${questionnaire.eatingWindowStart} - ${questionnaire.eatingWindowEnd}`,
        restrictions: questionnaire.restrictions.map(r => ({
          foodName: r.foodName,
          type: r.restrictionType,
          severity: r.severity,
          notes: r.notes,
        })),
        restrictionsByType,
        healthGoals: questionnaire.healthGoals,
        allowLeftovers: questionnaire.allowLeftovers,
        maxLeftoverHours: questionnaire.maxLeftoverHours,
        includeSmoothie: questionnaire.includeSmoothie,
        includeMorningCoffee: questionnaire.includeMorningCoffee,
      },
      targets: {
        dailyCalories: questionnaire.dailyCalories,
        dailyProtein: questionnaire.dailyProtein,
        dailyNetCarbs: questionnaire.dailyNetCarbs,
        eatingWindow: `${questionnaire.eatingWindowStart} - ${questionnaire.eatingWindowEnd}`,
      },
      summary: {
        totalMealsPlanned,
        totalMealsEaten,
        totalMealsSkipped,
        totalDaysTracked,
        overallAdherenceRate: overallAdherence,
        avgDailyCalories: overallAvgCalories,
        avgDailyProtein: overallAvgProtein,
        avgDailyNetCarbs: overallAvgNetCarbs,
        avgDailyFat: overallAvgFat,
        avgDailyFiber: overallAvgFiber,
        calorieTargetMet: overallAvgCalories >= questionnaire.dailyCalories * 0.9,
        proteinTargetMet: overallAvgProtein >= questionnaire.dailyProtein * 0.9,
        carbsUnderLimit: overallAvgNetCarbs <= questionnaire.dailyNetCarbs,
      },
      insights: {
        daysUnderProtein,
        daysOverCarbs,
        daysLowCalories,
        totalDaysTracked,
        mostCommonMeals,
        weeklyTrends,
        flags,
      },
      weeklyBreakdown: weeklyData,
    })
  } catch (error) {
    console.error('Failed to generate report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}

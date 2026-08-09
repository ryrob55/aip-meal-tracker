import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserId, isAuthError } from '@/lib/auth-helpers'
import { calculateAllCorrelations, type DayData } from '@/lib/correlation-engine'
import { generateNutrientNudges } from '@/lib/nutrient-tracking'
import { generateNudges } from '@/lib/nudge-engine'
import { CORE_SYMPTOMS, type SymptomId } from '@/lib/symptom-utils'

// Helper: get effective macros from a meal entry (recipe fallback pattern)
function getMealMacros(meal: {
  eaten: boolean
  calories: number | null
  protein: number | null
  netCarbs: number | null
  fat: number | null
  fiber: number | null
  servings: number
  actualServings: number | null
  recipe: { calories: number | null; protein: number | null; netCarbs: number | null; fat: number | null; fiber: number | null } | null
}) {
  if (!meal.eaten) return { calories: 0, protein: 0, netCarbs: 0, fat: 0, fiber: 0 }
  const s = meal.actualServings ?? meal.servings ?? 1
  return {
    calories: (meal.recipe?.calories ?? meal.calories ?? 0) * s,
    protein: (meal.recipe?.protein ?? meal.protein ?? 0) * s,
    netCarbs: (meal.recipe?.netCarbs ?? meal.netCarbs ?? 0) * s,
    fat: (meal.recipe?.fat ?? meal.fat ?? 0) * s,
    fiber: (meal.recipe?.fiber ?? meal.fiber ?? 0) * s,
  }
}

// GET /api/insights - Get correlations, nudges, macro insights, and nutrient nudges
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const since = new Date()
    since.setDate(since.getDate() - days)

    // Fetch symptom logs, meal logs (with recipes!), reintro tests, settings, questionnaire
    const [symptomLogs, dailyLogs, reintroTests, settings, questionnaire] = await Promise.all([
      prisma.symptomLog.findMany({
        where: { userId, date: { gte: since } },
        orderBy: { date: 'asc' },
      }),
      prisma.aIPDailyLog.findMany({
        where: { userId, date: { gte: since } },
        include: { meals: { include: { recipe: true } } },
        orderBy: { date: 'asc' },
      }),
      prisma.reintroductionTest.findMany({
        where: { userId },
      }),
      prisma.userSettings.findUnique({ where: { userId } }),
      prisma.aIPQuestionnaire.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      }),
    ])

    // Also fetch today's log separately if not in range
    const today = new Date().toISOString().split('T')[0]
    let todayLog = dailyLogs.find(
      (l) => new Date(l.date).toISOString().split('T')[0] === today
    )
    if (!todayLog) {
      const todayResult = await prisma.aIPDailyLog.findFirst({
        where: {
          userId,
          date: {
            gte: new Date(today),
            lt: new Date(new Date(today).getTime() + 86400000),
          },
        },
        include: { meals: { include: { recipe: true } } },
      })
      if (todayResult) todayLog = todayResult
    }

    // Build day data for correlation engine
    const dayDataMap = new Map<string, DayData>()

    // Add symptom data
    for (const log of symptomLogs) {
      const dateStr = new Date(log.date).toISOString().split('T')[0]
      if (!dayDataMap.has(dateStr)) {
        dayDataMap.set(dateStr, { date: dateStr, foods: [], symptoms: {} })
      }
      const dayData = dayDataMap.get(dateStr)!
      for (const s of CORE_SYMPTOMS) {
        const val = log[s.id as keyof typeof log] as number | null
        if (val != null) {
          const existing = dayData.symptoms[s.id as SymptomId]
          if (existing != null) {
            dayData.symptoms[s.id as SymptomId] = Math.round((existing + val) / 2)
          } else {
            dayData.symptoms[s.id as SymptomId] = val
          }
        }
      }
    }

    // --- Build per-day macro data + food tracking ---
    const foodsByDay: Record<string, string[]> = {}
    const foodFrequency: Record<string, number> = {}
    const dailyMacros: { date: string; calories: number; protein: number; netCarbs: number; fat: number; fiber: number; mealsEaten: number }[] = []
    const mealTypeBreakdown: Record<string, { count: number; calories: number; protein: number }> = {}

    for (const log of dailyLogs) {
      const dateStr = new Date(log.date).toISOString().split('T')[0]

      // Also add to correlation engine food data
      if (!dayDataMap.has(dateStr)) {
        dayDataMap.set(dateStr, { date: dateStr, foods: [], symptoms: {} })
      }
      const dayData = dayDataMap.get(dateStr)!

      const dayFoods: string[] = []
      let dayCal = 0, dayProt = 0, dayNC = 0, dayFat = 0, dayFiber = 0, mealsEaten = 0

      for (const meal of log.meals) {
        const macros = getMealMacros(meal as Parameters<typeof getMealMacros>[0])

        if (meal.eaten) {
          mealsEaten++
          dayCal += macros.calories
          dayProt += macros.protein
          dayNC += macros.netCarbs
          dayFat += macros.fat
          dayFiber += macros.fiber

          // Food name tracking
          if (meal.mealName) {
            dayData.foods.push(meal.mealName)
            dayFoods.push(meal.mealName)
            const cleanName = meal.mealName.replace(/^(AIP\s+|Leftover:\s*)/i, '').trim()
            foodFrequency[cleanName] = (foodFrequency[cleanName] || 0) + 1
          }

          // Meal type breakdown
          const mt = meal.mealType
          if (!mealTypeBreakdown[mt]) mealTypeBreakdown[mt] = { count: 0, calories: 0, protein: 0 }
          mealTypeBreakdown[mt].count++
          mealTypeBreakdown[mt].calories += macros.calories
          mealTypeBreakdown[mt].protein += macros.protein
        }
      }

      foodsByDay[dateStr] = dayFoods
      if (mealsEaten > 0) {
        dailyMacros.push({ date: dateStr, calories: dayCal, protein: dayProt, netCarbs: dayNC, fat: dayFat, fiber: dayFiber, mealsEaten })
      }
    }

    // --- Macro stats ---
    const daysWithData = dailyMacros.length
    const avgCalories = daysWithData > 0 ? Math.round(dailyMacros.reduce((s, d) => s + d.calories, 0) / daysWithData) : 0
    const avgProtein = daysWithData > 0 ? Math.round(dailyMacros.reduce((s, d) => s + d.protein, 0) / daysWithData) : 0
    const avgNetCarbs = daysWithData > 0 ? Math.round(dailyMacros.reduce((s, d) => s + d.netCarbs, 0) / daysWithData) : 0
    const avgFat = daysWithData > 0 ? Math.round(dailyMacros.reduce((s, d) => s + d.fat, 0) / daysWithData) : 0

    // Macro adherence rate
    let macroAdherenceRate: number | undefined
    if (questionnaire && daysWithData > 0) {
      const daysHitting = dailyMacros.filter(
        (d) => d.calories >= questionnaire.dailyCalories * 0.8 && d.protein >= questionnaire.dailyProtein * 0.8
      ).length
      macroAdherenceRate = Math.round((daysHitting / daysWithData) * 100)
    }

    // Weekly trends (this week vs last week)
    const thisWeekStart = new Date()
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay())
    const thisWeekStr = thisWeekStart.toISOString().split('T')[0]
    const lastWeekStart = new Date(thisWeekStart)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)
    const lastWeekStr = lastWeekStart.toISOString().split('T')[0]

    const thisWeekDays = dailyMacros.filter((d) => d.date >= thisWeekStr)
    const lastWeekDays = dailyMacros.filter((d) => d.date >= lastWeekStr && d.date < thisWeekStr)

    const avgThis = thisWeekDays.length > 0
      ? { calories: Math.round(thisWeekDays.reduce((s, d) => s + d.calories, 0) / thisWeekDays.length), protein: Math.round(thisWeekDays.reduce((s, d) => s + d.protein, 0) / thisWeekDays.length) }
      : null
    const avgLast = lastWeekDays.length > 0
      ? { calories: Math.round(lastWeekDays.reduce((s, d) => s + d.calories, 0) / lastWeekDays.length), protein: Math.round(lastWeekDays.reduce((s, d) => s + d.protein, 0) / lastWeekDays.length) }
      : null

    const weeklyTrend = avgThis && avgLast
      ? { caloriesDelta: avgThis.calories - avgLast.calories, proteinDelta: avgThis.protein - avgLast.protein }
      : null

    // Meal type breakdown (format for frontend)
    const MEAL_TYPE_LABELS: Record<string, string> = {
      MORNING_COFFEE: 'Coffee',
      SMOOTHIE: 'Smoothie',
      LUNCH: 'Lunch',
      AFTERNOON_SNACK: 'Snack',
      DINNER: 'Dinner',
      EVENING_SNACK: 'Eve Snack',
      EXTRA_SNACKS: 'Extras',
    }
    const mealBreakdown = Object.entries(mealTypeBreakdown)
      .map(([type, data]) => ({
        type,
        label: MEAL_TYPE_LABELS[type] || type,
        count: data.count,
        avgCalories: data.count > 0 ? Math.round(data.calories / data.count) : 0,
        avgProtein: data.count > 0 ? Math.round(data.protein / data.count) : 0,
        totalProtein: Math.round(data.protein),
        proteinShare: 0,
      }))
      .sort((a, b) => b.totalProtein - a.totalProtein)

    const totalProteinAll = mealBreakdown.reduce((s, m) => s + m.totalProtein, 0)
    for (const m of mealBreakdown) {
      m.proteinShare = totalProteinAll > 0 ? Math.round((m.totalProtein / totalProteinAll) * 100) : 0
    }

    // Today's gap analysis
    let todayGap: { calories: number; protein: number; netCarbs: number; mealsLogged: number } | null = null
    if (questionnaire && todayLog) {
      let todayCal = 0, todayProt = 0, todayNC = 0, todayMeals = 0
      for (const meal of todayLog.meals) {
        const macros = getMealMacros(meal as Parameters<typeof getMealMacros>[0])
        if (meal.eaten) {
          todayCal += macros.calories
          todayProt += macros.protein
          todayNC += macros.netCarbs
          todayMeals++
        }
      }
      todayGap = {
        calories: questionnaire.dailyCalories - Math.round(todayCal),
        protein: questionnaire.dailyProtein - Math.round(todayProt),
        netCarbs: questionnaire.dailyNetCarbs - Math.round(todayNC),
        mealsLogged: todayMeals,
      }
    }

    // Unique foods
    const allFoods = new Set<string>()
    for (const foods of Object.values(foodsByDay)) {
      for (const food of foods) {
        allFoods.add(food.replace(/^(AIP\s+|Leftover:\s*)/i, '').trim().toLowerCase())
      }
    }

    // Calculate correlations
    const dayDataArray = Array.from(dayDataMap.values())
    const correlations = calculateAllCorrelations(dayDataArray)

    // Generate nutrient nudges
    const nutrientNudges = generateNutrientNudges(foodsByDay, days)

    // Streak (days logged in last 7)
    const last7 = new Set<string>()
    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      if (foodsByDay[ds] && foodsByDay[ds].length > 0) last7.add(ds)
    }

    const mealsLoggedToday = todayLog
      ? todayLog.meals.filter((m) => m.eaten).length
      : 0
    const symptomsLoggedToday = symptomLogs.some(
      (l) => new Date(l.date).toISOString().split('T')[0] === today
    )

    const daysOnProtocol = settings?.protocolStartDate
      ? Math.floor(
          (Date.now() - new Date(settings.protocolStartDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0

    const activeTest = reintroTests.find((t) =>
      ['TESTING_DAY0', 'OBSERVING', 'CONFIRMING'].includes(t.status)
    )
    const completedTests = reintroTests.filter(
      (t) => t.status === 'COMPLETE'
    ).length

    // Top correlation for nudge
    const topCorrelation = correlations[0]
    const topCorrelationFood = topCorrelation
      ? {
          food: topCorrelation.foodName,
          delta: topCorrelation.delta,
          symptom:
            CORE_SYMPTOMS.find((s) => s.id === topCorrelation.symptomType)
              ?.label || topCorrelation.symptomType,
        }
      : undefined

    const nudges = generateNudges({
      daysOnProtocol,
      mealsLoggedToday,
      symptomsLoggedToday,
      activeReintroTest: !!activeTest,
      completedReintroTests: completedTests,
      streakDays: last7.size,
      topCorrelationFood,
      macroAdherenceRate,
    })

    // Save/update top correlations to DB for persistence
    for (const c of correlations.slice(0, 20)) {
      await prisma.foodSymptomCorrelation.upsert({
        where: {
          userId_foodName_symptomType: {
            userId,
            foodName: c.foodName,
            symptomType: c.symptomType,
          },
        },
        create: {
          userId,
          foodName: c.foodName,
          symptomType: c.symptomType,
          correlation: c.correlation,
          sampleSize: c.sampleSize,
          confidence: c.confidence,
          lastCalculated: new Date(),
        },
        update: {
          correlation: c.correlation,
          sampleSize: c.sampleSize,
          confidence: c.confidence,
          lastCalculated: new Date(),
        },
      })
    }

    // Top foods with avg macros
    const foodMacros: Record<string, { calories: number; protein: number; count: number }> = {}
    for (const log of dailyLogs) {
      for (const meal of log.meals) {
        if (meal.eaten && meal.mealName) {
          const cleanName = meal.mealName.replace(/^(AIP\s+|Leftover:\s*)/i, '').trim()
          const macros = getMealMacros(meal as Parameters<typeof getMealMacros>[0])
          if (!foodMacros[cleanName]) foodMacros[cleanName] = { calories: 0, protein: 0, count: 0 }
          foodMacros[cleanName].calories += macros.calories
          foodMacros[cleanName].protein += macros.protein
          foodMacros[cleanName].count++
        }
      }
    }

    const topFoods = Object.entries(foodFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({
        name,
        count,
        avgCalories: foodMacros[name] ? Math.round(foodMacros[name].calories / foodMacros[name].count) : 0,
        avgProtein: foodMacros[name] ? Math.round(foodMacros[name].protein / foodMacros[name].count) : 0,
      }))

    return NextResponse.json({
      correlations: correlations.slice(0, 20),
      nutrientNudges: nutrientNudges.slice(0, 5),
      nudges,
      topFoods,
      mealBreakdown,
      weeklyTrend,
      todayGap,
      stats: {
        daysAnalyzed: daysWithData,
        uniqueFoods: allFoods.size,
        streakDays: last7.size,
        daysOnProtocol,
        macroAdherenceRate,
        avgCalories,
        avgProtein,
        avgNetCarbs,
        avgFat,
      },
      targets: questionnaire ? {
        calories: questionnaire.dailyCalories,
        protein: questionnaire.dailyProtein,
        netCarbs: questionnaire.dailyNetCarbs,
      } : null,
    })
  } catch (error) {
    console.error('Failed to generate insights:', error)
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    )
  }
}

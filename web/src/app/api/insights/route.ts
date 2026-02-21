import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserId, isAuthError } from '@/lib/auth-helpers'
import { calculateAllCorrelations, type DayData } from '@/lib/correlation-engine'
import { generateNutrientNudges } from '@/lib/nutrient-tracking'
import { generateNudges } from '@/lib/nudge-engine'
import { CORE_SYMPTOMS, type SymptomId } from '@/lib/symptom-utils'

// GET /api/insights - Get correlations, nudges, and nutrient nudges
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const since = new Date()
    since.setDate(since.getDate() - days)

    // Fetch symptom logs and meal logs in parallel
    const [symptomLogs, dailyLogs, reintroTests, settings] = await Promise.all([
      prisma.symptomLog.findMany({
        where: { userId, date: { gte: since } },
        orderBy: { date: 'asc' },
      }),
      prisma.aIPDailyLog.findMany({
        where: { userId, date: { gte: since } },
        include: { meals: true },
        orderBy: { date: 'asc' },
      }),
      prisma.reintroductionTest.findMany({
        where: { userId },
      }),
      prisma.userSettings.findUnique({ where: { userId } }),
    ])

    // Build day data for correlation engine
    const dayDataMap = new Map<string, DayData>()

    // Add symptom data
    for (const log of symptomLogs) {
      const dateStr = new Date(log.date).toISOString().split('T')[0]
      if (!dayDataMap.has(dateStr)) {
        dayDataMap.set(dateStr, { date: dateStr, foods: [], symptoms: {} })
      }
      const dayData = dayDataMap.get(dateStr)!
      // Merge symptom scores (average morning/evening if both exist)
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

    // Add food data from meal logs
    const foodsByDay: Record<string, string[]> = {}

    for (const log of dailyLogs) {
      const dateStr = new Date(log.date).toISOString().split('T')[0]
      if (!dayDataMap.has(dateStr)) {
        dayDataMap.set(dateStr, { date: dateStr, foods: [], symptoms: {} })
      }
      const dayData = dayDataMap.get(dateStr)!

      const dayFoods: string[] = []
      for (const meal of log.meals) {
        if (meal.eaten && meal.mealName) {
          dayData.foods.push(meal.mealName)
          dayFoods.push(meal.mealName)
        }
      }
      foodsByDay[dateStr] = dayFoods
    }

    // Calculate correlations
    const dayDataArray = Array.from(dayDataMap.values())
    const correlations = calculateAllCorrelations(dayDataArray)

    // Generate nutrient nudges
    const nutrientNudges = generateNutrientNudges(foodsByDay, days)

    // Count today's data for general nudges
    const today = new Date().toISOString().split('T')[0]
    const todayLog = dailyLogs.find(
      (l) => new Date(l.date).toISOString().split('T')[0] === today
    )
    const mealsLoggedToday = todayLog
      ? todayLog.meals.filter((m) => m.eaten).length
      : 0
    const symptomsLoggedToday = symptomLogs.some(
      (l) => new Date(l.date).toISOString().split('T')[0] === today
    )

    // Calculate streak (days logged in last 7)
    const last7 = new Set<string>()
    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      if (dayDataMap.has(ds)) last7.add(ds)
    }

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

    return NextResponse.json({
      correlations: correlations.slice(0, 20),
      nutrientNudges: nutrientNudges.slice(0, 5),
      nudges,
      stats: {
        daysAnalyzed: dayDataArray.length,
        uniqueFoods: new Set(dayDataArray.flatMap((d) => d.foods)).size,
        streakDays: last7.size,
        daysOnProtocol,
      },
    })
  } catch (error) {
    console.error('Failed to generate insights:', error)
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    )
  }
}

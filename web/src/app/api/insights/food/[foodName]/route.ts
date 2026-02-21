import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserId, isAuthError } from '@/lib/auth-helpers'
import { getFoodImpact, type DayData } from '@/lib/correlation-engine'
import { CORE_SYMPTOMS, type SymptomId } from '@/lib/symptom-utils'

// GET /api/insights/food/[foodName] - Get correlations for a specific food
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ foodName: string }> }
) {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    const { foodName } = await params
    const decodedFood = decodeURIComponent(foodName)

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const since = new Date()
    since.setDate(since.getDate() - days)

    const [symptomLogs, dailyLogs] = await Promise.all([
      prisma.symptomLog.findMany({
        where: { userId, date: { gte: since } },
        orderBy: { date: 'asc' },
      }),
      prisma.aIPDailyLog.findMany({
        where: { userId, date: { gte: since } },
        include: { meals: true },
        orderBy: { date: 'asc' },
      }),
    ])

    // Build day data
    const dayDataMap = new Map<string, DayData>()

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

    for (const log of dailyLogs) {
      const dateStr = new Date(log.date).toISOString().split('T')[0]
      if (!dayDataMap.has(dateStr)) {
        dayDataMap.set(dateStr, { date: dateStr, foods: [], symptoms: {} })
      }
      const dayData = dayDataMap.get(dateStr)!
      for (const meal of log.meals) {
        if (meal.eaten && meal.mealName) {
          dayData.foods.push(meal.mealName)
        }
      }
    }

    const dayDataArray = Array.from(dayDataMap.values())
    const impact = getFoodImpact(dayDataArray, decodedFood)

    if (!impact) {
      return NextResponse.json({
        foodName: decodedFood,
        message: 'Not enough data to calculate correlations for this food. Keep logging meals and symptoms!',
        avgDelta: 0,
        symptomResults: [],
        daysWithFood: 0,
        daysWithoutFood: 0,
      })
    }

    // Count days with/without food
    const foodLower = decodedFood.toLowerCase()
    let daysWithFood = 0
    let daysWithoutFood = 0
    for (const day of dayDataArray) {
      if (day.foods.some((f) => f.toLowerCase().includes(foodLower))) {
        daysWithFood++
      } else {
        daysWithoutFood++
      }
    }

    return NextResponse.json({
      foodName: decodedFood,
      avgDelta: impact.avgDelta,
      symptomResults: impact.symptomResults,
      daysWithFood,
      daysWithoutFood,
      daysAnalyzed: dayDataArray.length,
    })
  } catch (error) {
    console.error('Failed to get food impact:', error)
    return NextResponse.json(
      { error: 'Failed to get food impact' },
      { status: 500 }
    )
  }
}

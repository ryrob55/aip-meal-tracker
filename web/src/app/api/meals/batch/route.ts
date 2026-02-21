import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserId, isAuthError } from '@/lib/auth-helpers'

interface BatchMealEntry {
  mealType: string
  mealName: string
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  fiber?: number
  netCarbs?: number
  servings?: number
}

// POST /api/meals/batch - Batch-create meals for a day
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    const body = await request.json()
    const { date, meals } = body as { date: string; meals: BatchMealEntry[] }

    if (!date || !meals || meals.length === 0) {
      return NextResponse.json(
        { error: 'date and meals are required' },
        { status: 400 }
      )
    }

    const logDate = new Date(date)

    // Upsert daily log
    const dailyLog = await prisma.aIPDailyLog.upsert({
      where: { userId_date: { userId: userId, date: logDate } },
      create: { userId, date: logDate },
      update: {},
    })

    // Create meal entries
    const created = []
    for (let i = 0; i < meals.length; i++) {
      const meal = meals[i]
      const entry = await prisma.aIPMealEntry.create({
        data: {
          dailyLogId: dailyLog.id,
          mealType: meal.mealType as never,
          mealName: meal.mealName,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
          fiber: meal.fiber,
          netCarbs: meal.netCarbs,
          servings: meal.servings ?? 1,
          eaten: true,
          eatenAt: new Date(),
          itemIndex: i,
        },
      })
      created.push(entry)
    }

    return NextResponse.json({ dailyLog, meals: created }, { status: 201 })
  } catch (error) {
    console.error('Failed to batch create meals:', error)
    return NextResponse.json(
      { error: 'Failed to batch create meals' },
      { status: 500 }
    )
  }
}

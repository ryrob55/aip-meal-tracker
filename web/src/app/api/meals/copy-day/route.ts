import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserId, isAuthError } from '@/lib/auth-helpers'

// POST /api/meals/copy-day - Copy all meals from one day to another
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    const body = await request.json()
    const { fromDate, toDate } = body

    if (!fromDate || !toDate) {
      return NextResponse.json(
        { error: 'fromDate and toDate are required' },
        { status: 400 }
      )
    }

    const sourceDate = new Date(fromDate)
    const targetDate = new Date(toDate)

    // Find source day's log
    const sourceLog = await prisma.aIPDailyLog.findFirst({
      where: { userId, date: sourceDate },
      include: { meals: true },
    })

    if (!sourceLog || sourceLog.meals.length === 0) {
      return NextResponse.json(
        { error: 'No meals found on the source date' },
        { status: 404 }
      )
    }

    // Upsert target day's log
    const targetLog = await prisma.aIPDailyLog.upsert({
      where: { userId_date: { userId: userId, date: targetDate } },
      create: { userId, date: targetDate },
      update: {},
    })

    // Copy meals
    const copied = []
    for (const meal of sourceLog.meals) {
      const entry = await prisma.aIPMealEntry.create({
        data: {
          dailyLogId: targetLog.id,
          mealType: meal.mealType,
          mealName: meal.mealName,
          scheduledTime: meal.scheduledTime,
          servings: meal.servings,
          recipeId: meal.recipeId,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fiber: meal.fiber,
          fat: meal.fat,
          netCarbs: meal.netCarbs,
          eaten: false,
          itemIndex: meal.itemIndex,
        },
      })
      copied.push(entry)
    }

    return NextResponse.json(
      { message: `Copied ${copied.length} meals`, meals: copied },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to copy day:', error)
    return NextResponse.json(
      { error: 'Failed to copy meals' },
      { status: 500 }
    )
  }
}

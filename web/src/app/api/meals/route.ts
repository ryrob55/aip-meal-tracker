import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserId, isAuthError } from '@/lib/auth-helpers'
import { startOfWeek, parseISO } from 'date-fns'

// Helper to parse date string without timezone issues
function parseDateSafe(dateStr: string): Date {
  if (dateStr.includes('T')) {
    const datePart = dateStr.split('T')[0]
    return new Date(datePart + 'T12:00:00')
  }
  return new Date(dateStr + 'T12:00:00')
}

// GET /api/meals - Get meal plan for a week
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    const searchParams = request.nextUrl.searchParams
    const weekOf = searchParams.get('weekOf')

    const targetDate = weekOf ? parseISO(weekOf) : new Date()
    const weekStart = startOfWeek(targetDate)

    // Find or create meal plan for this week
    let mealPlan = await prisma.mealPlan.findFirst({
      where: {
        userId,
        weekStartDate: weekStart,
      },
      include: {
        items: {
          include: {
            recipe: true,
          },
          orderBy: {
            date: 'asc',
          },
        },
        groceryList: {
          include: {
            items: true,
          },
        },
      },
    })

    if (!mealPlan) {
      mealPlan = await prisma.mealPlan.create({
        data: {
          userId,
          weekStartDate: weekStart,
          status: 'DRAFT',
        },
        include: {
          items: {
            include: {
              recipe: true,
            },
          },
          groceryList: {
            include: {
              items: true,
            },
          },
        },
      })
    }

    return NextResponse.json(mealPlan)
  } catch (error) {
    console.error('Failed to fetch meal plan:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meal plan' },
      { status: 500 }
    )
  }
}

// POST /api/meals - Add a meal to the plan
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    const body = await request.json()
    const { mealPlanId: providedMealPlanId, recipeId, date, notes, servings = 1 } = body

    if (!recipeId) {
      return NextResponse.json(
        { error: 'recipeId is required' },
        { status: 400 }
      )
    }

    const mealDate = parseDateSafe(date)
    const weekStart = startOfWeek(mealDate)

    // Find or create meal plan if not provided
    let mealPlanId = providedMealPlanId
    if (!mealPlanId) {
      let mealPlan = await prisma.mealPlan.findFirst({
        where: { userId, weekStartDate: weekStart },
      })
      if (!mealPlan) {
        mealPlan = await prisma.mealPlan.create({
          data: {
            userId,
            weekStartDate: weekStart,
            status: 'DRAFT',
          },
        })
      }
      mealPlanId = mealPlan.id
    }

    // Check if there's already a meal for this day
    const existingItem = await prisma.mealPlanItem.findFirst({
      where: {
        mealPlanId,
        date: mealDate,
      },
    })

    let mealPlanItem
    if (existingItem) {
      // Update existing meal
      mealPlanItem = await prisma.mealPlanItem.update({
        where: { id: existingItem.id },
        data: {
          recipeId,
          servings,
          notes,
        },
        include: {
          recipe: true,
        },
      })
    } else {
      // Create new meal
      mealPlanItem = await prisma.mealPlanItem.create({
        data: {
          mealPlanId,
          recipeId,
          date: mealDate,
          servings,
          notes,
        },
        include: {
          recipe: true,
        },
      })
    }

    return NextResponse.json(mealPlanItem, { status: 201 })
  } catch (error) {
    console.error('Failed to add meal:', error)
    return NextResponse.json(
      { error: 'Failed to add meal' },
      { status: 500 }
    )
  }
}

// PUT /api/meals - Update meal plan status (confirm)
export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    const body = await request.json()
    const { mealPlanId, status } = body

    // Verify ownership
    const existing = await prisma.mealPlan.findFirst({
      where: { id: mealPlanId, userId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const mealPlan = await prisma.mealPlan.update({
      where: { id: mealPlanId },
      data: { status },
      include: {
        items: {
          include: {
            recipe: true,
          },
        },
      },
    })

    return NextResponse.json(mealPlan)
  } catch (error) {
    console.error('Failed to update meal plan:', error)
    return NextResponse.json(
      { error: 'Failed to update meal plan' },
      { status: 500 }
    )
  }
}

// PATCH /api/meals - Update a meal plan item (servings, notes)
export async function PATCH(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    const body = await request.json()
    const { itemId, servings, notes } = body

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID required' },
        { status: 400 }
      )
    }

    // Verify ownership through meal plan
    const item = await prisma.mealPlanItem.findUnique({
      where: { id: itemId },
      include: { mealPlan: { select: { userId: true } } },
    })
    if (!item || item.mealPlan.userId !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const updateData: { servings?: number; notes?: string } = {}
    if (servings !== undefined) updateData.servings = servings
    if (notes !== undefined) updateData.notes = notes

    const mealPlanItem = await prisma.mealPlanItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        recipe: true,
      },
    })

    return NextResponse.json(mealPlanItem)
  } catch (error) {
    console.error('Failed to update meal plan item:', error)
    return NextResponse.json(
      { error: 'Failed to update meal plan item' },
      { status: 500 }
    )
  }
}

// DELETE /api/meals - Remove a meal from the plan
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    const searchParams = request.nextUrl.searchParams
    const itemId = searchParams.get('itemId')

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID required' },
        { status: 400 }
      )
    }

    // Verify ownership through meal plan
    const item = await prisma.mealPlanItem.findUnique({
      where: { id: itemId },
      include: { mealPlan: { select: { userId: true } } },
    })
    if (!item || item.mealPlan.userId !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.mealPlanItem.delete({
      where: { id: itemId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to remove meal:', error)
    return NextResponse.json(
      { error: 'Failed to remove meal' },
      { status: 500 }
    )
  }
}

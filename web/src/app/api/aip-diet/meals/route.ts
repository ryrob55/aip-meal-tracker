import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { startOfWeek, endOfWeek, parseISO, addDays, format } from 'date-fns'
import type { MealType } from '@prisma/client'

// Helper to parse date string without timezone issues
function parseDateSafe(dateStr: string): Date {
  if (dateStr.includes('T')) {
    const datePart = dateStr.split('T')[0]
    return new Date(datePart + 'T12:00:00')
  }
  return new Date(dateStr + 'T12:00:00')
}

// GET /api/aip-diet/meals - Get AIP meals for a date or week
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date')
    const weekOf = searchParams.get('weekOf')

    if (date) {
      // Get single day
      const targetDate = parseDateSafe(date)

      let dailyLog = await prisma.aIPDailyLog.findUnique({
        where: { date: targetDate },
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
                  servings: true,
                  ingredients: true,
                  instructions: true,
                },
              },
            },
          },
        },
      })

      if (!dailyLog) {
        // Create empty log for the day
        dailyLog = await prisma.aIPDailyLog.create({
          data: { date: targetDate },
          include: { meals: { include: { recipe: true } } },
        })
      }

      return NextResponse.json(dailyLog)
    }

    if (weekOf) {
      // Get full week - use UTC dates to match how daily logs are stored (midnight UTC)
      const targetDate = parseISO(weekOf)
      const weekStart = startOfWeek(targetDate, { weekStartsOn: 0 })
      // End of week: 7 days from start (exclusive), so we get exactly Sun-Sat
      const weekEnd = addDays(startOfWeek(targetDate, { weekStartsOn: 0 }), 6)
      // Set weekEnd to end of day in UTC (23:59:59.999Z)
      weekEnd.setUTCHours(23, 59, 59, 999)

      const dailyLogs = await prisma.aIPDailyLog.findMany({
        where: {
          date: {
            gte: weekStart,
            lte: weekEnd,
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
                  servings: true,
                  ingredients: true,
                  instructions: true,
                },
              },
            },
          },
        },
        orderBy: { date: 'asc' },
      })

      // Calculate daily macro totals - prefer recipe macros over stored macros
      const dailyMacros: Record<string, {
        calories: number
        protein: number
        carbs: number
        fiber: number
        netCarbs: number
        fat: number
      }> = {}

      for (const log of dailyLogs) {
        const dateKey = log.date.toISOString().split('T')[0]
        dailyMacros[dateKey] = {
          calories: 0,
          protein: 0,
          carbs: 0,
          fiber: 0,
          netCarbs: 0,
          fat: 0,
        }
        for (const meal of log.meals) {
          // Use recipe macros if linked, otherwise fall back to stored macros
          const recipe = meal.recipe as { calories?: number | null; protein?: number | null; carbs?: number | null; fiber?: number | null; fat?: number | null; netCarbs?: number | null } | null
          // Apply actualServings multiplier (defaults to servings field, then 1)
          const servingsMultiplier = meal.actualServings ?? meal.servings ?? 1
          dailyMacros[dateKey].calories += (recipe?.calories ?? meal.calories ?? 0) * servingsMultiplier
          dailyMacros[dateKey].protein += (recipe?.protein ?? meal.protein ?? 0) * servingsMultiplier
          dailyMacros[dateKey].carbs += (recipe?.carbs ?? meal.carbs ?? 0) * servingsMultiplier
          dailyMacros[dateKey].fiber += (recipe?.fiber ?? meal.fiber ?? 0) * servingsMultiplier
          dailyMacros[dateKey].netCarbs += (recipe?.netCarbs ?? meal.netCarbs ?? 0) * servingsMultiplier
          dailyMacros[dateKey].fat += (recipe?.fat ?? meal.fat ?? 0) * servingsMultiplier
        }
      }

      return NextResponse.json({
        weekStart: weekStart.toISOString(),
        dailyLogs,
        dailyMacros,
      })
    }

    return NextResponse.json({ error: 'date or weekOf parameter required' }, { status: 400 })
  } catch (error) {
    console.error('Failed to fetch AIP meals:', error)
    return NextResponse.json({ error: 'Failed to fetch AIP meals' }, { status: 500 })
  }
}

// POST /api/aip-diet/meals - Add a meal entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      date,
      mealType,
      mealName,
      scheduledTime,
      servings,
      isLeftover,
      originalItemId,
      calories,
      protein,
      carbs,
      fiber,
      fat,
      netCarbs,
    } = body

    if (!date || !mealType || !mealName) {
      return NextResponse.json(
        { error: 'date, mealType, and mealName are required' },
        { status: 400 }
      )
    }

    const mealDate = parseDateSafe(date)

    // Find or create daily log
    let dailyLog = await prisma.aIPDailyLog.findUnique({
      where: { date: mealDate },
    })

    if (!dailyLog) {
      dailyLog = await prisma.aIPDailyLog.create({
        data: { date: mealDate },
      })
    }

    // Find matching recipe to link - recipe macros are the source of truth
    const matchingRecipe = await prisma.recipe.findFirst({
      where: {
        name: { equals: mealName, mode: 'insensitive' },
      },
      select: { id: true },
    })

    // Only store macros on the entry if NO recipe is linked (fallback for custom items)
    // When a recipe is linked, its macros are used and entry macros are cleared
    const entryMacros = matchingRecipe
      ? { calories: null, protein: null, carbs: null, fiber: null, fat: null, netCarbs: null }
      : { calories, protein, carbs, fiber, fat, netCarbs }

    let mealEntry

    if (mealType === 'EXTRA_SNACKS') {
      // EXTRA_SNACKS supports multiple items per day - always create new
      const maxIndexResult = await prisma.aIPMealEntry.aggregate({
        where: {
          dailyLogId: dailyLog.id,
          mealType: 'EXTRA_SNACKS',
        },
        _max: { itemIndex: true },
      })
      const nextIndex = (maxIndexResult._max.itemIndex ?? -1) + 1

      mealEntry = await prisma.aIPMealEntry.create({
        data: {
          dailyLogId: dailyLog.id,
          mealType: mealType as MealType,
          mealName,
          scheduledTime,
          servings: servings || 1,
          isLeftover: isLeftover || false,
          originalItemId,
          recipeId: matchingRecipe?.id || null,
          itemIndex: nextIndex,
          ...entryMacros,
        },
        include: {
          recipe: true,
        },
      })
    } else {
      // All other meal types: upsert (unique by dailyLogId + mealType + itemIndex=0)
      mealEntry = await prisma.aIPMealEntry.upsert({
        where: {
          dailyLogId_mealType_itemIndex: {
            dailyLogId: dailyLog.id,
            mealType: mealType as MealType,
            itemIndex: 0,
          },
        },
        update: {
          mealName,
          scheduledTime,
          servings: servings || 1,
          isLeftover: isLeftover || false,
          originalItemId,
          recipeId: matchingRecipe?.id || null,
          ...entryMacros,
        },
        create: {
          dailyLogId: dailyLog.id,
          mealType: mealType as MealType,
          mealName,
          scheduledTime,
          servings: servings || 1,
          isLeftover: isLeftover || false,
          originalItemId,
          recipeId: matchingRecipe?.id || null,
          itemIndex: 0,
          ...entryMacros,
        },
        include: {
          recipe: true,
        },
      })
    }

    return NextResponse.json(mealEntry, { status: 201 })
  } catch (error) {
    console.error('Failed to add AIP meal:', error)
    return NextResponse.json({ error: 'Failed to add AIP meal' }, { status: 500 })
  }
}

// PUT /api/aip-diet/meals - Update a meal entry (tracking eaten/skipped)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { entryId, ...updates } = body

    if (!entryId) {
      return NextResponse.json({ error: 'entryId is required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}

    if (updates.mealName !== undefined) updateData.mealName = updates.mealName
    if (updates.scheduledTime !== undefined) updateData.scheduledTime = updates.scheduledTime
    if (updates.servings !== undefined) updateData.servings = updates.servings
    if (updates.isLeftover !== undefined) updateData.isLeftover = updates.isLeftover
    if (updates.calories !== undefined) updateData.calories = updates.calories
    if (updates.protein !== undefined) updateData.protein = updates.protein
    if (updates.carbs !== undefined) updateData.carbs = updates.carbs
    if (updates.fiber !== undefined) updateData.fiber = updates.fiber
    if (updates.fat !== undefined) updateData.fat = updates.fat
    if (updates.netCarbs !== undefined) updateData.netCarbs = updates.netCarbs

    // Tracking fields
    if (updates.eaten !== undefined) {
      updateData.eaten = updates.eaten
      if (updates.eaten) {
        updateData.eatenAt = new Date()
        updateData.skipped = false
      } else {
        updateData.eatenAt = null
      }
    }
    if (updates.skipped !== undefined) {
      updateData.skipped = updates.skipped
      if (updates.skipped) {
        updateData.eaten = false
        updateData.eatenAt = null
      }
    }
    if (updates.actualServings !== undefined) updateData.actualServings = updates.actualServings
    if (updates.trackingNotes !== undefined) updateData.trackingNotes = updates.trackingNotes

    const mealEntry = await prisma.aIPMealEntry.update({
      where: { id: entryId },
      data: updateData,
    })

    return NextResponse.json(mealEntry)
  } catch (error) {
    console.error('Failed to update AIP meal:', error)
    return NextResponse.json({ error: 'Failed to update AIP meal' }, { status: 500 })
  }
}

// DELETE /api/aip-diet/meals - Remove a meal entry
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const entryId = searchParams.get('entryId')

    if (!entryId) {
      return NextResponse.json({ error: 'entryId is required' }, { status: 400 })
    }

    await prisma.aIPMealEntry.delete({
      where: { id: entryId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete AIP meal:', error)
    return NextResponse.json({ error: 'Failed to delete AIP meal' }, { status: 500 })
  }
}

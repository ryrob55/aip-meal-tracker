import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { suggestMeals } from '@/lib/llm'
import { startOfWeek, subWeeks, addDays } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { constraints } = body as {
      weekOf?: string
      constraints?: string[]
    }

    // Get all recipes
    const recipes = await prisma.recipe.findMany({
      select: { name: true },
    })
    const availableRecipes = recipes.map((r) => r.name)

    if (availableRecipes.length === 0) {
      return NextResponse.json(
        { error: 'No recipes found. Please add some recipes first.' },
        { status: 400 }
      )
    }

    // Get recent meals (last 2 weeks) from MealPlanItem
    const twoWeeksAgo = subWeeks(new Date(), 2)
    const recentMealItems = await prisma.mealPlanItem.findMany({
      where: {
        date: { gte: twoWeeksAgo },
      },
      include: {
        recipe: {
          select: { name: true },
        },
      },
    })
    const recentMeals = recentMealItems.map((item) => item.recipe.name)

    // Get AI suggestions
    const suggestions = await suggestMeals(availableRecipes, recentMeals, constraints)

    if (suggestions.length === 0) {
      // Fallback: return random recipes if LLM fails
      const shuffled = [...availableRecipes].sort(() => Math.random() - 0.5)
      return NextResponse.json({
        suggestions: shuffled.slice(0, 7),
        source: 'random',
      })
    }

    // Validate suggestions are actual recipes
    const validSuggestions = suggestions.filter((s) =>
      availableRecipes.some((r) => r.toLowerCase() === s.toLowerCase())
    )

    // If some suggestions are invalid, fill with random recipes
    if (validSuggestions.length < 7) {
      const remaining = availableRecipes.filter(
        (r) => !validSuggestions.some((s) => s.toLowerCase() === r.toLowerCase())
      )
      const shuffled = remaining.sort(() => Math.random() - 0.5)
      while (validSuggestions.length < 7 && shuffled.length > 0) {
        validSuggestions.push(shuffled.shift()!)
      }
    }

    return NextResponse.json({
      suggestions: validSuggestions.slice(0, 7),
      source: 'ai',
    })
  } catch (error) {
    console.error('Error suggesting meals:', error)
    return NextResponse.json(
      { error: 'Failed to suggest meals' },
      { status: 500 }
    )
  }
}

// Apply suggestions to the meal plan
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { weekOf, suggestions } = body as {
      weekOf: string
      suggestions: string[]
    }

    if (!weekOf || !suggestions || suggestions.length !== 7) {
      return NextResponse.json(
        { error: 'weekOf and 7 suggestions are required' },
        { status: 400 }
      )
    }

    const weekStart = startOfWeek(new Date(weekOf))

    // Find or create a meal plan for this week
    let mealPlan = await prisma.mealPlan.findFirst({
      where: { weekStartDate: weekStart },
    })

    if (!mealPlan) {
      mealPlan = await prisma.mealPlan.create({
        data: { weekStartDate: weekStart },
      })
    }

    // Get recipe IDs for the suggested meals
    const recipes = await prisma.recipe.findMany({
      where: {
        name: { in: suggestions },
      },
      select: { id: true, name: true },
    })

    const recipeMap = new Map(recipes.map((r) => [r.name.toLowerCase(), r.id]))

    // Create/update meal plan items for each day of the week
    const mealPlanItems = await Promise.all(
      suggestions.map(async (recipeName, index) => {
        const date = addDays(weekStart, index)
        const recipeId = recipeMap.get(recipeName.toLowerCase())

        if (!recipeId) {
          console.warn(`Recipe not found: ${recipeName}`)
          return null
        }

        // Check if there's already an item for this date
        const existingItem = await prisma.mealPlanItem.findFirst({
          where: {
            mealPlanId: mealPlan!.id,
            date: date,
          },
        })

        if (existingItem) {
          // Update existing item
          return prisma.mealPlanItem.update({
            where: { id: existingItem.id },
            data: { recipeId },
            include: { recipe: true },
          })
        }

        // Create new item
        return prisma.mealPlanItem.create({
          data: {
            mealPlanId: mealPlan!.id,
            date,
            recipeId,
          },
          include: { recipe: true },
        })
      })
    )

    return NextResponse.json({
      mealPlanItems: mealPlanItems.filter(Boolean),
      applied: mealPlanItems.filter(Boolean).length,
    })
  } catch (error) {
    console.error('Error applying meal suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to apply meal suggestions' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserId, isAuthError } from '@/lib/auth-helpers'
import { generateRecipeDetails } from '@/lib/llm'

// POST /api/recipes/quick - Quick create a placeholder recipe
// Optionally generates details using local LLM
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    const body = await request.json()
    const { name, generateDetails = false } = body as {
      name: string
      generateDetails?: boolean
    }

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Recipe name is required' },
        { status: 400 }
      )
    }

    // Check if recipe already exists for this user
    const existing = await prisma.recipe.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        OR: [{ userId }, { userId: null }],
      },
    })

    if (existing) {
      return NextResponse.json(existing)
    }

    let recipeData = {
      name: name.trim(),
      ingredients: [] as Array<{ item: string; quantity?: string; unit?: string }>,
      instructions: '',
      prepTime: undefined as number | undefined,
      cookTime: undefined as number | undefined,
      servings: undefined as number | undefined,
      tags: [] as string[],
      isDraft: true,
    }

    // Optionally generate details using LLM
    if (generateDetails) {
      // Get sample recipes for style reference
      const sampleRecipes = await prisma.recipe.findMany({
        where: {
          isDraft: false,
          OR: [{ userId }, { userId: null }],
        },
        select: { name: true, ingredients: true, tags: true },
        take: 10,
      })

      if (sampleRecipes.length > 0) {
        const generated = await generateRecipeDetails(name, sampleRecipes)

        // Only mark as non-draft if we got meaningful content
        const hasContent = generated.ingredients.length > 0 && generated.instructions.length > 0

        recipeData = {
          name: name.trim(),
          ingredients: generated.ingredients,
          instructions: generated.instructions,
          prepTime: generated.prepTime || undefined,
          cookTime: generated.cookTime || undefined,
          servings: generated.servings || undefined,
          tags: generated.tags,
          isDraft: !hasContent,
        }
      }
    }

    const recipe = await prisma.recipe.create({
      data: {
        userId,
        ...recipeData,
      },
    })

    return NextResponse.json(recipe, { status: 201 })
  } catch (error) {
    console.error('Failed to create quick recipe:', error)
    return NextResponse.json(
      { error: 'Failed to create recipe' },
      { status: 500 }
    )
  }
}

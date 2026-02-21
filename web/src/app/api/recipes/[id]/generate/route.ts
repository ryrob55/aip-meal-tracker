import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserId, isAuthError } from '@/lib/auth-helpers'
import { generateRecipeDetails } from '@/lib/llm'

// POST /api/recipes/[id]/generate - Generate AI content for an existing recipe
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    const { id } = await params

    // Get the recipe (verify ownership)
    const recipe = await prisma.recipe.findFirst({
      where: {
        id,
        OR: [{ userId }, { userId: null }],
      },
    })

    if (!recipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      )
    }

    // Get sample recipes for style reference
    const sampleRecipes = await prisma.recipe.findMany({
      where: {
        isDraft: false,
        OR: [{ userId }, { userId: null }],
      },
      select: { name: true, ingredients: true, tags: true },
      take: 10,
    })

    if (sampleRecipes.length === 0) {
      return NextResponse.json(
        { error: 'No sample recipes available for style reference' },
        { status: 400 }
      )
    }

    const generated = await generateRecipeDetails(recipe.name, sampleRecipes)

    // Only mark as non-draft if we got meaningful content
    const hasContent = generated.ingredients.length > 0 && generated.instructions.length > 0

    const updatedRecipe = await prisma.recipe.update({
      where: { id },
      data: {
        ingredients: generated.ingredients,
        instructions: generated.instructions,
        prepTime: generated.prepTime || undefined,
        cookTime: generated.cookTime || undefined,
        servings: generated.servings || undefined,
        tags: generated.tags.length > 0 ? generated.tags : recipe.tags,
        isDraft: !hasContent,
      },
    })

    return NextResponse.json(updatedRecipe)
  } catch (error) {
    console.error('Failed to generate recipe:', error)
    return NextResponse.json(
      { error: 'Failed to generate recipe details' },
      { status: 500 }
    )
  }
}

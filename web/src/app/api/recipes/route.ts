import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/recipes - List all recipes
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const tag = searchParams.get('tag')

    const recipes = await prisma.recipe.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { instructions: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
          tag ? { tags: { has: tag } } : {},
        ],
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        ingredients: true,
        instructions: true,
        prepTime: true,
        cookTime: true,
        servings: true,
        tags: true,
        source: true,
        imageUrl: true,
        isDraft: true,
        createdAt: true,
        updatedAt: true,
        calories: true,
        protein: true,
        carbs: true,
        fiber: true,
        fat: true,
        netCarbs: true,
        isAIPCompliant: true,
      },
    })

    return NextResponse.json({ recipes })
  } catch (error) {
    console.error('Failed to fetch recipes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recipes' },
      { status: 500 }
    )
  }
}

// POST /api/recipes - Create a new recipe
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const recipe = await prisma.recipe.create({
      data: {
        name: body.name,
        ingredients: body.ingredients || [],
        instructions: body.instructions || '',
        prepTime: body.prepTime,
        cookTime: body.cookTime,
        servings: body.servings,
        tags: body.tags || [],
        source: body.source || 'manual',
        imageUrl: body.imageUrl,
        // Nutritional data
        calories: body.calories,
        protein: body.protein,
        carbs: body.carbs,
        fiber: body.fiber,
        fat: body.fat,
        netCarbs: body.netCarbs,
        isAIPCompliant: body.isAIPCompliant ?? false,
      },
    })

    return NextResponse.json(recipe, { status: 201 })
  } catch (error) {
    console.error('Failed to create recipe:', error)
    return NextResponse.json(
      { error: 'Failed to create recipe' },
      { status: 500 }
    )
  }
}

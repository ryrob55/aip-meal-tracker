import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserId, isAuthError } from '@/lib/auth-helpers'
import type { AIPFoodCategory, AIPPhase, TyramineLevel, HistamineLevel } from '@prisma/client'

// GET - Fetch AIP foods with optional filtering
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    const { searchParams } = new URL(request.url)

    // Parse filter parameters
    const category = searchParams.get('category') as AIPFoodCategory | null
    const phase = searchParams.get('phase') as AIPPhase | null
    const tyramine = searchParams.get('tyramine') as TyramineLevel | null
    const histamine = searchParams.get('histamine') as HistamineLevel | null
    const search = searchParams.get('search')
    const excludeAvoid = searchParams.get('excludeAvoid') === 'true'
    const id = searchParams.get('id')

    // If requesting a specific food
    if (id) {
      const food = await prisma.aIPFood.findUnique({
        where: { id },
      })

      if (!food) {
        return NextResponse.json({ error: 'Food not found' }, { status: 404 })
      }

      return NextResponse.json(food)
    }

    // Build where clause
    const where: {
      category?: AIPFoodCategory
      aipPhase?: AIPPhase | { not: AIPPhase }
      tyramineLevel?: TyramineLevel
      histamineLevel?: HistamineLevel
      name?: { contains: string; mode: 'insensitive' }
    } = {}

    if (category) {
      where.category = category
    }

    if (phase) {
      where.aipPhase = phase
    } else if (excludeAvoid) {
      where.aipPhase = { not: 'AVOID' }
    }

    if (tyramine) {
      where.tyramineLevel = tyramine
    }

    if (histamine) {
      where.histamineLevel = histamine
    }

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      }
    }

    const foods = await prisma.aIPFood.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json(foods)
  } catch (error) {
    console.error('Failed to fetch AIP foods:', error)
    return NextResponse.json({ error: 'Failed to fetch AIP foods' }, { status: 500 })
  }
}

// POST - Create a new AIP food (for admin use)
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    const body = await request.json()

    // Calculate net carbs
    const netCarbs = (body.carbs || 0) - (body.fiber || 0)

    const food = await prisma.aIPFood.create({
      data: {
        name: body.name,
        category: body.category,
        aipPhase: body.aipPhase || 'ELIMINATION',
        calories: body.calories || 0,
        protein: body.protein || 0,
        carbs: body.carbs || 0,
        fiber: body.fiber || 0,
        fat: body.fat || 0,
        netCarbs: Math.max(0, netCarbs),
        tyramineLevel: body.tyramineLevel || 'LOW',
        histamineLevel: body.histamineLevel || 'LOW',
        preferOrganic: body.preferOrganic || false,
        preferNonGMO: body.preferNonGMO || false,
        preferGrassFed: body.preferGrassFed || false,
        preferWildCaught: body.preferWildCaught || false,
        preferPasture: body.preferPasture || false,
        servingSize: body.servingSize,
        servingSizeGrams: body.servingSizeGrams,
      },
    })

    return NextResponse.json(food, { status: 201 })
  } catch (error) {
    console.error('Failed to create AIP food:', error)
    return NextResponse.json({ error: 'Failed to create AIP food' }, { status: 500 })
  }
}

// PUT - Update an AIP food
export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Food ID required' }, { status: 400 })
    }

    const body = await request.json()

    // Calculate net carbs if carbs or fiber changed
    let netCarbs = body.netCarbs
    if (body.carbs !== undefined || body.fiber !== undefined) {
      const currentFood = await prisma.aIPFood.findUnique({ where: { id } })
      const carbs = body.carbs ?? currentFood?.carbs ?? 0
      const fiber = body.fiber ?? currentFood?.fiber ?? 0
      netCarbs = Math.max(0, carbs - fiber)
    }

    const food = await prisma.aIPFood.update({
      where: { id },
      data: {
        ...body,
        netCarbs,
      },
    })

    return NextResponse.json(food)
  } catch (error) {
    console.error('Failed to update AIP food:', error)
    return NextResponse.json({ error: 'Failed to update AIP food' }, { status: 500 })
  }
}

// DELETE - Remove an AIP food
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Food ID required' }, { status: 400 })
    }

    await prisma.aIPFood.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete AIP food:', error)
    return NextResponse.json({ error: 'Failed to delete AIP food' }, { status: 500 })
  }
}

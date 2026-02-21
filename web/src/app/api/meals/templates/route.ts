import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserId, isAuthError } from '@/lib/auth-helpers'

// GET /api/meals/templates - List user's meal templates
export async function GET() {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    const templates = await prisma.mealTemplate.findMany({
      where: { userId },
      orderBy: { useCount: 'desc' },
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Failed to fetch templates:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

// POST /api/meals/templates - Create a meal template
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    const body = await request.json()
    const { name, mealType, foods, totalMacros } = body

    if (!name || !mealType) {
      return NextResponse.json(
        { error: 'name and mealType are required' },
        { status: 400 }
      )
    }

    const template = await prisma.mealTemplate.upsert({
      where: { userId_name: { userId, name } },
      create: {
        userId,
        name,
        mealType,
        foods: foods || [],
        totalMacros,
      },
      update: {
        mealType,
        foods: foods || [],
        totalMacros,
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Failed to create template:', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserId, isAuthError } from '@/lib/auth-helpers'

// GET /api/meals/favorites - List user's favorite foods
export async function GET() {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    const favorites = await prisma.favoriteFood.findMany({
      where: { userId },
      orderBy: { useCount: 'desc' },
      take: 20,
    })

    return NextResponse.json(favorites)
  } catch (error) {
    console.error('Failed to fetch favorites:', error)
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 })
  }
}

// POST /api/meals/favorites - Add a favorite food
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    const body = await request.json()
    const { foodName, defaultAmount, macros } = body

    if (!foodName) {
      return NextResponse.json(
        { error: 'foodName is required' },
        { status: 400 }
      )
    }

    const favorite = await prisma.favoriteFood.upsert({
      where: { userId_foodName: { userId, foodName } },
      create: {
        userId,
        foodName,
        defaultAmount,
        macros,
      },
      update: {
        defaultAmount,
        macros,
        useCount: { increment: 1 },
      },
    })

    return NextResponse.json(favorite, { status: 201 })
  } catch (error) {
    console.error('Failed to add favorite:', error)
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 })
  }
}

// DELETE /api/meals/favorites - Remove a favorite food
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    const { searchParams } = new URL(request.url)
    const foodName = searchParams.get('foodName')

    if (!foodName) {
      return NextResponse.json(
        { error: 'foodName is required' },
        { status: 400 }
      )
    }

    await prisma.favoriteFood.deleteMany({
      where: { userId, foodName },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to remove favorite:', error)
    return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 })
  }
}

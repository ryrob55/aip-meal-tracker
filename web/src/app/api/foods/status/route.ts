import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserId, isAuthError } from '@/lib/auth-helpers'

// GET /api/foods/status - Get user's food statuses
export async function GET() {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    const statuses = await prisma.userFoodStatus.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(statuses)
  } catch (error) {
    console.error('Failed to fetch food statuses:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

// POST /api/foods/status - Set food status
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    const body = await request.json()
    const { foodName, status, notes, testedDate } = body

    if (!foodName || !status) {
      return NextResponse.json(
        { error: 'foodName and status are required' },
        { status: 400 }
      )
    }

    const foodStatus = await prisma.userFoodStatus.upsert({
      where: { userId_foodName: { userId, foodName } },
      create: {
        userId,
        foodName,
        status,
        notes,
        testedDate: testedDate ? new Date(testedDate) : undefined,
      },
      update: {
        status,
        notes,
        testedDate: testedDate ? new Date(testedDate) : undefined,
      },
    })

    return NextResponse.json(foodStatus)
  } catch (error) {
    console.error('Failed to set food status:', error)
    return NextResponse.json({ error: 'Failed to set status' }, { status: 500 })
  }
}

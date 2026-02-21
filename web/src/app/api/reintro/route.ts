import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserId, isAuthError } from '@/lib/auth-helpers'
import { calculateTestDates } from '@/lib/reintro-protocol'

// GET /api/reintro - List reintroduction tests
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const active = searchParams.get('active')

    const where: Record<string, unknown> = { userId }

    if (status) {
      where.status = status
    }

    if (active === 'true') {
      where.status = { in: ['TESTING_DAY0', 'OBSERVING', 'CONFIRMING'] }
    }

    const tests = await prisma.reintroductionTest.findMany({
      where,
      include: { reactions: { orderBy: { timestamp: 'desc' } } },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(tests)
  } catch (error) {
    console.error('Failed to fetch reintro tests:', error)
    return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 })
  }
}

// POST /api/reintro - Create a new reintroduction test
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    const body = await request.json()
    const { foodName, foodCategory, reintroStage, testDate } = body

    if (!foodName) {
      return NextResponse.json({ error: 'foodName is required' }, { status: 400 })
    }

    // Enforce ONE active test at a time
    const activeTest = await prisma.reintroductionTest.findFirst({
      where: {
        userId,
        status: { in: ['TESTING_DAY0', 'OBSERVING', 'CONFIRMING'] },
      },
    })

    if (activeTest) {
      return NextResponse.json(
        { error: `You already have an active test for "${activeTest.foodName}". Complete or abandon it first.` },
        { status: 400 }
      )
    }

    // Calculate test dates
    const startDate = testDate ? new Date(testDate) : new Date()
    const dates = calculateTestDates(startDate)

    const test = await prisma.reintroductionTest.create({
      data: {
        userId,
        foodName,
        foodCategory,
        reintroStage: reintroStage ?? 1,
        status: 'NOT_STARTED',
        testDate: dates.testDate,
        observationEndDate: dates.observationEnd,
        confirmationStartDate: dates.confirmationStart,
        confirmationEndDate: dates.confirmationEnd,
      },
    })

    return NextResponse.json(test, { status: 201 })
  } catch (error) {
    console.error('Failed to create reintro test:', error)
    return NextResponse.json({ error: 'Failed to create test' }, { status: 500 })
  }
}

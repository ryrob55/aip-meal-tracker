import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserId, isAuthError } from '@/lib/auth-helpers'

// POST /api/reintro/[testId]/reactions - Log a reaction
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    const { testId } = await params
    const body = await request.json()
    const { symptomType, severity, notes } = body

    if (!symptomType || severity == null) {
      return NextResponse.json(
        { error: 'symptomType and severity are required' },
        { status: 400 }
      )
    }

    // Verify test ownership
    const test = await prisma.reintroductionTest.findFirst({
      where: { id: testId, userId },
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    const reaction = await prisma.reintroReaction.create({
      data: {
        testId,
        symptomType,
        severity,
        notes,
      },
    })

    return NextResponse.json(reaction, { status: 201 })
  } catch (error) {
    console.error('Failed to log reaction:', error)
    return NextResponse.json({ error: 'Failed to log reaction' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserId, isAuthError } from '@/lib/auth-helpers'
import { canTransition } from '@/lib/reintro-protocol'
import type { ReintroStatus, ReintroResult } from '@prisma/client'

// GET /api/reintro/[testId] - Get a specific test
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    const { testId } = await params

    const test = await prisma.reintroductionTest.findFirst({
      where: { id: testId, userId },
      include: { reactions: { orderBy: { timestamp: 'desc' } } },
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    return NextResponse.json(test)
  } catch (error) {
    console.error('Failed to fetch reintro test:', error)
    return NextResponse.json({ error: 'Failed to fetch test' }, { status: 500 })
  }
}

// PATCH /api/reintro/[testId] - Update test (status transitions, portions, result)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    const { testId } = await params
    const body = await request.json()

    const test = await prisma.reintroductionTest.findFirst({
      where: { id: testId, userId },
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    // Validate status transition if status is being changed
    if (body.status && body.status !== test.status) {
      if (!canTransition(test.status as never, body.status as never)) {
        return NextResponse.json(
          { error: `Cannot transition from ${test.status} to ${body.status}` },
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, unknown> = {}

    // Status
    if (body.status) updateData.status = body.status

    // Portions (Day 0)
    if (body.portion1Time) updateData.portion1Time = new Date(body.portion1Time)
    if (body.portion1Amount) updateData.portion1Amount = body.portion1Amount
    if (body.portion2Time) updateData.portion2Time = new Date(body.portion2Time)
    if (body.portion2Amount) updateData.portion2Amount = body.portion2Amount
    if (body.portion3Time) updateData.portion3Time = new Date(body.portion3Time)
    if (body.portion3Amount) updateData.portion3Amount = body.portion3Amount

    // Result
    if (body.result) updateData.result = body.result
    if (body.resultNotes !== undefined) updateData.resultNotes = body.resultNotes

    // Symptom snapshots
    if (body.symptomsBefore) updateData.symptomsBefore = body.symptomsBefore
    if (body.symptomsDuring) updateData.symptomsDuring = body.symptomsDuring
    if (body.symptomsAfter) updateData.symptomsAfter = body.symptomsAfter

    const updated = await prisma.reintroductionTest.update({
      where: { id: testId },
      data: updateData,
      include: { reactions: { orderBy: { timestamp: 'desc' } } },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Failed to update reintro test:', error)
    return NextResponse.json({ error: 'Failed to update test' }, { status: 500 })
  }
}

// DELETE /api/reintro/[testId] - Delete a test
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    const { testId } = await params

    const test = await prisma.reintroductionTest.findFirst({
      where: { id: testId, userId },
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    await prisma.reintroductionTest.delete({ where: { id: testId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete reintro test:', error)
    return NextResponse.json({ error: 'Failed to delete test' }, { status: 500 })
  }
}

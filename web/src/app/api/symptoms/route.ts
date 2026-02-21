import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserId, isAuthError } from '@/lib/auth-helpers'

// GET /api/symptoms - Fetch symptom logs for a date range
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    // Fetch a specific date
    if (date) {
      const logs = await prisma.symptomLog.findMany({
        where: {
          userId,
          date: new Date(date),
        },
        orderBy: { time: 'asc' },
      })
      return NextResponse.json(logs)
    }

    // Fetch a date range
    if (from && to) {
      const logs = await prisma.symptomLog.findMany({
        where: {
          userId,
          date: {
            gte: new Date(from),
            lte: new Date(to),
          },
        },
        orderBy: [{ date: 'asc' }, { time: 'asc' }],
      })
      return NextResponse.json(logs)
    }

    // Default: last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const logs = await prisma.symptomLog.findMany({
      where: {
        userId,
        date: { gte: sevenDaysAgo },
      },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error('Failed to fetch symptom logs:', error)
    return NextResponse.json({ error: 'Failed to fetch symptom logs' }, { status: 500 })
  }
}

// POST /api/symptoms - Create or update a symptom log
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    const body = await request.json()
    const { date, time, ...symptomData } = body

    if (!date || !time) {
      return NextResponse.json(
        { error: 'date and time are required' },
        { status: 400 }
      )
    }

    // Upsert: create or update for this user/date/time combo
    const log = await prisma.symptomLog.upsert({
      where: {
        userId_date_time: {
          userId,
          date: new Date(date),
          time,
        },
      },
      update: {
        energy: symptomData.energy,
        pain: symptomData.pain,
        digestion: symptomData.digestion,
        sleep: symptomData.sleep,
        skin: symptomData.skin,
        mood: symptomData.mood,
        brainFog: symptomData.brainFog,
        headache: symptomData.headache,
        bristolScale: symptomData.bristolScale,
        stressLevel: symptomData.stressLevel,
        exerciseMinutes: symptomData.exerciseMinutes,
        hydrationOz: symptomData.hydrationOz,
        menstrualDay: symptomData.menstrualDay,
        notes: symptomData.notes,
        tags: symptomData.tags ?? [],
      },
      create: {
        userId,
        date: new Date(date),
        time,
        energy: symptomData.energy,
        pain: symptomData.pain,
        digestion: symptomData.digestion,
        sleep: symptomData.sleep,
        skin: symptomData.skin,
        mood: symptomData.mood,
        brainFog: symptomData.brainFog,
        headache: symptomData.headache,
        bristolScale: symptomData.bristolScale,
        stressLevel: symptomData.stressLevel,
        exerciseMinutes: symptomData.exerciseMinutes,
        hydrationOz: symptomData.hydrationOz,
        menstrualDay: symptomData.menstrualDay,
        notes: symptomData.notes,
        tags: symptomData.tags ?? [],
      },
    })

    return NextResponse.json(log, { status: 201 })
  } catch (error) {
    console.error('Failed to save symptom log:', error)
    return NextResponse.json({ error: 'Failed to save symptom log' }, { status: 500 })
  }
}

// DELETE /api/symptoms - Delete a symptom log
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // Verify ownership
    const existing = await prisma.symptomLog.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.symptomLog.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete symptom log:', error)
    return NextResponse.json({ error: 'Failed to delete symptom log' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/aip-diet/foods/[id] - Get a specific food
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const food = await prisma.aIPFood.findUnique({
      where: { id },
    })

    if (!food) {
      return NextResponse.json({ error: 'Food not found' }, { status: 404 })
    }

    return NextResponse.json(food)
  } catch (error) {
    console.error('Failed to fetch food:', error)
    return NextResponse.json({ error: 'Failed to fetch food' }, { status: 500 })
  }
}

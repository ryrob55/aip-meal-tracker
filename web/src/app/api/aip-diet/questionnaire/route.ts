import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { AIPRestrictionType, AIPSeverity } from '@prisma/client'

interface RestrictionInput {
  foodName: string
  restrictionType: AIPRestrictionType
  severity: AIPSeverity
  notes?: string
}

interface QuestionnaireInput {
  name?: string
  dailyCalories?: number
  dailyProtein?: number
  dailyNetCarbs?: number
  eatingWindowStart?: string
  eatingWindowEnd?: string
  includeSmoothie?: boolean
  smoothieTime?: string
  includeSnack?: boolean
  snackTime?: string
  includeMorningCoffee?: boolean
  morningCoffeeTime?: string
  preferredProteins?: string[]
  healthGoals?: string[]
  allowLeftovers?: boolean
  maxLeftoverHours?: number
  restrictions?: RestrictionInput[]
}

// GET - Fetch questionnaire(s)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      // Fetch specific questionnaire
      const questionnaire = await prisma.aIPQuestionnaire.findUnique({
        where: { id },
        include: {
          restrictions: true,
        },
      })

      if (!questionnaire) {
        return NextResponse.json({ error: 'Questionnaire not found' }, { status: 404 })
      }

      return NextResponse.json(questionnaire)
    }

    // Fetch all questionnaires (typically there's only one)
    const questionnaires = await prisma.aIPQuestionnaire.findMany({
      include: {
        restrictions: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    // Return the most recent one or null
    return NextResponse.json(questionnaires[0] || null)
  } catch (error) {
    console.error('Failed to fetch questionnaire:', error)
    return NextResponse.json({ error: 'Failed to fetch questionnaire' }, { status: 500 })
  }
}

// POST - Create new questionnaire
export async function POST(request: NextRequest) {
  try {
    const body: QuestionnaireInput = await request.json()

    const questionnaire = await prisma.aIPQuestionnaire.create({
      data: {
        name: body.name,
        dailyCalories: body.dailyCalories ?? 2600,
        dailyProtein: body.dailyProtein ?? 150,
        dailyNetCarbs: body.dailyNetCarbs ?? 80,
        eatingWindowStart: body.eatingWindowStart ?? '11:30',
        eatingWindowEnd: body.eatingWindowEnd ?? '18:30',
        includeSmoothie: body.includeSmoothie ?? true,
        smoothieTime: body.smoothieTime ?? '11:30',
        includeSnack: body.includeSnack ?? true,
        snackTime: body.snackTime ?? '18:30',
        includeMorningCoffee: body.includeMorningCoffee ?? true,
        morningCoffeeTime: body.morningCoffeeTime ?? '06:30',
        preferredProteins: body.preferredProteins ?? [],
        healthGoals: body.healthGoals ?? [],
        allowLeftovers: body.allowLeftovers ?? true,
        maxLeftoverHours: body.maxLeftoverHours ?? 24,
        restrictions: {
          create: body.restrictions?.map((r) => ({
            foodName: r.foodName,
            restrictionType: r.restrictionType,
            severity: r.severity,
            notes: r.notes,
          })) ?? [],
        },
      },
      include: {
        restrictions: true,
      },
    })

    return NextResponse.json(questionnaire, { status: 201 })
  } catch (error) {
    console.error('Failed to create questionnaire:', error)
    return NextResponse.json({ error: 'Failed to create questionnaire' }, { status: 500 })
  }
}

// PUT - Update existing questionnaire
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Questionnaire ID required' }, { status: 400 })
    }

    const body: QuestionnaireInput = await request.json()

    // Delete existing restrictions and recreate them
    await prisma.aIPRestriction.deleteMany({
      where: { questionnaireId: id },
    })

    const questionnaire = await prisma.aIPQuestionnaire.update({
      where: { id },
      data: {
        name: body.name,
        dailyCalories: body.dailyCalories,
        dailyProtein: body.dailyProtein,
        dailyNetCarbs: body.dailyNetCarbs,
        eatingWindowStart: body.eatingWindowStart,
        eatingWindowEnd: body.eatingWindowEnd,
        includeSmoothie: body.includeSmoothie,
        smoothieTime: body.smoothieTime,
        includeSnack: body.includeSnack,
        snackTime: body.snackTime,
        includeMorningCoffee: body.includeMorningCoffee,
        morningCoffeeTime: body.morningCoffeeTime,
        preferredProteins: body.preferredProteins,
        healthGoals: body.healthGoals,
        allowLeftovers: body.allowLeftovers,
        maxLeftoverHours: body.maxLeftoverHours,
        restrictions: {
          create: body.restrictions?.map((r) => ({
            foodName: r.foodName,
            restrictionType: r.restrictionType,
            severity: r.severity,
            notes: r.notes,
          })) ?? [],
        },
      },
      include: {
        restrictions: true,
      },
    })

    return NextResponse.json(questionnaire)
  } catch (error) {
    console.error('Failed to update questionnaire:', error)
    return NextResponse.json({ error: 'Failed to update questionnaire' }, { status: 500 })
  }
}

// DELETE - Remove questionnaire
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Questionnaire ID required' }, { status: 400 })
    }

    await prisma.aIPQuestionnaire.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete questionnaire:', error)
    return NextResponse.json({ error: 'Failed to delete questionnaire' }, { status: 500 })
  }
}

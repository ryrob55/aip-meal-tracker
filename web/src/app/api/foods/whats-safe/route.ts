import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserId, isAuthError } from '@/lib/auth-helpers'

// GET /api/foods/whats-safe - Get foods safe for the user's current phase
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const nutrient = searchParams.get('nutrient')

    // Get user settings and food statuses
    const [settings, userStatuses, restrictions] = await Promise.all([
      prisma.userSettings.findUnique({ where: { userId } }),
      prisma.userFoodStatus.findMany({ where: { userId } }),
      prisma.aIPQuestionnaire.findFirst({
        where: { userId },
        include: { restrictions: true },
      }),
    ])

    const currentPhase = settings?.currentPhase || 'ELIMINATION'
    const isModified = settings?.aipVariant === 'MODIFIED_2024'

    // Build allowed phases based on current phase
    const phaseOrder = ['ELIMINATION', 'REINTRO_1', 'REINTRO_2', 'REINTRO_3', 'REINTRO_4', 'SAFE']
    const currentPhaseIndex = phaseOrder.indexOf(currentPhase)
    const allowedPhases = phaseOrder.slice(0, currentPhaseIndex + 1)

    // Build food query
    const where: Record<string, unknown> = {
      aipPhase: { in: allowedPhases },
    }

    if (category) {
      where.category = category
    }

    if (nutrient) {
      const nutrientFieldMap: Record<string, string> = {
        calcium: 'richInCalcium',
        b12: 'richInB12',
        iron: 'richInIron',
        zinc: 'richInZinc',
        iodine: 'richInIodine',
        selenium: 'richInSelenium',
        vitaminD: 'richInVitaminD',
        magnesium: 'richInMagnesium',
        folate: 'richInFolate',
        choline: 'richInCholine',
        omega3: 'richInOmega3',
      }
      const field = nutrientFieldMap[nutrient]
      if (field) {
        where[field] = true
      }
    }

    const foods = await prisma.aIPFood.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })

    // Build avoid set from user restrictions
    const restrictedNames = new Set(
      restrictions?.restrictions.map((r) => r.foodName.toLowerCase()) || []
    )

    // Build status map
    const statusMap = new Map(
      userStatuses.map((s) => [s.foodName.toLowerCase(), s.status])
    )

    // Filter and annotate foods
    const annotated = foods
      .filter((food) => {
        // Exclude if user has marked as AVOID
        if (statusMap.get(food.name.toLowerCase()) === 'AVOID') return false
        // Exclude if in restrictions
        if (restrictedNames.has(food.name.toLowerCase())) return false
        // For elimination phase, if Modified AIP, include modifiedAIPAllowed
        if (
          currentPhase === 'ELIMINATION' &&
          isModified &&
          food.modifiedAIPAllowed
        ) {
          return true
        }
        return true
      })
      .map((food) => ({
        ...food,
        userStatus: statusMap.get(food.name.toLowerCase()) || 'UNKNOWN',
        isModifiedAllowed: food.modifiedAIPAllowed,
      }))

    return NextResponse.json({
      foods: annotated,
      currentPhase,
      aipVariant: settings?.aipVariant || 'STANDARD',
      totalCount: annotated.length,
    })
  } catch (error) {
    console.error('Failed to get safe foods:', error)
    return NextResponse.json(
      { error: 'Failed to get safe foods' },
      { status: 500 }
    )
  }
}

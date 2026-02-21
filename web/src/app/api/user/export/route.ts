import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserId, isAuthError } from '@/lib/auth-helpers'

// POST /api/user/export - Full data export
export async function POST() {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    const [
      user,
      settings,
      questionnaires,
      dailyLogs,
      symptomLogs,
      reintroTests,
      correlations,
      templates,
      favorites,
      foodStatuses,
      recipes,
    ] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true, createdAt: true } }),
      prisma.userSettings.findUnique({ where: { userId }, select: { aipVariant: true, currentPhase: true, protocolStartDate: true, darkMode: true, timezone: true } }),
      prisma.aIPQuestionnaire.findMany({ where: { userId }, include: { restrictions: true } }),
      prisma.aIPDailyLog.findMany({ where: { userId }, include: { meals: true }, orderBy: { date: 'asc' } }),
      prisma.symptomLog.findMany({ where: { userId }, orderBy: { date: 'asc' } }),
      prisma.reintroductionTest.findMany({ where: { userId }, include: { reactions: true }, orderBy: { createdAt: 'asc' } }),
      prisma.foodSymptomCorrelation.findMany({ where: { userId } }),
      prisma.mealTemplate.findMany({ where: { userId } }),
      prisma.favoriteFood.findMany({ where: { userId } }),
      prisma.userFoodStatus.findMany({ where: { userId } }),
      prisma.recipe.findMany({ where: { userId } }),
    ])

    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      user,
      settings,
      questionnaires,
      dailyLogs,
      symptomLogs,
      reintroTests,
      correlations,
      templates,
      favorites,
      foodStatuses,
      recipes,
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="aip-tracker-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error('Failed to export data:', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}

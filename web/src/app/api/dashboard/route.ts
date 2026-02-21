import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserId, isAuthError } from '@/lib/auth-helpers'
import { generateNudges } from '@/lib/nudge-engine'
import { getCurrentTestDay } from '@/lib/reintro-protocol'

// GET /api/dashboard - Get dashboard data
export async function GET() {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [todayLog, settings, questionnaire, symptomToday, reintroTests, recentLogs] =
      await Promise.all([
        prisma.aIPDailyLog.findFirst({
          where: { userId, date: today },
          include: { meals: true },
        }),
        prisma.userSettings.findUnique({ where: { userId } }),
        prisma.aIPQuestionnaire.findFirst({ where: { userId } }),
        prisma.symptomLog.findFirst({
          where: {
            userId,
            date: today,
          },
        }),
        prisma.reintroductionTest.findMany({ where: { userId } }),
        // Last 7 days of logs for streak
        prisma.aIPDailyLog.findMany({
          where: {
            userId,
            date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
          include: { meals: true },
        }),
      ])

    // Meals logged today
    const mealsLoggedToday = todayLog
      ? todayLog.meals.filter((m) => m.eaten).length
      : 0

    // Macro progress
    const todayMeals = todayLog?.meals.filter((m) => m.eaten) || []
    const macroProgress = {
      calories: todayMeals.reduce((s, m) => s + (m.calories || 0), 0),
      protein: todayMeals.reduce((s, m) => s + (m.protein || 0), 0),
      carbs: todayMeals.reduce((s, m) => s + (m.carbs || 0), 0),
      target: {
        calories: questionnaire?.dailyCalories || 2000,
        protein: questionnaire?.dailyProtein || 100,
        carbs: questionnaire?.dailyNetCarbs || 100,
      },
    }

    // Active reintro test
    const activeTest = reintroTests.find((t) =>
      ['TESTING_DAY0', 'OBSERVING', 'CONFIRMING'].includes(t.status)
    )

    // Streak
    const streakDays = new Set(
      recentLogs.map((l) => new Date(l.date).toISOString().split('T')[0])
    ).size

    // Days on protocol
    const daysOnProtocol = settings?.protocolStartDate
      ? Math.floor(
          (Date.now() - new Date(settings.protocolStartDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0

    const completedTests = reintroTests.filter((t) => t.status === 'COMPLETE').length

    // Nudges
    const nudges = generateNudges({
      daysOnProtocol,
      mealsLoggedToday,
      symptomsLoggedToday: !!symptomToday,
      activeReintroTest: !!activeTest,
      completedReintroTests: completedTests,
      streakDays,
    })

    return NextResponse.json({
      mealsLoggedToday,
      macroProgress,
      symptomsLoggedToday: !!symptomToday,
      activeReintroTest: activeTest
        ? {
            id: activeTest.id,
            foodName: activeTest.foodName,
            status: activeTest.status,
            dayNumber: activeTest.testDate
              ? getCurrentTestDay(new Date(activeTest.testDate))
              : 0,
          }
        : null,
      streakDays,
      daysOnProtocol,
      currentPhase: settings?.currentPhase || 'ELIMINATION',
      aiConfigured: settings?.aiProvider != null && settings.aiProvider !== 'NONE',
      nudges,
    })
  } catch (error) {
    console.error('Failed to get dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to get dashboard data' },
      { status: 500 }
    )
  }
}

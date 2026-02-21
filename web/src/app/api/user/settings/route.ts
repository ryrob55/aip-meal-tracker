import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserId, isAuthError } from '@/lib/auth-helpers'

interface SettingsInput {
  aiProvider?: string
  llmBaseUrl?: string
  llmApiKey?: string
  llmModel?: string
  aipVariant?: 'STANDARD' | 'MODIFIED_2024'
  protocolStartDate?: string
  currentPhase?: string
  darkMode?: boolean
  timezone?: string
}

// GET /api/user/settings - Fetch user settings
export async function GET() {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    const settings = await prisma.userSettings.findUnique({
      where: { userId },
    })

    if (!settings) {
      return NextResponse.json(null)
    }

    // Don't send the full API key back - mask it
    return NextResponse.json({
      ...settings,
      llmApiKey: settings.llmApiKey ? '***' + settings.llmApiKey.slice(-4) : null,
    })
  } catch (error) {
    console.error('Failed to fetch settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// POST /api/user/settings - Create or update user settings
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    const body: SettingsInput = await request.json()

    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: {
        ...(body.aiProvider !== undefined && { aiProvider: body.aiProvider as never }),
        ...(body.llmBaseUrl !== undefined && { llmBaseUrl: body.llmBaseUrl }),
        ...(body.llmApiKey !== undefined && { llmApiKey: body.llmApiKey }),
        ...(body.llmModel !== undefined && { llmModel: body.llmModel }),
        ...(body.aipVariant !== undefined && { aipVariant: body.aipVariant }),
        ...(body.protocolStartDate !== undefined && {
          protocolStartDate: new Date(body.protocolStartDate),
        }),
        ...(body.currentPhase !== undefined && { currentPhase: body.currentPhase as never }),
        ...(body.darkMode !== undefined && { darkMode: body.darkMode }),
        ...(body.timezone !== undefined && { timezone: body.timezone }),
      },
      create: {
        userId,
        aiProvider: (body.aiProvider as never) || 'NONE',
        llmBaseUrl: body.llmBaseUrl,
        llmApiKey: body.llmApiKey,
        llmModel: body.llmModel,
        aipVariant: body.aipVariant || 'STANDARD',
        protocolStartDate: body.protocolStartDate
          ? new Date(body.protocolStartDate)
          : undefined,
        darkMode: body.darkMode ?? true,
        timezone: body.timezone || 'America/New_York',
      },
    })

    return NextResponse.json({
      ...settings,
      llmApiKey: settings.llmApiKey ? '***' + settings.llmApiKey.slice(-4) : null,
    })
  } catch (error) {
    console.error('Failed to save settings:', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}

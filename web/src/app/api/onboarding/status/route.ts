import { NextResponse } from 'next/server'
import { getUserId, isAuthError } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const userId = await getUserId()
  if (isAuthError(userId)) return userId

  const questionnaire = await prisma.aIPQuestionnaire.findFirst({
    where: { userId },
    select: { id: true },
  })

  return NextResponse.json({ needsOnboarding: !questionnaire })
}

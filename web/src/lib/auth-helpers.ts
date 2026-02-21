import { NextResponse } from 'next/server'
import { getServerSession } from './auth'

/**
 * Get the current user's ID from the session.
 * Returns the userId string or a NextResponse error (401).
 */
export async function getUserId(): Promise<string | NextResponse> {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return session.user.id
}

/**
 * Helper to check if the result from getUserId is an error response.
 */
export function isAuthError(result: string | NextResponse): result is NextResponse {
  return result instanceof NextResponse
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserId, isAuthError } from '@/lib/auth-helpers'

// DELETE /api/user/delete - Delete user account and all data
export async function DELETE() {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    // Cascade delete handles most relations
    await prisma.user.delete({ where: { id: userId } })

    return NextResponse.json({ success: true, message: 'Account and all data deleted.' })
  } catch (error) {
    console.error('Failed to delete account:', error)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}

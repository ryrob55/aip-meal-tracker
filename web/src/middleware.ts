import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Routes that don't require authentication
const publicPaths = [
  '/',
  '/login',
  '/api/auth',
]

function isPublicPath(pathname: string): boolean {
  return publicPaths.some(path => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  })
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Single-user mode: skip all auth checks
  if (process.env.SINGLE_USER_MODE === 'true') {
    return NextResponse.next()
  }

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check for auth token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from login page
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/aip-diet', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

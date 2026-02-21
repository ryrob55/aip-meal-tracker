import { NextAuthOptions, getServerSession as nextAuthGetServerSession } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import EmailProvider from 'next-auth/providers/email'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './db'
import type { Adapter } from 'next-auth/adapters'

const isSingleUserMode = process.env.SINGLE_USER_MODE === 'true'

// Default user for single-user mode
const SINGLE_USER_ID = 'single-user-default'
const SINGLE_USER_EMAIL = 'user@localhost'

async function ensureSingleUser() {
  const existing = await prisma.user.findUnique({
    where: { id: SINGLE_USER_ID },
  })
  if (!existing) {
    await prisma.user.create({
      data: {
        id: SINGLE_USER_ID,
        email: SINGLE_USER_EMAIL,
        name: 'Default User',
        emailVerified: new Date(),
      },
    })
  }
  return SINGLE_USER_ID
}

// Build providers list based on env vars
function getProviders(): NextAuthOptions['providers'] {
  const providers: NextAuthOptions['providers'] = []

  // Google OAuth (if configured)
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    )
  }

  // Email magic link (if SMTP configured)
  if (process.env.EMAIL_SERVER_HOST) {
    providers.push(
      EmailProvider({
        server: {
          host: process.env.EMAIL_SERVER_HOST,
          port: Number(process.env.EMAIL_SERVER_PORT || 587),
          auth: {
            user: process.env.EMAIL_SERVER_USER || '',
            pass: process.env.EMAIL_SERVER_PASSWORD || '',
          },
        },
        from: process.env.EMAIL_FROM || 'AIP Tracker <noreply@example.com>',
      })
    )
  }

  // If no providers configured (and not single-user mode), add credentials as fallback
  // This allows email-only login without SMTP (for development/self-hosted)
  if (providers.length === 0 && !isSingleUserMode) {
    providers.push(
      CredentialsProvider({
        name: 'Email',
        credentials: {
          email: { label: 'Email', type: 'email', placeholder: 'you@example.com' },
        },
        async authorize(credentials) {
          if (!credentials?.email) return null
          const email = credentials.email.toLowerCase().trim()

          // Find or create user by email
          let user = await prisma.user.findUnique({
            where: { email },
          })

          if (!user) {
            user = await prisma.user.create({
              data: {
                email,
                emailVerified: new Date(),
              },
            })
          }

          return { id: user.id, email: user.email, name: user.name, image: user.image }
        },
      })
    )
  }

  return providers
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: getProviders(),
  session: {
    strategy: getProviders().some(p => p.type === 'credentials') ? 'jwt' : 'database',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async session({ session, token, user }) {
      if (session.user) {
        // For JWT strategy (credentials provider)
        if (token) {
          session.user.id = token.sub!
        }
        // For database strategy
        if (user) {
          session.user.id = user.id
        }
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
}

export async function getServerSession() {
  if (isSingleUserMode) {
    const userId = await ensureSingleUser()
    return {
      user: {
        id: userId,
        email: SINGLE_USER_EMAIL,
        name: 'Default User',
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }
  }
  return nextAuthGetServerSession(authOptions)
}

export async function requireAuth() {
  const session = await getServerSession()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  return session.user
}

// Augment NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email?: string | null
      name?: string | null
      image?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    sub: string
  }
}

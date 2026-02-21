'use client'

import { signIn, getProviders } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { Salad, Mail, Loader2 } from 'lucide-react'

function LoginForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/aip-diet'
  const error = searchParams.get('error')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [providers, setProviders] = useState<Record<string, { id: string; name: string; type: string }>>({})
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    getProviders().then(p => {
      if (p) setProviders(p)
    })
  }, [])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)

    const hasEmailProvider = providers.email
    const hasCredentials = providers.credentials

    if (hasEmailProvider) {
      // Magic link
      await signIn('email', { email, callbackUrl })
      setEmailSent(true)
    } else if (hasCredentials) {
      // Direct credentials login
      await signIn('credentials', { email, callbackUrl })
    }
    setLoading(false)
  }

  if (emailSent) {
    return (
      <div className="text-center">
        <Mail className="w-12 h-12 text-green-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-100 mb-2">Check your email</h2>
        <p className="text-slate-400">
          We sent a sign-in link to <span className="text-slate-200">{email}</span>
        </p>
        <button
          onClick={() => setEmailSent(false)}
          className="mt-4 text-sm text-blue-400 hover:text-blue-300"
        >
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <>
      {error && (
        <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error === 'OAuthAccountNotLinked'
            ? 'This email is already associated with another login method.'
            : 'Something went wrong. Please try again.'}
        </div>
      )}

      {/* Google OAuth */}
      {providers.google && (
        <>
          <button
            onClick={() => signIn('google', { callbackUrl })}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-white text-gray-800 font-medium hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-800 text-slate-400">or</span>
            </div>
          </div>
        </>
      )}

      {/* Email login */}
      <form onSubmit={handleEmailLogin}>
        <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
          Email address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Mail className="w-5 h-5" />
          )}
          {providers.email ? 'Send magic link' : 'Continue with email'}
        </button>
      </form>
    </>
  )
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Salad className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-100 mb-2">AIP Meal Tracker</h1>
          <p className="text-slate-400">
            Track your AIP diet, symptoms, and progress
          </p>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
          <h2 className="text-lg font-semibold text-slate-100 mb-6 text-center">Sign in to continue</h2>
          <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Your data stays private. No tracking, no ads.
        </p>
      </div>
    </main>
  )
}

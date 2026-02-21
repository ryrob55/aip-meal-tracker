'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Redirect old onboarding URL to new one
export default function LegacyOnboardingPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/onboarding')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full" />
    </div>
  )
}

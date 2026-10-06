'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  Utensils,
  Activity,
  FlaskConical,
  TrendingUp,
  ChevronRight,
  Sparkles,
  Database,
  CheckCircle2,
  Circle,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import type { Nudge } from '@/lib/nudge-engine'
import { NudgeCard } from '@/components/insights'

interface DashboardData {
  mealsLoggedToday: number
  macroProgress: { calories: number; protein: number; carbs: number; target: { calories: number; protein: number; carbs: number } }
  symptomsLoggedToday: boolean
  activeReintroTest: { id: string; foodName: string; status: string; dayNumber: number } | null
  streakDays: number
  daysOnProtocol: number
  currentPhase: string
  aiConfigured: boolean
  nudges: Nudge[]
}

export default function DashboardPage() {
  const { darkMode } = useTheme()
  const router = useRouter()

  const { data: onboardingStatus, isLoading: checkingOnboarding } = useQuery<{ needsOnboarding: boolean }>({
    queryKey: ['onboardingStatus'],
    queryFn: async () => {
      const res = await fetch('/api/onboarding/status')
      if (!res.ok) return { needsOnboarding: false }
      return res.json()
    },
  })

  useEffect(() => {
    if (onboardingStatus?.needsOnboarding) {
      router.push('/onboarding')
    }
  }, [onboardingStatus, router])

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    enabled: !checkingOnboarding && !onboardingStatus?.needsOnboarding,
  })

  if (checkingOnboarding || onboardingStatus?.needsOnboarding) {
    return (
      <div
        className={cn(
          'min-h-screen flex items-center justify-center',
          darkMode ? 'bg-zinc-950' : 'bg-zinc-50'
        )}
      >
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Detect first-time user: no meals logged, no streak, no days on protocol
  const isFirstTime = data && data.mealsLoggedToday === 0 && data.streakDays === 0 && data.daysOnProtocol === 0

  // Format today's date
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div
      className={cn(
        'min-h-screen p-4 pb-24',
        darkMode ? 'bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-900'
      )}
    >
      {/* Header */}
      <div className="mb-8 pt-2">
        {data && data.daysOnProtocol > 0 ? (
          <>
            <div className="flex items-center gap-2 mb-1">
              <span className={cn('text-sm', darkMode ? 'text-zinc-400' : 'text-zinc-500')}>
                {todayFormatted}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                {data.currentPhase.replace(/_/g, ' ')}
              </span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">
              Day {data.daysOnProtocol}
            </h1>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold">AIP Tracker</h1>
            {data && (
              <p className={cn('text-sm', darkMode ? 'text-zinc-400' : 'text-zinc-500')}>
                Welcome to your AIP journey
              </p>
            )}
          </>
        )}
      </div>

      {isLoading ? (
        /* ── Loading Skeleton ── */
        <div className="max-w-lg mx-auto">
          {/* Stats row skeleton */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  'h-24 rounded-2xl animate-pulse',
                  darkMode ? 'bg-zinc-900' : 'bg-zinc-200'
                )}
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
          {/* Macro card skeleton */}
          <div
            className={cn(
              'h-40 rounded-2xl mb-4 animate-pulse',
              darkMode ? 'bg-zinc-900' : 'bg-zinc-200'
            )}
            style={{ animationDelay: '200ms' }}
          />
          {/* Quick actions skeleton */}
          <div
            className={cn(
              'h-20 rounded-2xl mb-4 animate-pulse',
              darkMode ? 'bg-zinc-900' : 'bg-zinc-200'
            )}
            style={{ animationDelay: '300ms' }}
          />
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  'h-20 rounded-2xl animate-pulse',
                  darkMode ? 'bg-zinc-900' : 'bg-zinc-200'
                )}
                style={{ animationDelay: `${400 + i * 100}ms` }}
              />
            ))}
          </div>
        </div>
      ) : isFirstTime ? (
        /* ── First-Time User: Getting Started ── */
        <div className="max-w-lg mx-auto">
          {/* Welcome card with plan summary */}
          <div
            className={cn(
              'rounded-2xl p-6 mb-6',
              darkMode ? 'bg-zinc-900 card-glow' : 'bg-white card-elevated-light'
            )}
          >
            <div className="flex items-center gap-4 mb-4">
              <Image
                src="/AIP_logo.png"
                alt="AIP"
                width={48}
                height={48}
                className="rounded-xl"
              />
              <div>
                <h2 className="text-lg font-bold">Your plan is ready</h2>
                <p className={cn('text-sm', darkMode ? 'text-zinc-400' : 'text-zinc-600')}>
                  {data.macroProgress.target.calories} cal &middot; {data.macroProgress.target.protein}g protein &middot; {data.macroProgress.target.carbs}g carbs daily
                </p>
              </div>
            </div>
          </div>

          {/* Getting started steps */}
          <div className="mb-6">
            <h3
              className={cn(
                'text-xs font-medium uppercase tracking-wider mb-4',
                darkMode ? 'text-zinc-500' : 'text-zinc-400'
              )}
            >
              Getting Started
            </h3>

            <div className="space-y-3">
              {/* Step 1: Log first meal — primary CTA */}
              <Link
                href="/aip-diet"
                className={cn(
                  'block rounded-xl border-2 p-5 transition-all active:scale-[0.98]',
                  darkMode
                    ? 'border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/15'
                    : 'border-emerald-500/50 bg-emerald-50 hover:bg-emerald-100'
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                    <Utensils className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-semibold">Log your first meal</h4>
                      <ChevronRight className={cn('w-5 h-5', darkMode ? 'text-emerald-400' : 'text-emerald-500')} />
                    </div>
                    <p className={cn('text-sm mt-1', darkMode ? 'text-zinc-400' : 'text-zinc-600')}>
                      Open the meal tracker and add what you ate today. Your macro progress will update automatically.
                    </p>
                  </div>
                </div>
              </Link>

              {/* Step 2: Symptom check-in */}
              <Link
                href="/symptoms"
                className={cn(
                  'block rounded-xl border p-5 transition-all active:scale-[0.98]',
                  data.symptomsLoggedToday
                    ? darkMode
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-emerald-200 bg-emerald-50/50'
                    : darkMode
                      ? 'border-zinc-800 bg-zinc-900 card-glow hover:border-zinc-700'
                      : 'border-zinc-200 bg-white card-elevated-light hover:border-zinc-300'
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                      data.symptomsLoggedToday
                        ? 'bg-emerald-500'
                        : darkMode ? 'bg-zinc-800' : 'bg-zinc-100'
                    )}
                  >
                    {data.symptomsLoggedToday ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : (
                      <Activity className={cn('w-5 h-5', darkMode ? 'text-zinc-400' : 'text-zinc-500')} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-semibold">
                        {data.symptomsLoggedToday ? 'Check-in done' : 'Daily symptom check-in'}
                      </h4>
                      {!data.symptomsLoggedToday && (
                        <ChevronRight className={cn('w-5 h-5', darkMode ? 'text-zinc-500' : 'text-zinc-400')} />
                      )}
                    </div>
                    <p className={cn('text-sm mt-1', darkMode ? 'text-zinc-400' : 'text-zinc-600')}>
                      {data.symptomsLoggedToday
                        ? 'Great job tracking your symptoms today.'
                        : 'Rate how you feel today. Takes about 30 seconds. This helps spot patterns over time.'}
                    </p>
                  </div>
                </div>
              </Link>

              {/* Step 3: Browse foods */}
              <Link
                href="/foods"
                className={cn(
                  'block rounded-xl border p-5 transition-all active:scale-[0.98]',
                  darkMode
                    ? 'border-zinc-800 bg-zinc-900 card-glow hover:border-zinc-700'
                    : 'border-zinc-200 bg-white card-elevated-light hover:border-zinc-300'
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                      darkMode ? 'bg-zinc-800' : 'bg-zinc-100'
                    )}
                  >
                    <Database className={cn('w-5 h-5', darkMode ? 'text-zinc-400' : 'text-zinc-500')} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-semibold">Browse AIP-safe foods</h4>
                      <ChevronRight className={cn('w-5 h-5', darkMode ? 'text-zinc-500' : 'text-zinc-400')} />
                    </div>
                    <p className={cn('text-sm mt-1', darkMode ? 'text-zinc-400' : 'text-zinc-600')}>
                      Explore which foods are safe, which to avoid, and which are high-tyramine or high-histamine.
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Tip */}
          <div
            className={cn(
              'rounded-xl p-4',
              darkMode ? 'bg-zinc-900/50' : 'bg-zinc-100'
            )}
          >
            <p className={cn('text-sm leading-relaxed', darkMode ? 'text-zinc-400' : 'text-zinc-600')}>
              <span className="font-medium">Tip:</span> Consistency matters more than perfection. Even logging one meal a day builds valuable data about how foods affect you.
            </p>
          </div>
        </div>
      ) : (
        /* ── Returning User: Normal Dashboard ── */
        <div className="max-w-lg mx-auto">
          {/* Streak & Stats */}
          <div className="grid grid-cols-3 gap-2 mb-6 opacity-0 animate-fade-in-up-1">
            {/* Meals Today */}
            <div
              className={cn(
                'p-4 rounded-2xl text-center',
                darkMode ? 'bg-zinc-900 card-glow' : 'bg-white card-elevated-light'
              )}
            >
              <div className="text-3xl font-bold tabular-nums">
                {data?.mealsLoggedToday || 0}
              </div>
              <div
                className={cn(
                  'text-xs font-medium uppercase tracking-wider mt-1',
                  darkMode ? 'text-zinc-500' : 'text-zinc-400'
                )}
              >
                Meals
              </div>
            </div>

            {/* Week Streak */}
            <div
              className={cn(
                'p-4 rounded-2xl text-center',
                darkMode ? 'bg-zinc-900 card-glow' : 'bg-white card-elevated-light'
              )}
            >
              <div className="text-3xl font-bold tabular-nums">
                {data?.streakDays || 0}<span className={cn('text-lg', darkMode ? 'text-zinc-600' : 'text-zinc-400')}>/7</span>
              </div>
              <div
                className={cn(
                  'text-xs font-medium uppercase tracking-wider mt-1',
                  darkMode ? 'text-zinc-500' : 'text-zinc-400'
                )}
              >
                Week
              </div>
              {/* Streak dots */}
              <div className="flex items-center justify-center gap-1 mt-2">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      i < (data?.streakDays || 0)
                        ? 'bg-emerald-500'
                        : darkMode ? 'bg-zinc-800' : 'bg-zinc-200'
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Check-In */}
            <Link
              href="/symptoms"
              className={cn(
                'p-4 rounded-2xl text-center transition-all active:scale-[0.97]',
                darkMode ? 'bg-zinc-900 card-glow' : 'bg-white card-elevated-light'
              )}
            >
              <div className="text-3xl font-bold flex items-center justify-center">
                {data?.symptomsLoggedToday ? (
                  <div className="w-8 h-8 rounded-full ring-2 ring-emerald-500/30 bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                ) : (
                  <Circle className={cn('w-8 h-8 stroke-[1.5]', darkMode ? 'text-zinc-700' : 'text-zinc-300')} strokeDasharray="4 2" />
                )}
              </div>
              <div
                className={cn(
                  'text-xs font-medium uppercase tracking-wider mt-1',
                  darkMode ? 'text-zinc-500' : 'text-zinc-400'
                )}
              >
                Check-In
              </div>
            </Link>
          </div>

          {/* Macro Progress — Hero Card */}
          {data?.macroProgress && (
            <div
              className={cn(
                'p-5 rounded-2xl mb-4 opacity-0 animate-fade-in-up-2',
                darkMode ? 'bg-zinc-900 card-glow' : 'bg-white card-elevated-light'
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <h3
                  className={cn(
                    'text-xs font-medium uppercase tracking-wider',
                    darkMode ? 'text-zinc-500' : 'text-zinc-400'
                  )}
                >
                  Today&apos;s Macros
                </h3>
                <span className="text-lg font-bold tabular-nums">
                  {Math.round(data.macroProgress.calories)}
                  <span className={cn('text-sm font-normal ml-0.5', darkMode ? 'text-zinc-500' : 'text-zinc-400')}>
                    / {data.macroProgress.target.calories} cal
                  </span>
                </span>
              </div>

              {/* Calories — hero bar */}
              <div className="mb-4">
                <div
                  className={cn(
                    'h-3 rounded-full overflow-hidden',
                    darkMode ? 'bg-zinc-800' : 'bg-zinc-100'
                  )}
                >
                  <div
                    className="h-full rounded-full bg-linear-to-r from-emerald-500 to-emerald-400 progress-glow-emerald animate-progress-fill"
                    style={{
                      '--progress-width': `${Math.min(100, data.macroProgress.target.calories ? (data.macroProgress.calories / data.macroProgress.target.calories) * 100 : 0)}%`,
                    } as React.CSSProperties}
                  />
                </div>
              </div>

              {/* Protein + Carbs side by side */}
              <div className="grid grid-cols-2 gap-4">
                {/* Protein */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={cn(
                        'text-xs font-medium uppercase tracking-wider',
                        darkMode ? 'text-zinc-500' : 'text-zinc-400'
                      )}
                    >
                      Protein
                    </span>
                  </div>
                  <div
                    className={cn(
                      'h-2 rounded-full overflow-hidden',
                      darkMode ? 'bg-zinc-800' : 'bg-zinc-100'
                    )}
                  >
                    <div
                      className="h-full rounded-full bg-sky-400 progress-glow-sky animate-progress-fill"
                      style={{
                        '--progress-width': `${Math.min(100, data.macroProgress.target.protein ? (data.macroProgress.protein / data.macroProgress.target.protein) * 100 : 0)}%`,
                      } as React.CSSProperties}
                    />
                  </div>
                  <div className={cn('text-xs mt-1 tabular-nums', darkMode ? 'text-zinc-400' : 'text-zinc-500')}>
                    {Math.round(data.macroProgress.protein)}g / {data.macroProgress.target.protein}g
                  </div>
                </div>

                {/* Carbs */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={cn(
                        'text-xs font-medium uppercase tracking-wider',
                        darkMode ? 'text-zinc-500' : 'text-zinc-400'
                      )}
                    >
                      Carbs
                    </span>
                  </div>
                  <div
                    className={cn(
                      'h-2 rounded-full overflow-hidden',
                      darkMode ? 'bg-zinc-800' : 'bg-zinc-100'
                    )}
                  >
                    <div
                      className="h-full rounded-full bg-amber-400 progress-glow-amber animate-progress-fill"
                      style={{
                        '--progress-width': `${Math.min(100, data.macroProgress.target.carbs ? (data.macroProgress.carbs / data.macroProgress.target.carbs) * 100 : 0)}%`,
                      } as React.CSSProperties}
                    />
                  </div>
                  <div className={cn('text-xs mt-1 tabular-nums', darkMode ? 'text-zinc-400' : 'text-zinc-500')}>
                    {Math.round(data.macroProgress.carbs)}g / {data.macroProgress.target.carbs}g
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Setup Banner */}
          {data?.aiConfigured === false && (
            <Link
              href="/settings/ai"
              className="block opacity-0 animate-fade-in-up-3"
            >
              <div
                className={cn(
                  'p-4 rounded-2xl mb-4 ring-1 transition-all active:scale-[0.98]',
                  darkMode
                    ? 'bg-emerald-500/8 ring-emerald-500/20'
                    : 'bg-emerald-50 ring-emerald-200'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center',
                      darkMode ? 'bg-emerald-500/15' : 'bg-emerald-100'
                    )}>
                      <Sparkles className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <span className="text-sm font-medium">
                        Unlock AI Features
                      </span>
                      <p
                        className={cn(
                          'text-xs',
                          darkMode ? 'text-zinc-400' : 'text-zinc-600'
                        )}
                      >
                        Log meals by voice, get recipe ideas, and spot patterns
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            </Link>
          )}

          {/* Active Reintro Test */}
          {data?.activeReintroTest && (
            <Link
              href={`/reintro/${data.activeReintroTest.id}`}
              className="block opacity-0 animate-fade-in-up-3"
            >
              <div
                className={cn(
                  'p-4 rounded-2xl mb-4 ring-1 transition-all active:scale-[0.98]',
                  darkMode
                    ? 'bg-violet-500/8 ring-violet-500/20'
                    : 'bg-violet-50 ring-violet-200'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center',
                      darkMode ? 'bg-violet-500/15' : 'bg-violet-100'
                    )}>
                      <FlaskConical className="w-5 h-5 text-violet-500" />
                    </div>
                    <div>
                      <span className="text-sm font-medium">
                        Testing: {data.activeReintroTest.foodName}
                      </span>
                      <p
                        className={cn(
                          'text-xs',
                          darkMode ? 'text-zinc-400' : 'text-zinc-600'
                        )}
                      >
                        Day {data.activeReintroTest.dayNumber} ·{' '}
                        {data.activeReintroTest.status.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-violet-400" />
                </div>
              </div>
            </Link>
          )}

          {/* Nudges */}
          {data?.nudges && data.nudges.length > 0 && (
            <div className="space-y-2 mb-6">
              {data.nudges.slice(0, 3).map((nudge) => (
                <NudgeCard key={nudge.id} nudge={nudge} darkMode={darkMode} />
              ))}
            </div>
          )}

          {/* Quick Actions — Primary CTA + Secondary Row */}
          <div className="opacity-0 animate-fade-in-up-4">
            {/* Primary: Log a Meal */}
            <Link
              href="/quick-log"
              className={cn(
                'flex items-center gap-3 p-4 rounded-2xl mb-3 transition-all active:scale-[0.98]',
                darkMode
                  ? 'bg-emerald-500/10 ring-1 ring-emerald-500/20'
                  : 'bg-emerald-50 ring-1 ring-emerald-200'
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">Log a Meal</div>
                <div className={cn('text-xs', darkMode ? 'text-zinc-400' : 'text-zinc-500')}>
                  AI-powered quick entry
                </div>
              </div>
              <ChevronRight className={cn('w-5 h-5 shrink-0', darkMode ? 'text-emerald-400' : 'text-emerald-500')} />
            </Link>

            {/* Secondary: 3-column */}
            <div className="grid grid-cols-3 gap-2">
              <Link
                href="/symptoms"
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-2xl transition-all active:scale-95',
                  darkMode ? 'bg-zinc-900 card-glow' : 'bg-white card-elevated-light'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  darkMode ? 'bg-emerald-500/15' : 'bg-emerald-50'
                )}>
                  <Activity className="w-5 h-5 text-emerald-400" />
                </div>
                <span className={cn('text-xs font-medium', darkMode ? 'text-zinc-300' : 'text-zinc-700')}>Check In</span>
              </Link>
              <Link
                href="/reintro"
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-2xl transition-all active:scale-95',
                  darkMode ? 'bg-zinc-900 card-glow' : 'bg-white card-elevated-light'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  darkMode ? 'bg-violet-500/15' : 'bg-violet-50'
                )}>
                  <FlaskConical className="w-5 h-5 text-violet-400" />
                </div>
                <span className={cn('text-xs font-medium', darkMode ? 'text-zinc-300' : 'text-zinc-700')}>Reintro</span>
              </Link>
              <Link
                href="/insights"
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-2xl transition-all active:scale-95',
                  darkMode ? 'bg-zinc-900 card-glow' : 'bg-white card-elevated-light'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  darkMode ? 'bg-zinc-800' : 'bg-zinc-100'
                )}>
                  <TrendingUp className="w-5 h-5 text-zinc-400" />
                </div>
                <span className={cn('text-xs font-medium', darkMode ? 'text-zinc-300' : 'text-zinc-700')}>Insights</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

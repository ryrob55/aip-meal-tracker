'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Target } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import { type CorrelationResult } from '@/lib/correlation-engine'
import { type NutrientNudge as NutrientNudgeType } from '@/lib/nutrient-tracking'
import { type Nudge } from '@/lib/nudge-engine'
import {
  CorrelationCard,
  NutrientNudge,
  NudgeCard,
} from '@/components/insights'

interface InsightsData {
  correlations: CorrelationResult[]
  nutrientNudges: NutrientNudgeType[]
  nudges: Nudge[]
  topFoods: { name: string; count: number; avgCalories: number; avgProtein: number }[]
  mealBreakdown: { type: string; label: string; count: number; avgCalories: number; avgProtein: number; totalProtein: number; proteinShare: number }[]
  weeklyTrend: { caloriesDelta: number; proteinDelta: number } | null
  todayGap: { calories: number; protein: number; netCarbs: number; mealsLogged: number } | null
  stats: {
    daysAnalyzed: number
    uniqueFoods: number
    streakDays: number
    daysOnProtocol: number
    macroAdherenceRate?: number
    avgCalories: number
    avgProtein: number
    avgNetCarbs: number
    avgFat: number
  }
  targets: { calories: number; protein: number; netCarbs: number } | null
}

function TrendIcon({ delta, className }: { delta: number; className?: string }) {
  if (delta > 20) return <TrendingUp className={cn('w-4 h-4 text-emerald-400', className)} />
  if (delta < -20) return <TrendingDown className={cn('w-4 h-4 text-red-400', className)} />
  return <Minus className={cn('w-4 h-4 text-slate-500', className)} />
}

export default function InsightsPage() {
  const { darkMode } = useTheme()
  const [period, setPeriod] = useState(30)

  const { data, isLoading } = useQuery<InsightsData>({
    queryKey: ['insights', period],
    queryFn: async () => {
      const res = await fetch(`/api/insights?days=${period}`)
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
  })

  const positiveCorrelations =
    data?.correlations.filter((c) => c.delta > 0) || []
  const negativeCorrelations =
    data?.correlations.filter((c) => c.delta < 0) || []

  return (
    <div
      className={cn(
        'min-h-screen pb-20',
        darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'
      )}
    >
      {/* Header */}
      <div className={cn(
        'sticky top-0 z-10 px-4 py-3 border-b',
        darkMode ? 'bg-slate-900/95 backdrop-blur-xs border-slate-800' : 'bg-white/95 backdrop-blur-xs border-slate-200'
      )}>
        <div className="md:max-w-[60%] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className={cn(
                'p-1.5 -ml-1.5 rounded-lg',
                darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-200'
              )}
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold">Insights</h1>
          </div>
          <div className="flex gap-1.5">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setPeriod(d)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm transition-colors',
                  period === d
                    ? 'bg-emerald-500 text-white'
                    : darkMode
                    ? 'bg-slate-800 text-slate-300'
                    : 'bg-slate-100 text-slate-700'
                )}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="md:max-w-[60%] mx-auto px-4 pt-5">
        {isLoading ? (
          <div className="space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  'rounded-2xl animate-pulse',
                  darkMode ? 'bg-slate-800' : 'bg-slate-200',
                  i === 0 ? 'h-32' : 'h-20'
                )}
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        ) : !data ? (
          <div
            className={cn(
              'p-8 rounded-2xl text-center',
              darkMode ? 'bg-slate-800 card-glow' : 'bg-white card-elevated-light'
            )}
          >
            <p className={cn('text-base', darkMode ? 'text-slate-500' : 'text-slate-500')}>
              No insights available. Try again later.
            </p>
          </div>
        ) : (
          <>
            {/* === MACRO AVERAGES + ADHERENCE === */}
            <div className={cn(
              'rounded-2xl p-5 mb-4 opacity-0 animate-fade-in-up',
              darkMode ? 'bg-slate-800 card-glow' : 'bg-white card-elevated-light'
            )}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={cn('text-xs font-semibold uppercase tracking-wider', darkMode ? 'text-slate-400' : 'text-slate-500')}>
                  Daily Averages
                </h2>
                <div className="flex items-center gap-3">
                  {data.stats.macroAdherenceRate !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <Target className={cn('w-4 h-4', data.stats.macroAdherenceRate >= 70 ? 'text-emerald-400' : data.stats.macroAdherenceRate >= 40 ? 'text-amber-400' : 'text-red-400')} />
                      <span className={cn('text-sm font-medium', darkMode ? 'text-slate-300' : 'text-slate-600')}>
                        {data.stats.macroAdherenceRate}%
                      </span>
                    </div>
                  )}
                  {data.weeklyTrend && <TrendIcon delta={data.weeklyTrend.caloriesDelta} />}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                {[
                  { val: data.stats.avgCalories, label: 'cal', target: data.targets?.calories, color: darkMode ? 'text-emerald-400' : 'text-emerald-600' },
                  { val: `${data.stats.avgProtein}g`, label: 'protein', target: data.targets ? `${data.targets.protein}g` : null, color: darkMode ? 'text-sky-400' : 'text-sky-600' },
                  { val: `${data.stats.avgNetCarbs}g`, label: 'carbs', target: data.targets ? `${data.targets.netCarbs}g` : null, color: darkMode ? 'text-amber-400' : 'text-amber-600' },
                  { val: `${data.stats.avgFat}g`, label: 'fat', target: null, color: darkMode ? 'text-purple-400' : 'text-purple-600' },
                ].map((m) => (
                  <div key={m.label}>
                    <div className={cn('text-2xl font-bold', m.color)}>{m.val}</div>
                    <div className={cn('text-xs', darkMode ? 'text-slate-500' : 'text-slate-400')}>
                      {m.label}{m.target && <span className="ml-1">/ {m.target}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {data.weeklyTrend && (
                <div className={cn(
                  'flex items-center gap-4 mt-4 pt-3 border-t text-xs',
                  darkMode ? 'border-slate-700/50 text-slate-400' : 'border-slate-100 text-slate-500'
                )}>
                  <span>vs last week:</span>
                  <span className={data.weeklyTrend.caloriesDelta > 0 ? 'text-emerald-400' : data.weeklyTrend.caloriesDelta < -50 ? 'text-red-400' : ''}>
                    {data.weeklyTrend.caloriesDelta > 0 ? '+' : ''}{data.weeklyTrend.caloriesDelta} cal
                  </span>
                  <span className={data.weeklyTrend.proteinDelta > 0 ? 'text-sky-400' : data.weeklyTrend.proteinDelta < -10 ? 'text-red-400' : ''}>
                    {data.weeklyTrend.proteinDelta > 0 ? '+' : ''}{data.weeklyTrend.proteinDelta}g protein
                  </span>
                </div>
              )}
            </div>

            {/* === STATS + TODAY'S GAP (side by side) === */}
            <div className="grid grid-cols-2 gap-3 mb-4 opacity-0 animate-fade-in-up-1">
              {/* Mini Stats */}
              <div className={cn('rounded-2xl p-4', darkMode ? 'bg-slate-800 card-glow' : 'bg-white card-elevated-light')}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={cn('text-sm', darkMode ? 'text-slate-400' : 'text-slate-500')}>Days Tracked</span>
                    <span className="text-lg font-bold">{data.stats.daysAnalyzed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={cn('text-sm', darkMode ? 'text-slate-400' : 'text-slate-500')}>Unique Foods</span>
                    <span className="text-lg font-bold">{data.stats.uniqueFoods}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={cn('text-sm', darkMode ? 'text-slate-400' : 'text-slate-500')}>This Week</span>
                    <span className="text-lg font-bold">{data.stats.streakDays}/7</span>
                  </div>
                </div>
              </div>

              {/* Today's Gap */}
              {data.todayGap ? (
                <div className={cn('rounded-2xl p-4', darkMode ? 'bg-slate-800 card-glow' : 'bg-white card-elevated-light')}>
                  <div className={cn('text-xs font-semibold uppercase tracking-wider mb-3', darkMode ? 'text-slate-400' : 'text-slate-500')}>
                    Remaining
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className={cn('text-sm', darkMode ? 'text-slate-400' : 'text-slate-500')}>Calories</span>
                      <span className={cn('text-lg font-bold', data.todayGap.calories <= 0 ? 'text-emerald-400' : '')}>
                        {data.todayGap.calories <= 0 ? 'Hit!' : data.todayGap.calories}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={cn('text-sm', darkMode ? 'text-slate-400' : 'text-slate-500')}>Protein</span>
                      <span className={cn('text-lg font-bold', data.todayGap.protein <= 0 ? 'text-emerald-400' : '')}>
                        {data.todayGap.protein <= 0 ? 'Hit!' : `${data.todayGap.protein}g`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={cn('text-sm', darkMode ? 'text-slate-400' : 'text-slate-500')}>Carbs left</span>
                      <span className={cn('text-lg font-bold', data.todayGap.netCarbs <= 10 ? 'text-red-400' : 'text-emerald-400')}>
                        {data.todayGap.netCarbs <= 0 ? 'Over' : `${data.todayGap.netCarbs}g`}
                      </span>
                    </div>
                  </div>
                  <div className={cn('text-xs mt-2', darkMode ? 'text-slate-600' : 'text-slate-400')}>
                    {data.todayGap.mealsLogged} meal{data.todayGap.mealsLogged !== 1 ? 's' : ''} logged
                  </div>
                </div>
              ) : (
                <div className={cn('rounded-2xl p-4 flex items-center justify-center', darkMode ? 'bg-slate-800 card-glow' : 'bg-white card-elevated-light')}>
                  <p className={cn('text-sm text-center', darkMode ? 'text-slate-500' : 'text-slate-400')}>
                    Log meals to see today&apos;s gap
                  </p>
                </div>
              )}
            </div>

            {/* === NUDGES === */}
            {data.nudges.length > 0 && (
              <div className="space-y-2.5 mb-4 opacity-0 animate-fade-in-up-2">
                {data.nudges.map((nudge) => (
                  <NudgeCard key={nudge.id} nudge={nudge} darkMode={darkMode} />
                ))}
              </div>
            )}

            {/* === SYMPTOM CORRELATIONS === */}
            {negativeCorrelations.length > 0 && (
              <div className="mb-4 opacity-0 animate-fade-in-up-2">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="w-4 h-4 text-orange-500" />
                  <h2 className={cn('text-xs font-semibold uppercase tracking-wider', darkMode ? 'text-slate-400' : 'text-slate-500')}>
                    May Worsen Symptoms
                  </h2>
                </div>
                <div className="space-y-2">
                  {negativeCorrelations.slice(0, 5).map((c) => (
                    <CorrelationCard
                      key={`${c.foodName}-${c.symptomType}`}
                      correlation={c}
                      darkMode={darkMode}
                    />
                  ))}
                </div>
              </div>
            )}

            {positiveCorrelations.length > 0 && (
              <div className="mb-4 opacity-0 animate-fade-in-up-2">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <h2 className={cn('text-xs font-semibold uppercase tracking-wider', darkMode ? 'text-slate-400' : 'text-slate-500')}>
                    May Improve Symptoms
                  </h2>
                </div>
                <div className="space-y-2">
                  {positiveCorrelations.slice(0, 5).map((c) => (
                    <CorrelationCard
                      key={`${c.foodName}-${c.symptomType}`}
                      correlation={c}
                      darkMode={darkMode}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* === PROTEIN BY MEAL + TOP FOODS === */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 opacity-0 animate-fade-in-up-3">
              {/* Protein by Meal */}
              {data.mealBreakdown.length > 0 && (
                <div className={cn(
                  'rounded-2xl p-5',
                  darkMode ? 'bg-slate-800 card-glow' : 'bg-white card-elevated-light'
                )}>
                  <h2 className={cn('text-xs font-semibold uppercase tracking-wider mb-4', darkMode ? 'text-slate-400' : 'text-slate-500')}>
                    Protein by Meal
                  </h2>
                  <div className="space-y-3">
                    {data.mealBreakdown.map((meal) => (
                      <div key={meal.type}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={cn('text-sm', darkMode ? 'text-slate-300' : 'text-slate-700')}>
                            {meal.label}
                          </span>
                          <span className={cn('text-sm tabular-nums font-medium', darkMode ? 'text-slate-400' : 'text-slate-500')}>
                            {meal.avgProtein}g avg
                          </span>
                        </div>
                        <div className={cn('h-2.5 rounded-full overflow-hidden', darkMode ? 'bg-slate-700' : 'bg-slate-100')}>
                          <div
                            className="h-full rounded-full bg-linear-to-r from-sky-500 to-blue-400 animate-progress-fill"
                            style={{ '--progress-width': `${Math.min(100, meal.proteinShare)}%` } as React.CSSProperties}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Foods */}
              {data.topFoods.length > 0 && (
                <div className={cn(
                  'rounded-2xl p-5',
                  darkMode ? 'bg-slate-800 card-glow' : 'bg-white card-elevated-light'
                )}>
                  <h2 className={cn('text-xs font-semibold uppercase tracking-wider mb-3', darkMode ? 'text-slate-400' : 'text-slate-500')}>
                    Most Eaten
                  </h2>
                  <div className="space-y-1">
                    {data.topFoods.slice(0, 8).map((food, i) => (
                      <div
                        key={food.name}
                        className="flex items-center justify-between py-1.5"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className={cn('text-xs font-medium w-5 shrink-0', darkMode ? 'text-slate-600' : 'text-slate-300')}>
                            {i + 1}
                          </span>
                          <span className={cn('text-sm truncate', darkMode ? 'text-slate-200' : 'text-slate-800')}>
                            {food.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-2">
                          <span className={cn('text-xs tabular-nums', darkMode ? 'text-slate-500' : 'text-slate-400')}>
                            {food.avgProtein}g P
                          </span>
                          <span className={cn('text-sm tabular-nums font-medium', darkMode ? 'text-slate-400' : 'text-slate-500')}>
                            {food.count}x
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* === NO DATA STATE === */}
            {data.correlations.length === 0 && data.topFoods.length === 0 && data.nudges.length === 0 && (
              <div className={cn('p-6 rounded-2xl text-center mb-4', darkMode ? 'bg-slate-800 card-glow' : 'bg-white card-elevated-light')}>
                <h3 className="font-medium mb-1">Not enough data yet</h3>
                <p className={cn('text-sm', darkMode ? 'text-slate-400' : 'text-slate-600')}>
                  Keep logging meals and symptoms daily. Insights appear after a few days of data.
                </p>
              </div>
            )}

            {/* === NUTRIENT WATCH === */}
            {data.nutrientNudges.length > 0 && (
              <div className="mb-4 opacity-0 animate-fade-in-up-4">
                <h2 className={cn('text-xs font-semibold uppercase tracking-wider mb-3 px-0.5', darkMode ? 'text-slate-400' : 'text-slate-500')}>
                  Nutrient Watch
                </h2>
                <div className="space-y-2.5">
                  {data.nutrientNudges.map((n) => (
                    <NutrientNudge
                      key={n.nutrient}
                      nudge={n}
                      darkMode={darkMode}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

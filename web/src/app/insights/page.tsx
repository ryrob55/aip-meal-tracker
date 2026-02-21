'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react'
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
  stats: {
    daysAnalyzed: number
    uniqueFoods: number
    streakDays: number
    daysOnProtocol: number
  }
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
        'min-h-screen p-4 pb-24',
        darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className={cn(
              'p-2 rounded-lg',
              darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-200'
            )}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">Insights</h1>
        </div>
        <div className="flex gap-1">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setPeriod(d)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs',
                period === d
                  ? 'bg-blue-500 text-white'
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

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data ? (
        <div
          className={cn(
            'p-8 rounded-xl text-center',
            darkMode ? 'bg-slate-900' : 'bg-white border border-slate-200'
          )}
        >
          <p className={cn('text-sm', darkMode ? 'text-slate-500' : 'text-slate-500')}>
            Failed to load insights. Try again later.
          </p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            <div
              className={cn(
                'p-3 rounded-xl text-center',
                darkMode ? 'bg-slate-900' : 'bg-white border border-slate-200'
              )}
            >
              <div className="text-2xl font-bold">{data.stats.daysAnalyzed}</div>
              <div className={cn('text-[10px]', darkMode ? 'text-slate-500' : 'text-slate-500')}>
                Days Tracked
              </div>
            </div>
            <div
              className={cn(
                'p-3 rounded-xl text-center',
                darkMode ? 'bg-slate-900' : 'bg-white border border-slate-200'
              )}
            >
              <div className="text-2xl font-bold">{data.stats.uniqueFoods}</div>
              <div className={cn('text-[10px]', darkMode ? 'text-slate-500' : 'text-slate-500')}>
                Unique Foods
              </div>
            </div>
            <div
              className={cn(
                'p-3 rounded-xl text-center',
                darkMode ? 'bg-slate-900' : 'bg-white border border-slate-200'
              )}
            >
              <div className="text-2xl font-bold">{data.stats.streakDays}/7</div>
              <div className={cn('text-[10px]', darkMode ? 'text-slate-500' : 'text-slate-500')}>
                This Week
              </div>
            </div>
          </div>

          {/* Nudges */}
          {data.nudges.length > 0 && (
            <div className="space-y-2 mb-6">
              {data.nudges.map((nudge) => (
                <NudgeCard key={nudge.id} nudge={nudge} darkMode={darkMode} />
              ))}
            </div>
          )}

          {/* Negative Correlations (foods that worsen symptoms) */}
          {negativeCorrelations.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4 text-orange-500" />
                <h2
                  className={cn(
                    'text-sm font-medium',
                    darkMode ? 'text-slate-300' : 'text-slate-700'
                  )}
                >
                  Foods That May Worsen Symptoms
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

          {/* Positive Correlations (foods that improve symptoms) */}
          {positiveCorrelations.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <h2
                  className={cn(
                    'text-sm font-medium',
                    darkMode ? 'text-slate-300' : 'text-slate-700'
                  )}
                >
                  Foods That May Improve Symptoms
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

          {/* No correlations state */}
          {data.correlations.length === 0 && (
            <div
              className={cn(
                'p-6 rounded-xl text-center mb-6',
                darkMode ? 'bg-slate-900' : 'bg-white border border-slate-200'
              )}
            >
              <div className="text-3xl mb-2">📊</div>
              <h3 className="font-medium mb-1">Not enough data yet</h3>
              <p
                className={cn(
                  'text-sm',
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                )}
              >
                Keep logging meals and symptoms daily. Correlations appear
                after at least 3 days of data for a food.
              </p>
            </div>
          )}

          {/* Nutrient Nudges */}
          {data.nutrientNudges.length > 0 && (
            <div className="mb-6">
              <h2
                className={cn(
                  'text-sm font-medium mb-3',
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                )}
              >
                Nutrient Watch
              </h2>
              <div className="space-y-2">
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
  )
}

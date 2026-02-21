'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import { type CorrelationResult } from '@/lib/correlation-engine'
import { FoodImpactChart } from '@/components/insights'

interface FoodInsightData {
  foodName: string
  avgDelta: number
  symptomResults: CorrelationResult[]
  daysWithFood: number
  daysWithoutFood: number
  daysAnalyzed?: number
  message?: string
}

export default function FoodInsightPage() {
  const { darkMode } = useTheme()
  const params = useParams()
  const foodName = decodeURIComponent(params.foodName as string)
  const [period, setPeriod] = useState(30)

  const { data, isLoading } = useQuery<FoodInsightData>({
    queryKey: ['food-insight', foodName, period],
    queryFn: async () => {
      const res = await fetch(
        `/api/insights/food/${encodeURIComponent(foodName)}?days=${period}`
      )
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
  })

  const overallImpact = data?.avgDelta ?? 0
  const isPositive = overallImpact > 0

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
            href="/insights"
            className={cn(
              'p-2 rounded-lg',
              darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-200'
            )}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">{foodName}</h1>
        </div>
        <div className="flex gap-1">
          {[14, 30, 60].map((d) => (
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
            Failed to load data.
          </p>
        </div>
      ) : data.symptomResults.length === 0 ? (
        <div
          className={cn(
            'p-8 rounded-xl text-center',
            darkMode ? 'bg-slate-900' : 'bg-white border border-slate-200'
          )}
        >
          <div className="text-3xl mb-2">📊</div>
          <h3 className="font-medium mb-1">Not enough data</h3>
          <p
            className={cn(
              'text-sm',
              darkMode ? 'text-slate-400' : 'text-slate-600'
            )}
          >
            {data.message ||
              `Keep logging meals and symptoms to see how ${foodName.toLowerCase()} affects you.`}
          </p>
        </div>
      ) : (
        <>
          {/* Overall Impact */}
          <div
            className={cn(
              'p-6 rounded-xl text-center mb-4',
              darkMode ? 'bg-slate-900' : 'bg-white border border-slate-200'
            )}
          >
            <span
              className={cn(
                'text-3xl font-bold',
                isPositive
                  ? 'text-green-500'
                  : overallImpact === 0
                  ? darkMode
                    ? 'text-slate-400'
                    : 'text-slate-600'
                  : 'text-orange-500'
              )}
            >
              {isPositive ? '+' : ''}{overallImpact.toFixed(1)}
            </span>
            <p
              className={cn(
                'text-sm mt-1',
                darkMode ? 'text-slate-400' : 'text-slate-600'
              )}
            >
              Average symptom impact
            </p>
            <p
              className={cn(
                'text-xs mt-2',
                darkMode ? 'text-slate-600' : 'text-slate-400'
              )}
            >
              Based on {data.daysWithFood} days with and {data.daysWithoutFood}{' '}
              days without {foodName.toLowerCase()}
            </p>
          </div>

          {/* Symptom Breakdown */}
          <div
            className={cn(
              'p-4 rounded-xl mb-4',
              darkMode ? 'bg-slate-900' : 'bg-white border border-slate-200'
            )}
          >
            <h3 className="font-medium mb-3">Impact by Symptom</h3>
            <FoodImpactChart
              results={data.symptomResults}
              darkMode={darkMode}
            />
          </div>

          {/* Detailed Stats */}
          <div
            className={cn(
              'p-4 rounded-xl',
              darkMode ? 'bg-slate-900' : 'bg-white border border-slate-200'
            )}
          >
            <h3 className="font-medium mb-3">Details</h3>
            <div className="space-y-2">
              {data.symptomResults.map((r) => (
                <div
                  key={r.symptomType}
                  className={cn(
                    'p-3 rounded-lg flex items-center justify-between',
                    darkMode ? 'bg-slate-800' : 'bg-slate-50'
                  )}
                >
                  <div>
                    <span className="text-sm font-medium">
                      {r.symptomType.charAt(0).toUpperCase() +
                        r.symptomType.slice(1).replace(/([A-Z])/g, ' $1')}
                    </span>
                    <p
                      className={cn(
                        'text-[10px]',
                        darkMode ? 'text-slate-500' : 'text-slate-400'
                      )}
                    >
                      With: {r.avgWithFood} · Without: {r.avgWithoutFood}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'text-sm font-medium',
                      r.delta > 0
                        ? 'text-green-500'
                        : r.delta < 0
                        ? 'text-orange-500'
                        : darkMode
                        ? 'text-slate-500'
                        : 'text-slate-400'
                    )}
                  >
                    {r.delta > 0 ? '+' : ''}{r.delta.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

'use client'

import { cn } from '@/lib/utils'
import { type CorrelationResult } from '@/lib/correlation-engine'
import { CORE_SYMPTOMS } from '@/lib/symptom-utils'

interface Props {
  results: CorrelationResult[]
  darkMode?: boolean
}

export function FoodImpactChart({ results, darkMode = true }: Props) {
  if (results.length === 0) return null

  const maxAbs = Math.max(...results.map((r) => Math.abs(r.delta)), 1)

  return (
    <div className="space-y-3">
      {results.map((r) => {
        const symptomLabel =
          CORE_SYMPTOMS.find((s) => s.id === r.symptomType)?.label ||
          r.symptomType
        const isPositive = r.delta > 0
        const barWidth = Math.min(100, (Math.abs(r.delta) / maxAbs) * 100)

        return (
          <div key={r.symptomType}>
            <div className="flex items-center justify-between mb-1">
              <span
                className={cn(
                  'text-xs font-medium',
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                )}
              >
                {symptomLabel}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-[10px]',
                    darkMode ? 'text-slate-500' : 'text-slate-400'
                  )}
                >
                  {r.avgWithFood.toFixed(1)} vs {r.avgWithoutFood.toFixed(1)}
                </span>
                <span
                  className={cn(
                    'text-xs font-medium',
                    isPositive ? 'text-green-500' : 'text-orange-500'
                  )}
                >
                  {isPositive ? '+' : ''}{r.delta.toFixed(1)}
                </span>
              </div>
            </div>
            <div className="flex items-center h-3">
              {/* Negative bar (left side) */}
              <div className="flex-1 flex justify-end">
                {!isPositive && (
                  <div
                    className="h-full rounded-l bg-orange-500"
                    style={{ width: `${barWidth}%` }}
                  />
                )}
              </div>
              {/* Center line */}
              <div
                className={cn(
                  'w-px h-full mx-0.5',
                  darkMode ? 'bg-slate-600' : 'bg-slate-300'
                )}
              />
              {/* Positive bar (right side) */}
              <div className="flex-1">
                {isPositive && (
                  <div
                    className="h-full rounded-r bg-green-500"
                    style={{ width: `${barWidth}%` }}
                  />
                )}
              </div>
            </div>
          </div>
        )
      })}

      {/* Legend */}
      <div className="flex justify-center gap-4 pt-2">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span className={cn('text-[10px]', darkMode ? 'text-slate-500' : 'text-slate-400')}>
            Worsens
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className={cn('text-[10px]', darkMode ? 'text-slate-500' : 'text-slate-400')}>
            Improves
          </span>
        </div>
      </div>
    </div>
  )
}

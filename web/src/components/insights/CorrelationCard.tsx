'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { type CorrelationResult } from '@/lib/correlation-engine'
import { CORE_SYMPTOMS } from '@/lib/symptom-utils'

interface Props {
  correlation: CorrelationResult
  darkMode?: boolean
}

export function CorrelationCard({ correlation, darkMode = true }: Props) {
  const isPositive = correlation.delta > 0
  const symptomLabel =
    CORE_SYMPTOMS.find((s) => s.id === correlation.symptomType)?.label ||
    correlation.symptomType
  const absDelta = Math.abs(correlation.delta).toFixed(1)
  const pct = Math.round(
    (Math.abs(correlation.delta) / correlation.avgWithoutFood) * 100
  )

  return (
    <Link href={`/insights/food/${encodeURIComponent(correlation.foodName)}`}>
      <div
        className={cn(
          'p-4 rounded-lg',
          darkMode ? 'bg-slate-800 hover:bg-slate-750' : 'bg-white border border-slate-200 hover:bg-slate-50'
        )}
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <h4 className={cn('font-medium text-sm', darkMode ? 'text-white' : 'text-slate-900')}>
              {correlation.foodName}
            </h4>
            <span
              className={cn(
                'text-xs',
                darkMode ? 'text-slate-500' : 'text-slate-500'
              )}
            >
              {correlation.sampleSize} days of data ·{' '}
              {correlation.confidence.toLowerCase()} confidence
            </span>
          </div>
          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded-full font-medium',
              isPositive
                ? 'text-green-500 bg-green-500/20'
                : 'text-orange-500 bg-orange-500/20'
            )}
          >
            {isPositive ? '+' : '-'}{absDelta}
          </span>
        </div>
        <p className={cn('text-sm', darkMode ? 'text-slate-300' : 'text-slate-700')}>
          {isPositive ? (
            <>
              On days you eat {correlation.foodName.toLowerCase()}, your{' '}
              <strong>{symptomLabel.toLowerCase()}</strong> tends to be{' '}
              {pct > 0 ? `${pct}%` : absDelta + ' points'} better.
            </>
          ) : (
            <>
              On days you eat {correlation.foodName.toLowerCase()}, your{' '}
              <strong>{symptomLabel.toLowerCase()}</strong> tends to be{' '}
              {pct > 0 ? `${pct}%` : absDelta + ' points'} worse.
            </>
          )}
        </p>
      </div>
    </Link>
  )
}

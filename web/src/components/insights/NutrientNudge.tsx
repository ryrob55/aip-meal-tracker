'use client'

import { cn } from '@/lib/utils'
import type { NutrientNudge as NutrientNudgeType } from '@/lib/nutrient-tracking'

interface Props {
  nudge: NutrientNudgeType
  darkMode?: boolean
}

export function NutrientNudge({ nudge, darkMode = true }: Props) {
  const priorityColors = {
    high: darkMode ? 'border-orange-500/40 bg-orange-500/10' : 'border-orange-300 bg-orange-50',
    medium: darkMode ? 'border-yellow-500/40 bg-yellow-500/10' : 'border-yellow-300 bg-yellow-50',
    low: darkMode ? 'border-blue-500/40 bg-blue-500/10' : 'border-blue-300 bg-blue-50',
  }

  return (
    <div
      className={cn(
        'p-3 rounded-lg border',
        priorityColors[nudge.priority]
      )}
    >
      <div className="flex items-start justify-between mb-1">
        <h4
          className={cn(
            'text-sm font-medium',
            darkMode ? 'text-white' : 'text-slate-900'
          )}
        >
          {nudge.nutrient}
        </h4>
        {nudge.daysSinceLast != null && (
          <span
            className={cn(
              'text-[10px] px-1.5 py-0.5 rounded',
              darkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'
            )}
          >
            {nudge.daysSinceLast}d ago
          </span>
        )}
      </div>
      <p className={cn('text-xs mb-1', darkMode ? 'text-slate-400' : 'text-slate-600')}>
        {nudge.message}
      </p>
      <p className={cn('text-xs', darkMode ? 'text-slate-500' : 'text-slate-500')}>
        {nudge.suggestion}
      </p>
    </div>
  )
}

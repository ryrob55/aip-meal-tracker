'use client'

import { cn } from '@/lib/utils'
import { getResultLabel, getResultColor } from '@/lib/reintro-protocol'

interface Props {
  foodName: string
  result: string | null
  reintroStage: number
  resultNotes?: string | null
  reactionsCount?: number
  darkMode?: boolean
}

export function ReintroResultCard({
  foodName,
  result,
  reintroStage,
  resultNotes,
  reactionsCount = 0,
  darkMode = true,
}: Props) {
  return (
    <div
      className={cn(
        'p-4 rounded-lg',
        darkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4
            className={cn(
              'font-medium',
              darkMode ? 'text-white' : 'text-slate-900'
            )}
          >
            {foodName}
          </h4>
          <span
            className={cn(
              'text-xs',
              darkMode ? 'text-slate-500' : 'text-slate-500'
            )}
          >
            Stage {reintroStage}
          </span>
        </div>
        <span
          className={cn(
            'text-xs px-2 py-0.5 rounded-full font-medium',
            getResultColor(result as never)
          )}
        >
          {getResultLabel(result as never)}
        </span>
      </div>

      {reactionsCount > 0 && (
        <p
          className={cn(
            'text-xs',
            darkMode ? 'text-orange-400' : 'text-orange-600'
          )}
        >
          {reactionsCount} reaction{reactionsCount !== 1 ? 's' : ''} logged
        </p>
      )}

      {resultNotes && (
        <p
          className={cn(
            'text-xs mt-2',
            darkMode ? 'text-slate-400' : 'text-slate-600'
          )}
        >
          {resultNotes}
        </p>
      )}
    </div>
  )
}

'use client'

import { cn } from '@/lib/utils'
import {
  CORE_SYMPTOMS,
  sparklineData,
  averageScore,
  getScoreColor,
  loggedDaysCount,
  type SymptomLogData,
  type SymptomId,
} from '@/lib/symptom-utils'
import { SymptomSparkline } from './SymptomSparkline'

interface Props {
  logs: SymptomLogData[]
  darkMode?: boolean
}

export function SymptomOverview({ logs, darkMode = true }: Props) {
  const daysLogged = loggedDaysCount(logs, 7)

  return (
    <div>
      {/* Streak counter */}
      <div className="flex items-center justify-between mb-4">
        <h3
          className={cn(
            'text-sm font-medium',
            darkMode ? 'text-slate-300' : 'text-slate-700'
          )}
        >
          Symptom Trends (7 days)
        </h3>
        <span
          className={cn(
            'text-xs px-2 py-0.5 rounded-full',
            daysLogged >= 5
              ? 'bg-green-500/20 text-green-400'
              : daysLogged >= 3
              ? 'bg-yellow-500/20 text-yellow-400'
              : 'bg-slate-500/20 text-slate-400'
          )}
        >
          {daysLogged}/7 days logged
        </span>
      </div>

      {/* Symptom grid */}
      <div className="grid grid-cols-2 gap-3">
        {CORE_SYMPTOMS.map((symptom) => {
          const avg = averageScore(logs, symptom.id)
          const spark = sparklineData(logs, symptom.id, 7)

          return (
            <div
              key={symptom.id}
              className={cn(
                'p-3 rounded-lg',
                darkMode ? 'bg-slate-800' : 'bg-slate-100'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    'text-xs font-medium',
                    darkMode ? 'text-slate-400' : 'text-slate-600'
                  )}
                >
                  {symptom.label}
                </span>
                <span
                  className={cn(
                    'text-sm font-bold tabular-nums',
                    getScoreColor(avg)
                  )}
                >
                  {avg != null ? avg.toFixed(1) : '—'}
                </span>
              </div>
              <SymptomSparkline data={spark} width={120} height={20} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

'use client'

import { cn } from '@/lib/utils'
import { getScoreColor } from '@/lib/symptom-utils'

interface Props {
  label: string
  lowLabel: string
  highLabel: string
  value: number | null
  onChange: (value: number) => void
  darkMode?: boolean
}

export function SymptomSlider({
  label,
  lowLabel,
  highLabel,
  value,
  onChange,
  darkMode = true,
}: Props) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span
          className={cn(
            'text-sm font-medium',
            darkMode ? 'text-slate-200' : 'text-slate-800'
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            'text-lg font-bold tabular-nums',
            value != null ? getScoreColor(value) : darkMode ? 'text-slate-600' : 'text-slate-400'
          )}
        >
          {value != null ? value : '—'}
        </span>
      </div>

      <input
        type="range"
        min="1"
        max="10"
        value={value ?? 5}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className={cn(
          'w-full h-2 rounded-lg appearance-none cursor-pointer',
          darkMode ? 'bg-slate-700' : 'bg-slate-200',
          'accent-green-500'
        )}
      />

      <div className="flex justify-between">
        <span
          className={cn(
            'text-xs',
            darkMode ? 'text-slate-500' : 'text-slate-500'
          )}
        >
          {lowLabel}
        </span>
        <span
          className={cn(
            'text-xs',
            darkMode ? 'text-slate-500' : 'text-slate-500'
          )}
        >
          {highLabel}
        </span>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { CORE_SYMPTOMS, QUICK_SYMPTOMS, type SymptomLogData } from '@/lib/symptom-utils'
import { SymptomSlider } from './SymptomSlider'

interface Props {
  initialData?: Partial<SymptomLogData>
  time: 'MORNING' | 'EVENING'
  onSave: (data: Partial<SymptomLogData>) => Promise<void>
  onExpandToFull?: () => void
  darkMode?: boolean
}

export function QuickCheckIn({ initialData, time, onSave, onExpandToFull, darkMode = true }: Props) {
  const quickSymptoms = CORE_SYMPTOMS.filter((s) =>
    (QUICK_SYMPTOMS as readonly string[]).includes(s.id)
  )

  const [scores, setScores] = useState<Record<string, number | null>>({
    energy: initialData?.energy ?? null,
    digestion: initialData?.digestion ?? null,
    pain: initialData?.pain ?? null,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({
        time,
        ...scores,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const filledCount = Object.values(scores).filter((v) => v != null).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3
          className={cn(
            'text-sm font-medium',
            darkMode ? 'text-slate-300' : 'text-slate-700'
          )}
        >
          Quick Check-In
        </h3>
        {onExpandToFull && (
          <button
            onClick={onExpandToFull}
            className={cn(
              'text-xs',
              darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
            )}
          >
            Track all 8 symptoms
          </button>
        )}
      </div>

      {quickSymptoms.map((symptom) => (
        <SymptomSlider
          key={symptom.id}
          label={symptom.label}
          lowLabel={symptom.lowLabel}
          highLabel={symptom.highLabel}
          value={scores[symptom.id]}
          onChange={(val) => setScores((prev) => ({ ...prev, [symptom.id]: val }))}
          darkMode={darkMode}
        />
      ))}

      <button
        onClick={handleSave}
        disabled={saving || filledCount === 0}
        className={cn(
          'w-full py-3 rounded-lg font-medium transition-colors',
          saved
            ? 'bg-green-500 text-white'
            : saving
            ? 'bg-slate-600 text-slate-400'
            : filledCount === 0
            ? darkMode
              ? 'bg-slate-700 text-slate-500'
              : 'bg-slate-200 text-slate-400'
            : 'bg-green-500 text-white hover:bg-green-600'
        )}
      >
        {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Quick Check-In'}
      </button>
    </div>
  )
}

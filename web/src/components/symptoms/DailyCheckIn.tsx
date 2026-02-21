'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { CORE_SYMPTOMS, type SymptomLogData } from '@/lib/symptom-utils'
import { SymptomSlider } from './SymptomSlider'

interface Props {
  initialData?: Partial<SymptomLogData>
  time: 'MORNING' | 'EVENING'
  onSave: (data: Partial<SymptomLogData>) => Promise<void>
  darkMode?: boolean
}

export function DailyCheckIn({ initialData, time, onSave, darkMode = true }: Props) {
  const [scores, setScores] = useState<Record<string, number | null>>({
    energy: initialData?.energy ?? null,
    pain: initialData?.pain ?? null,
    digestion: initialData?.digestion ?? null,
    sleep: initialData?.sleep ?? null,
    skin: initialData?.skin ?? null,
    mood: initialData?.mood ?? null,
    brainFog: initialData?.brainFog ?? null,
    headache: initialData?.headache ?? null,
  })
  const [notes, setNotes] = useState(initialData?.notes || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({
        time,
        ...scores,
        notes: notes || undefined,
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
          {time === 'MORNING' ? 'Morning Check-In' : 'Evening Check-In'}
        </h3>
        <span
          className={cn(
            'text-xs',
            darkMode ? 'text-slate-500' : 'text-slate-500'
          )}
        >
          {filledCount}/{CORE_SYMPTOMS.length} tracked
        </span>
      </div>

      {CORE_SYMPTOMS.map((symptom) => (
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

      {/* Notes */}
      <div>
        <label
          className={cn(
            'block text-sm font-medium mb-1',
            darkMode ? 'text-slate-300' : 'text-slate-700'
          )}
        >
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything else to note today?"
          rows={2}
          className={cn(
            'w-full px-3 py-2 rounded-lg text-sm resize-none',
            darkMode
              ? 'bg-slate-800 text-white placeholder-slate-500 border border-slate-700'
              : 'bg-white text-slate-900 placeholder-slate-400 border border-slate-300'
          )}
        />
      </div>

      {/* Save button */}
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
        {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Check-In'}
      </button>
    </div>
  )
}

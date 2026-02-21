'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { PORTION_SCHEDULE } from '@/lib/reintro-protocol'

interface Props {
  testId: string
  completedPortions?: number
  onPortionComplete: (portionIndex: number) => void
  darkMode?: boolean
}

export function PortionTracker({
  testId,
  completedPortions = 0,
  onPortionComplete,
  darkMode = true,
}: Props) {
  const [countdown, setCountdown] = useState<number | null>(null)
  const [countdownTarget, setCountdownTarget] = useState<Date | null>(null)

  // Countdown timer
  useEffect(() => {
    if (!countdownTarget) return

    const interval = setInterval(() => {
      const remaining = Math.max(0, countdownTarget.getTime() - Date.now())
      setCountdown(Math.ceil(remaining / 1000))

      if (remaining <= 0) {
        setCountdown(null)
        setCountdownTarget(null)
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [countdownTarget])

  const handlePortionDone = (index: number) => {
    onPortionComplete(index)

    // Start countdown for next portion
    const nextPortion = PORTION_SCHEDULE[index]
    if (nextPortion && nextPortion.waitMinutes > 0 && index < PORTION_SCHEDULE.length - 1) {
      const target = new Date(Date.now() + nextPortion.waitMinutes * 60 * 1000)
      setCountdownTarget(target)
    }
  }

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-3">
      <h4
        className={cn(
          'text-sm font-medium',
          darkMode ? 'text-slate-300' : 'text-slate-700'
        )}
      >
        Day 0 — Graduated Portions
      </h4>

      {PORTION_SCHEDULE.map((portion, index) => {
        const isCompleted = index < completedPortions
        const isCurrent = index === completedPortions
        const isLocked = index > completedPortions

        return (
          <div
            key={index}
            className={cn(
              'p-3 rounded-lg flex items-center justify-between',
              isCompleted
                ? 'bg-green-500/20 border border-green-500/30'
                : isCurrent
                ? darkMode
                  ? 'bg-slate-800 border border-blue-500/50'
                  : 'bg-white border border-blue-500/50'
                : darkMode
                ? 'bg-slate-800/50 border border-transparent'
                : 'bg-slate-50 border border-transparent'
            )}
          >
            <div>
              <span
                className={cn(
                  'text-sm font-medium',
                  isCompleted
                    ? 'text-green-400'
                    : isLocked
                    ? darkMode ? 'text-slate-600' : 'text-slate-400'
                    : darkMode ? 'text-white' : 'text-slate-900'
                )}
              >
                {portion.portion}
              </span>
              {portion.waitMinutes > 0 && index < PORTION_SCHEDULE.length - 1 && (
                <p
                  className={cn(
                    'text-xs',
                    darkMode ? 'text-slate-500' : 'text-slate-500'
                  )}
                >
                  Wait {portion.waitMinutes >= 60
                    ? `${Math.round(portion.waitMinutes / 60 * 10) / 10} hours`
                    : `${portion.waitMinutes} min`} before next
                </p>
              )}
            </div>

            {isCompleted ? (
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : isCurrent ? (
              countdown != null ? (
                <span className="text-sm font-mono text-blue-400">
                  {formatTime(countdown)}
                </span>
              ) : (
                <button
                  onClick={() => handlePortionDone(index)}
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500 text-white hover:bg-blue-600"
                >
                  Done
                </button>
              )
            ) : (
              <span className={cn('text-xs', darkMode ? 'text-slate-600' : 'text-slate-400')}>
                Locked
              </span>
            )}
          </div>
        )
      })}

      {completedPortions >= PORTION_SCHEDULE.length && (
        <div
          className={cn(
            'p-3 rounded-lg text-center',
            'bg-green-500/20 border border-green-500/30'
          )}
        >
          <p className="text-sm text-green-400 font-medium">
            All portions complete! Do NOT eat this food again until Day 4.
          </p>
        </div>
      )}
    </div>
  )
}

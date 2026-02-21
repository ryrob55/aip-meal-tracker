'use client'

import { cn } from '@/lib/utils'
import { getCurrentTestDay, getStatusColor, getStatusLabel } from '@/lib/reintro-protocol'

interface Props {
  testDate: string
  status: string
  darkMode?: boolean
}

const DAYS = [
  { day: 0, label: 'Test', phase: 'TESTING_DAY0' },
  { day: 1, label: 'Obs 1', phase: 'OBSERVING' },
  { day: 2, label: 'Obs 2', phase: 'OBSERVING' },
  { day: 3, label: 'Obs 3', phase: 'OBSERVING' },
  { day: 4, label: 'Conf 1', phase: 'CONFIRMING' },
  { day: 5, label: 'Conf 2', phase: 'CONFIRMING' },
  { day: 6, label: 'Conf 3', phase: 'CONFIRMING' },
  { day: 7, label: 'Done', phase: 'COMPLETE' },
]

export function ReintroTimeline({ testDate, status, darkMode = true }: Props) {
  const currentDay = getCurrentTestDay(new Date(testDate))

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span
          className={cn(
            'text-xs font-medium',
            darkMode ? 'text-slate-400' : 'text-slate-600'
          )}
        >
          7-Day Protocol
        </span>
        <span
          className={cn(
            'text-xs px-2 py-0.5 rounded-full',
            getStatusColor(status as never)
          )}
        >
          {getStatusLabel(status as never)}
        </span>
      </div>

      <div className="flex gap-1">
        {DAYS.map((d) => {
          const isPast = d.day < currentDay
          const isCurrent = d.day === currentDay
          const isFuture = d.day > currentDay

          return (
            <div key={d.day} className="flex-1 text-center">
              <div
                className={cn(
                  'h-2 rounded-full mb-1',
                  isPast && 'bg-green-500',
                  isCurrent && 'bg-blue-500 animate-pulse',
                  isFuture && (darkMode ? 'bg-slate-700' : 'bg-slate-200')
                )}
              />
              <span
                className={cn(
                  'text-[10px]',
                  isCurrent
                    ? darkMode ? 'text-white font-medium' : 'text-slate-900 font-medium'
                    : darkMode ? 'text-slate-500' : 'text-slate-400'
                )}
              >
                {d.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

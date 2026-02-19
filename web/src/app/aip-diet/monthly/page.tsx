'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import type { MealPlanItem, AIPQuestionnaire } from '@prisma/client'

interface MealPlan {
  id: string
  weekStartDate: string
  items: MealPlanItem[]
}

export default function MonthlyPage() {
  const { darkMode } = useTheme()
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Fetch questionnaire for targets
  const { data: questionnaire } = useQuery<AIPQuestionnaire | null>({
    queryKey: ['aipQuestionnaire'],
    queryFn: async () => {
      const res = await fetch('/api/aip-diet/questionnaire')
      if (!res.ok) return null
      return res.json()
    },
  })

  // Fetch meal plans for the month (we'd need multiple weeks)
  // For now, we'll just show a placeholder calendar

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  // Generate calendar days
  const calendarDays: Date[] = []
  let day = calendarStart
  while (day <= calendarEnd) {
    calendarDays.push(day)
    day = addDays(day, 1)
  }

  // Group into weeks
  const weeks: Date[][] = []
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7))
  }

  const weekDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div
      className={cn(
        'min-h-screen',
        darkMode ? 'bg-slate-900' : 'bg-slate-50'
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'sticky top-0 z-10 px-4 py-3 border-b',
          darkMode
            ? 'bg-slate-900 border-slate-800'
            : 'bg-white border-slate-200'
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/aip-diet"
              className={cn(
                'p-2 -ml-2 rounded-lg transition-colors',
                darkMode
                  ? 'hover:bg-slate-800 text-slate-400'
                  : 'hover:bg-slate-100 text-slate-600'
              )}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
            <h1
              className={cn(
                'text-lg font-bold',
                darkMode ? 'text-white' : 'text-slate-900'
              )}
            >
              Monthly View
            </h1>
          </div>
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className={cn(
              'p-2 rounded-lg transition-colors',
              darkMode
                ? 'hover:bg-slate-800 text-slate-400'
                : 'hover:bg-slate-100 text-slate-600'
            )}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <h2
            className={cn(
              'text-lg font-bold',
              darkMode ? 'text-white' : 'text-slate-900'
            )}
          >
            {format(currentMonth, 'MMMM yyyy')}
          </h2>

          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className={cn(
              'p-2 rounded-lg transition-colors',
              darkMode
                ? 'hover:bg-slate-800 text-slate-400'
                : 'hover:bg-slate-100 text-slate-600'
            )}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="p-4">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDayNames.map((name) => (
            <div
              key={name}
              className={cn(
                'text-center text-xs font-medium py-2',
                darkMode ? 'text-slate-500' : 'text-slate-500'
              )}
            >
              {name}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="space-y-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1">
              {week.map((day) => {
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const isDayToday = isToday(day)

                return (
                  <Link
                    key={day.toISOString()}
                    href={`/aip-diet?date=${format(day, 'yyyy-MM-dd')}`}
                    className={cn(
                      'aspect-square p-1 rounded-lg transition-colors flex flex-col',
                      !isCurrentMonth && 'opacity-30',
                      isDayToday
                        ? 'bg-green-500/20 border-2 border-green-500'
                        : darkMode
                        ? 'bg-slate-800 hover:bg-slate-700'
                        : 'bg-white hover:bg-slate-100 border border-slate-200'
                    )}
                  >
                    <span
                      className={cn(
                        'text-sm font-medium',
                        isDayToday
                          ? 'text-green-500'
                          : darkMode
                          ? 'text-slate-300'
                          : 'text-slate-700'
                      )}
                    >
                      {format(day, 'd')}
                    </span>

                    {/* Placeholder for meal indicators */}
                    <div className="flex-1 flex items-end justify-center pb-1">
                      <div className="flex gap-0.5">
                        {/* These would show actual meal completion status */}
                        {isCurrentMonth && (
                          <>
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div
          className={cn(
            'mt-6 p-4 rounded-lg',
            darkMode ? 'bg-slate-800' : 'bg-slate-100'
          )}
        >
          <h3
            className={cn(
              'text-sm font-medium mb-3',
              darkMode ? 'text-slate-300' : 'text-slate-700'
            )}
          >
            Legend
          </h3>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
                All meals logged
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
                Partial
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-600" />
              <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
                No meals
              </span>
            </div>
          </div>
        </div>

        {/* Targets reminder */}
        {questionnaire && (
          <div
            className={cn(
              'mt-4 p-4 rounded-lg',
              darkMode ? 'bg-slate-800' : 'bg-slate-100'
            )}
          >
            <h3
              className={cn(
                'text-sm font-medium mb-2',
                darkMode ? 'text-slate-300' : 'text-slate-700'
              )}
            >
              Your Daily Targets
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <p
                  className={cn(
                    'font-bold',
                    darkMode ? 'text-green-400' : 'text-green-600'
                  )}
                >
                  {questionnaire.dailyCalories}
                </p>
                <p className="text-xs text-slate-500">Calories</p>
              </div>
              <div>
                <p
                  className={cn(
                    'font-bold',
                    darkMode ? 'text-blue-400' : 'text-blue-600'
                  )}
                >
                  {questionnaire.dailyProtein}g
                </p>
                <p className="text-xs text-slate-500">Protein</p>
              </div>
              <div>
                <p
                  className={cn(
                    'font-bold',
                    darkMode ? 'text-orange-400' : 'text-orange-600'
                  )}
                >
                  ≤{questionnaire.dailyNetCarbs}g
                </p>
                <p className="text-xs text-slate-500">Net Carbs</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick jump to today */}
        {!isSameMonth(new Date(), currentMonth) && (
          <button
            onClick={() => setCurrentMonth(new Date())}
            className={cn(
              'w-full mt-4 py-3 rounded-lg font-medium transition-colors',
              darkMode
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            )}
          >
            Jump to Today
          </button>
        )}
      </div>
    </div>
  )
}

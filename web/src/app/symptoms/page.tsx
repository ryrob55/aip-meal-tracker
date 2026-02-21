'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BarChart3 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import { type SymptomLogData } from '@/lib/symptom-utils'
import { QuickCheckIn, DailyCheckIn, SymptomOverview } from '@/components/symptoms'

export default function SymptomsPage() {
  const { darkMode } = useTheme()
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<'quick' | 'full'>('quick')

  const today = new Date().toISOString().split('T')[0]
  const hour = new Date().getHours()
  const defaultTime: 'MORNING' | 'EVENING' = hour < 14 ? 'MORNING' : 'EVENING'

  // Fetch today's logs
  const { data: todayLogs = [] } = useQuery<SymptomLogData[]>({
    queryKey: ['symptoms', 'today', today],
    queryFn: async () => {
      const res = await fetch(`/api/symptoms?date=${today}`)
      if (!res.ok) return []
      return res.json()
    },
  })

  // Fetch last 7 days for overview
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const fromDate = sevenDaysAgo.toISOString().split('T')[0]

  const { data: weekLogs = [] } = useQuery<SymptomLogData[]>({
    queryKey: ['symptoms', 'week', fromDate],
    queryFn: async () => {
      const res = await fetch(`/api/symptoms?from=${fromDate}&to=${today}`)
      if (!res.ok) return []
      return res.json()
    },
  })

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<SymptomLogData>) => {
      const res = await fetch('/api/symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, date: today }),
      })
      if (!res.ok) throw new Error('Failed to save')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['symptoms'] })
    },
  })

  const existingLog = todayLogs.find((l) => l.time === defaultTime)

  return (
    <div className={cn('min-h-screen', darkMode ? 'bg-slate-900' : 'bg-slate-50')}>
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/aip-diet"
              className={cn(
                'p-2 rounded-lg',
                darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-200'
              )}
            >
              <ArrowLeft className={cn('w-5 h-5', darkMode ? 'text-slate-400' : 'text-slate-600')} />
            </Link>
            <h1 className={cn('text-xl font-bold', darkMode ? 'text-white' : 'text-slate-900')}>
              How Are You Feeling?
            </h1>
          </div>
          <Link
            href="/symptoms/history"
            className={cn(
              'p-2 rounded-lg',
              darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'
            )}
          >
            <BarChart3 className="w-5 h-5" />
          </Link>
        </div>

        {/* Time picker */}
        <div className="flex gap-2 mb-6">
          {(['MORNING', 'EVENING'] as const).map((t) => {
            const hasLog = todayLogs.some((l) => l.time === t)
            return (
              <button
                key={t}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-medium transition-colors relative',
                  defaultTime === t
                    ? 'bg-green-500 text-white'
                    : darkMode
                    ? 'bg-slate-800 text-slate-400'
                    : 'bg-slate-100 text-slate-600'
                )}
                disabled
              >
                {t === 'MORNING' ? 'Morning' : 'Evening'}
                {hasLog && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-400" />
                )}
              </button>
            )
          })}
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('quick')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              mode === 'quick'
                ? 'bg-blue-500 text-white'
                : darkMode
                ? 'bg-slate-800 text-slate-400'
                : 'bg-slate-100 text-slate-600'
            )}
          >
            Quick (3 symptoms)
          </button>
          <button
            onClick={() => setMode('full')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              mode === 'full'
                ? 'bg-blue-500 text-white'
                : darkMode
                ? 'bg-slate-800 text-slate-400'
                : 'bg-slate-100 text-slate-600'
            )}
          >
            Full (all 8)
          </button>
        </div>

        {/* Check-in form */}
        <div
          className={cn(
            'p-4 rounded-lg mb-6',
            darkMode ? 'bg-slate-800/50' : 'bg-white border border-slate-200'
          )}
        >
          {mode === 'quick' ? (
            <QuickCheckIn
              initialData={existingLog || undefined}
              time={defaultTime}
              onSave={(data) => saveMutation.mutateAsync(data)}
              onExpandToFull={() => setMode('full')}
              darkMode={darkMode}
            />
          ) : (
            <DailyCheckIn
              initialData={existingLog || undefined}
              time={defaultTime}
              onSave={(data) => saveMutation.mutateAsync(data)}
              darkMode={darkMode}
            />
          )}
        </div>

        {/* Overview */}
        {weekLogs.length > 0 && (
          <SymptomOverview logs={weekLogs} darkMode={darkMode} />
        )}
      </div>
    </div>
  )
}

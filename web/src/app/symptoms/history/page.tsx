'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import {
  CORE_SYMPTOMS,
  weeklyAverages,
  calculateTrend,
  getScoreColor,
  type SymptomLogData,
  type SymptomId,
} from '@/lib/symptom-utils'
import { SymptomTrendChart } from '@/components/symptoms'

export default function SymptomHistoryPage() {
  const { darkMode } = useTheme()
  const [days, setDays] = useState(14)
  const [selectedSymptom, setSelectedSymptom] = useState<SymptomId | null>(null)

  const today = new Date().toISOString().split('T')[0]
  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - days)
  const fromStr = fromDate.toISOString().split('T')[0]

  const { data: logs = [], isLoading } = useQuery<SymptomLogData[]>({
    queryKey: ['symptoms', 'history', fromStr, today],
    queryFn: async () => {
      const res = await fetch(`/api/symptoms?from=${fromStr}&to=${today}`)
      if (!res.ok) return []
      return res.json()
    },
  })

  // Split logs into recent (last half) and older (first half) for trend
  const midpoint = Math.floor(logs.length / 2)
  const olderLogs = logs.slice(0, midpoint)
  const recentLogs = logs.slice(midpoint)
  const averages = weeklyAverages(logs)

  return (
    <div className={cn('min-h-screen', darkMode ? 'bg-slate-900' : 'bg-slate-50')}>
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/symptoms"
            className={cn(
              'p-2 rounded-lg',
              darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-200'
            )}
          >
            <ArrowLeft className={cn('w-5 h-5', darkMode ? 'text-slate-400' : 'text-slate-600')} />
          </Link>
          <h1 className={cn('text-xl font-bold', darkMode ? 'text-white' : 'text-slate-900')}>
            Symptom History
          </h1>
        </div>

        {/* Period selector */}
        <div className="flex gap-2 mb-6">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                days === d
                  ? 'bg-green-500 text-white'
                  : darkMode
                  ? 'bg-slate-800 text-slate-400'
                  : 'bg-slate-100 text-slate-600'
              )}
            >
              {d} days
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full" />
          </div>
        ) : logs.length === 0 ? (
          <div
            className={cn(
              'text-center py-12',
              darkMode ? 'text-slate-500' : 'text-slate-500'
            )}
          >
            <p className="text-sm">No symptom data for this period.</p>
            <Link href="/symptoms" className="text-green-500 text-sm mt-2 inline-block">
              Log your first check-in
            </Link>
          </div>
        ) : (
          <>
            {/* Chart */}
            <div
              className={cn(
                'p-4 rounded-lg mb-6',
                darkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <h3
                  className={cn(
                    'text-sm font-medium',
                    darkMode ? 'text-slate-300' : 'text-slate-700'
                  )}
                >
                  {selectedSymptom
                    ? CORE_SYMPTOMS.find((s) => s.id === selectedSymptom)?.label
                    : 'All Symptoms'}
                </h3>
                {selectedSymptom && (
                  <button
                    onClick={() => setSelectedSymptom(null)}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Show all
                  </button>
                )}
              </div>
              <SymptomTrendChart
                logs={logs}
                symptomId={selectedSymptom || undefined}
                days={days}
                darkMode={darkMode}
              />
            </div>

            {/* Symptom averages */}
            <div className="space-y-2">
              <h3
                className={cn(
                  'text-sm font-medium mb-3',
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                )}
              >
                Averages & Trends
              </h3>
              {CORE_SYMPTOMS.map((symptom) => {
                const avg = averages[symptom.id]
                const trend = calculateTrend(recentLogs, olderLogs, symptom.id)

                return (
                  <button
                    key={symptom.id}
                    onClick={() =>
                      setSelectedSymptom(
                        selectedSymptom === symptom.id ? null : symptom.id
                      )
                    }
                    className={cn(
                      'w-full p-3 rounded-lg flex items-center justify-between transition-all',
                      selectedSymptom === symptom.id
                        ? 'bg-green-500/20 border border-green-500/50'
                        : darkMode
                        ? 'bg-slate-800 hover:bg-slate-750'
                        : 'bg-white border border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <span
                      className={cn(
                        'text-sm',
                        darkMode ? 'text-slate-200' : 'text-slate-800'
                      )}
                    >
                      {symptom.label}
                    </span>
                    <div className="flex items-center gap-3">
                      {trend != null && (
                        <span
                          className={cn(
                            'text-xs font-medium',
                            trend > 0
                              ? 'text-green-400'
                              : trend < 0
                              ? 'text-red-400'
                              : 'text-slate-500'
                          )}
                        >
                          {trend > 0 ? '+' : ''}{trend.toFixed(1)}
                        </span>
                      )}
                      <span
                        className={cn(
                          'text-sm font-bold tabular-nums',
                          getScoreColor(avg)
                        )}
                      >
                        {avg != null ? avg.toFixed(1) : '—'}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

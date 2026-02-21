'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import { ReintroResultCard } from '@/components/reintro'
import {
  getResultLabel,
  type ReintroStatusType,
  type ReintroResultType,
} from '@/lib/reintro-protocol'

interface ReintroTest {
  id: string
  foodName: string
  foodCategory: string | null
  reintroStage: number
  status: ReintroStatusType
  testDate: string
  result: ReintroResultType | null
  resultNotes: string | null
  reactions: { id: string }[]
  createdAt: string
}

type FilterType = 'all' | 'PASS' | 'FAIL' | 'INCONCLUSIVE' | 'ABANDONED'

export default function ReintroHistoryPage() {
  const { darkMode } = useTheme()
  const [filter, setFilter] = useState<FilterType>('all')

  const { data: tests = [], isLoading } = useQuery<ReintroTest[]>({
    queryKey: ['reintro-tests'],
    queryFn: async () => {
      const res = await fetch('/api/reintro')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
  })

  const completedTests = tests.filter(
    (t) => t.status === 'COMPLETE' || t.status === 'ABANDONED'
  )

  const filteredTests =
    filter === 'all'
      ? completedTests
      : filter === 'ABANDONED'
      ? completedTests.filter((t) => t.status === 'ABANDONED')
      : completedTests.filter((t) => t.result === filter)

  const counts = {
    all: completedTests.length,
    PASS: completedTests.filter((t) => t.result === 'PASS').length,
    FAIL: completedTests.filter((t) => t.result === 'FAIL').length,
    INCONCLUSIVE: completedTests.filter((t) => t.result === 'INCONCLUSIVE')
      .length,
    ABANDONED: completedTests.filter((t) => t.status === 'ABANDONED').length,
  }

  const filters: { value: FilterType; label: string }[] = [
    { value: 'all', label: `All (${counts.all})` },
    { value: 'PASS', label: `Safe (${counts.PASS})` },
    { value: 'FAIL', label: `Reactions (${counts.FAIL})` },
    { value: 'INCONCLUSIVE', label: `Unclear (${counts.INCONCLUSIVE})` },
    { value: 'ABANDONED', label: `Paused (${counts.ABANDONED})` },
  ]

  return (
    <div
      className={cn(
        'min-h-screen p-4 pb-24',
        darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/reintro"
          className={cn(
            'p-2 rounded-lg',
            darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-200'
          )}
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">Test History</h1>
      </div>

      {/* Summary cards */}
      {completedTests.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div
            className={cn(
              'p-3 rounded-xl text-center',
              darkMode ? 'bg-slate-900' : 'bg-white border border-slate-200'
            )}
          >
            <div className="text-2xl font-bold text-green-500">
              {counts.PASS}
            </div>
            <div
              className={cn(
                'text-[10px]',
                darkMode ? 'text-slate-500' : 'text-slate-500'
              )}
            >
              Safe Foods
            </div>
          </div>
          <div
            className={cn(
              'p-3 rounded-xl text-center',
              darkMode ? 'bg-slate-900' : 'bg-white border border-slate-200'
            )}
          >
            <div className="text-2xl font-bold text-orange-500">
              {counts.FAIL}
            </div>
            <div
              className={cn(
                'text-[10px]',
                darkMode ? 'text-slate-500' : 'text-slate-500'
              )}
            >
              Reactions
            </div>
          </div>
          <div
            className={cn(
              'p-3 rounded-xl text-center',
              darkMode ? 'bg-slate-900' : 'bg-white border border-slate-200'
            )}
          >
            <div className="text-2xl font-bold text-yellow-500">
              {counts.INCONCLUSIVE}
            </div>
            <div
              className={cn(
                'text-[10px]',
                darkMode ? 'text-slate-500' : 'text-slate-500'
              )}
            >
              Inconclusive
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : completedTests.length === 0 ? (
        <div
          className={cn(
            'p-8 rounded-xl text-center',
            darkMode ? 'bg-slate-900' : 'bg-white border border-slate-200'
          )}
        >
          <p
            className={cn(
              'text-sm',
              darkMode ? 'text-slate-500' : 'text-slate-500'
            )}
          >
            No completed tests yet. Start your first reintroduction test to see
            results here.
          </p>
          <Link
            href="/reintro/new"
            className="inline-block mt-3 text-sm text-blue-400"
          >
            Start a test
          </Link>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 no-scrollbar">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs whitespace-nowrap',
                  filter === f.value
                    ? 'bg-blue-500 text-white'
                    : darkMode
                    ? 'bg-slate-800 text-slate-300'
                    : 'bg-slate-100 text-slate-700'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Test list */}
          <div className="space-y-2">
            {filteredTests.map((test) => (
              <Link key={test.id} href={`/reintro/${test.id}/results`}>
                <div className="mb-2">
                  <ReintroResultCard
                    foodName={test.foodName}
                    result={test.status === 'ABANDONED' ? null : test.result}
                    reintroStage={test.reintroStage}
                    resultNotes={
                      test.status === 'ABANDONED'
                        ? 'Test was paused'
                        : test.resultNotes
                    }
                    reactionsCount={test.reactions.length}
                    darkMode={darkMode}
                  />
                </div>
              </Link>
            ))}

            {filteredTests.length === 0 && (
              <p
                className={cn(
                  'text-sm text-center py-8',
                  darkMode ? 'text-slate-600' : 'text-slate-400'
                )}
              >
                No tests match this filter
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

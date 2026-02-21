'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, History } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import { ReintroTimeline, ReintroResultCard } from '@/components/reintro'
import {
  getStatusLabel,
  getStatusColor,
  getCurrentTestDay,
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
  updatedAt: string
}

export default function ReintroPage() {
  const { darkMode } = useTheme()
  const [tab, setTab] = useState<'active' | 'completed'>('active')

  const { data: tests = [], isLoading } = useQuery<ReintroTest[]>({
    queryKey: ['reintro-tests'],
    queryFn: async () => {
      const res = await fetch('/api/reintro')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
  })

  const activeTest = tests.find((t) =>
    ['TESTING_DAY0', 'OBSERVING', 'CONFIRMING'].includes(t.status)
  )
  const completedTests = tests.filter(
    (t) => t.status === 'COMPLETE' || t.status === 'ABANDONED'
  )
  const pendingTests = tests.filter((t) => t.status === 'NOT_STARTED')

  return (
    <div
      className={cn(
        'min-h-screen p-4 pb-24',
        darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className={cn(
              'p-2 rounded-lg',
              darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-200'
            )}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">Reintroduction</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/reintro/history"
            className={cn(
              'p-2 rounded-lg',
              darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-200'
            )}
          >
            <History className="w-5 h-5" />
          </Link>
          {!activeTest && (
            <Link
              href="/reintro/new"
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600"
            >
              <Plus className="w-4 h-4" />
              New Test
            </Link>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Active Test Banner */}
          {activeTest && (
            <Link href={`/reintro/${activeTest.id}`}>
              <div
                className={cn(
                  'p-4 rounded-xl mb-6 border',
                  darkMode
                    ? 'bg-slate-900 border-blue-500/30'
                    : 'bg-white border-blue-500/30'
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{activeTest.foodName}</h3>
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        getStatusColor(activeTest.status)
                      )}
                    >
                      {getStatusLabel(activeTest.status)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={cn(
                        'text-xs',
                        darkMode ? 'text-slate-400' : 'text-slate-500'
                      )}
                    >
                      Day {getCurrentTestDay(new Date(activeTest.testDate))}
                    </span>
                    <p className="text-xs text-blue-400 mt-1">Tap for details</p>
                  </div>
                </div>
                <ReintroTimeline
                  testDate={activeTest.testDate}
                  status={activeTest.status}
                  darkMode={darkMode}
                />
              </div>
            </Link>
          )}

          {/* Pending Tests */}
          {pendingTests.length > 0 && (
            <div className="mb-6">
              <h3
                className={cn(
                  'text-sm font-medium mb-3',
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                )}
              >
                Upcoming
              </h3>
              {pendingTests.map((test) => (
                <Link key={test.id} href={`/reintro/${test.id}`}>
                  <div
                    className={cn(
                      'p-3 rounded-lg mb-2 flex items-center justify-between',
                      darkMode
                        ? 'bg-slate-900 hover:bg-slate-800'
                        : 'bg-white hover:bg-slate-50 border border-slate-200'
                    )}
                  >
                    <div>
                      <span className="font-medium">{test.foodName}</span>
                      <p
                        className={cn(
                          'text-xs',
                          darkMode ? 'text-slate-500' : 'text-slate-500'
                        )}
                      >
                        Stage {test.reintroStage}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full',
                        getStatusColor(test.status)
                      )}
                    >
                      Not Started
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* No Tests State */}
          {!activeTest && pendingTests.length === 0 && completedTests.length === 0 && (
            <div
              className={cn(
                'p-8 rounded-xl text-center',
                darkMode ? 'bg-slate-900' : 'bg-white border border-slate-200'
              )}
            >
              <div className="text-4xl mb-3">🧪</div>
              <h3 className="font-semibold text-lg mb-2">
                Ready to reintroduce foods?
              </h3>
              <p
                className={cn(
                  'text-sm mb-4',
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                )}
              >
                After at least 30 days on the elimination diet, you can begin
                testing foods one at a time using a structured 7-day protocol.
              </p>
              <Link
                href="/reintro/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600"
              >
                <Plus className="w-4 h-4" />
                Start Your First Test
              </Link>
              <Link
                href="/learn/reintroduction"
                className={cn(
                  'block mt-3 text-sm',
                  darkMode ? 'text-blue-400' : 'text-blue-600'
                )}
              >
                Learn how reintroduction works
              </Link>
            </div>
          )}

          {/* Completed Tests */}
          {completedTests.length > 0 && (
            <div>
              <h3
                className={cn(
                  'text-sm font-medium mb-3',
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                )}
              >
                Completed ({completedTests.length})
              </h3>
              <div className="space-y-2">
                {completedTests.slice(0, 5).map((test) => (
                  <Link key={test.id} href={`/reintro/${test.id}/results`}>
                    <ReintroResultCard
                      foodName={test.foodName}
                      result={test.result}
                      reintroStage={test.reintroStage}
                      resultNotes={test.resultNotes}
                      reactionsCount={test.reactions.length}
                      darkMode={darkMode}
                    />
                  </Link>
                ))}
                {completedTests.length > 5 && (
                  <Link
                    href="/reintro/history"
                    className={cn(
                      'block text-center text-sm py-2',
                      darkMode ? 'text-blue-400' : 'text-blue-600'
                    )}
                  >
                    View all {completedTests.length} tests
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

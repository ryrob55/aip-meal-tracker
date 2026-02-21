'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertCircle, BarChart3, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import { ReintroTimeline, PortionTracker } from '@/components/reintro'
import {
  getStatusLabel,
  getStatusColor,
  getCurrentTestDay,
  getExpectedStatus,
  PORTION_SCHEDULE,
  type ReintroStatusType,
  type ReintroResultType,
} from '@/lib/reintro-protocol'

interface Reaction {
  id: string
  symptomType: string
  severity: number
  notes: string | null
  timestamp: string
}

interface ReintroTest {
  id: string
  foodName: string
  foodCategory: string | null
  reintroStage: number
  status: ReintroStatusType
  testDate: string
  portion1Time: string | null
  portion2Time: string | null
  portion3Time: string | null
  result: ReintroResultType | null
  resultNotes: string | null
  reactions: Reaction[]
  symptomsBefore: Record<string, number> | null
  symptomsDuring: Record<string, number> | null
  symptomsAfter: Record<string, number> | null
}

const SYMPTOM_TYPES = [
  'Digestive',
  'Skin',
  'Joint Pain',
  'Headache',
  'Fatigue',
  'Brain Fog',
  'Mood Change',
  'Sleep Issue',
  'Other',
]

export default function TestDetailPage() {
  const { darkMode } = useTheme()
  const router = useRouter()
  const params = useParams()
  const testId = params.testId as string
  const queryClient = useQueryClient()

  const [showReactionForm, setShowReactionForm] = useState(false)
  const [reactionType, setReactionType] = useState('Digestive')
  const [reactionSeverity, setReactionSeverity] = useState(3)
  const [reactionNotes, setReactionNotes] = useState('')
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false)
  const [showResultForm, setShowResultForm] = useState(false)
  const [resultChoice, setResultChoice] = useState<ReintroResultType>('PASS')
  const [resultNotes, setResultNotes] = useState('')

  const { data: test, isLoading } = useQuery<ReintroTest>({
    queryKey: ['reintro-test', testId],
    queryFn: async () => {
      const res = await fetch(`/api/reintro/${testId}`)
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    refetchInterval: 30000,
  })

  const updateTest = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/reintro/${testId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reintro-test', testId] })
      queryClient.invalidateQueries({ queryKey: ['reintro-tests'] })
    },
  })

  const addReaction = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/reintro/${testId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptomType: reactionType,
          severity: reactionSeverity,
          notes: reactionNotes || undefined,
        }),
      })
      if (!res.ok) throw new Error('Failed to log reaction')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reintro-test', testId] })
      setShowReactionForm(false)
      setReactionNotes('')
      setReactionSeverity(3)
    },
  })

  const deleteTest = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/reintro/${testId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reintro-tests'] })
      router.push('/reintro')
    },
  })

  if (isLoading || !test) {
    return (
      <div
        className={cn(
          'min-h-screen flex items-center justify-center',
          darkMode ? 'bg-slate-900' : 'bg-slate-50'
        )}
      >
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const currentDay = getCurrentTestDay(new Date(test.testDate))
  const isActive = ['TESTING_DAY0', 'OBSERVING', 'CONFIRMING'].includes(test.status)
  const isComplete = test.status === 'COMPLETE'
  const completedPortions = [test.portion1Time, test.portion2Time, test.portion3Time].filter(Boolean).length
  // The last portion doesn't have a time recorded; consider it as 1 beyond the timed ones
  const effectivePortions = completedPortions

  const handleStartTest = () => {
    updateTest.mutate({ status: 'TESTING_DAY0' })
  }

  const handlePortionComplete = (index: number) => {
    const portionKey = `portion${index + 1}Time`
    const amountKey = `portion${index + 1}Amount`
    const now = new Date().toISOString()
    updateTest.mutate({
      [portionKey]: now,
      [amountKey]: PORTION_SCHEDULE[index].portion,
    })
  }

  const handleAdvanceStatus = () => {
    const expected = getExpectedStatus(new Date(test.testDate))
    if (expected !== test.status) {
      updateTest.mutate({ status: expected })
    }
  }

  const handleSubmitResult = () => {
    updateTest.mutate({
      status: 'COMPLETE',
      result: resultChoice,
      resultNotes: resultNotes || undefined,
    })
    setShowResultForm(false)
  }

  const handleAbandon = () => {
    updateTest.mutate({ status: 'ABANDONED' })
    setShowAbandonConfirm(false)
  }

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
            href="/reintro"
            className={cn(
              'p-2 rounded-lg',
              darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-200'
            )}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">{test.foodName}</h1>
            <span
              className={cn(
                'text-xs',
                darkMode ? 'text-slate-500' : 'text-slate-500'
              )}
            >
              Stage {test.reintroStage}
            </span>
          </div>
        </div>
        {isComplete && (
          <Link
            href={`/reintro/${testId}/results`}
            className={cn(
              'p-2 rounded-lg',
              darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-200'
            )}
          >
            <BarChart3 className="w-5 h-5" />
          </Link>
        )}
      </div>

      {/* Timeline */}
      <div
        className={cn(
          'p-4 rounded-xl mb-4',
          darkMode ? 'bg-slate-900' : 'bg-white border border-slate-200'
        )}
      >
        <ReintroTimeline
          testDate={test.testDate}
          status={test.status}
          darkMode={darkMode}
        />
      </div>

      {/* NOT_STARTED: Start button */}
      {test.status === 'NOT_STARTED' && (
        <div
          className={cn(
            'p-4 rounded-xl mb-4',
            darkMode ? 'bg-slate-900' : 'bg-white border border-slate-200'
          )}
        >
          <h3 className="font-medium mb-2">Ready to begin?</h3>
          <p
            className={cn(
              'text-sm mb-4',
              darkMode ? 'text-slate-400' : 'text-slate-600'
            )}
          >
            Make sure you have some {test.foodName.toLowerCase()} on hand. You&apos;ll eat
            graduated portions throughout today and then observe for 3 days.
          </p>
          <button
            onClick={handleStartTest}
            disabled={updateTest.isPending}
            className="w-full py-3 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600"
          >
            Start Test Now
          </button>
        </div>
      )}

      {/* TESTING_DAY0: Portion Tracker */}
      {test.status === 'TESTING_DAY0' && (
        <div
          className={cn(
            'p-4 rounded-xl mb-4',
            darkMode ? 'bg-slate-900' : 'bg-white border border-slate-200'
          )}
        >
          <PortionTracker
            testId={testId}
            completedPortions={effectivePortions}
            onPortionComplete={handlePortionComplete}
            darkMode={darkMode}
          />
          {effectivePortions >= PORTION_SCHEDULE.length && (
            <button
              onClick={() => updateTest.mutate({ status: 'OBSERVING' })}
              disabled={updateTest.isPending}
              className="w-full mt-4 py-3 rounded-xl bg-yellow-500 text-white font-medium hover:bg-yellow-600"
            >
              Begin 3-Day Observation
            </button>
          )}
        </div>
      )}

      {/* OBSERVING: Info + Advance */}
      {test.status === 'OBSERVING' && (
        <div
          className={cn(
            'p-4 rounded-xl mb-4',
            darkMode ? 'bg-slate-900' : 'bg-white border border-slate-200'
          )}
        >
          <div className="flex items-start gap-3 mb-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium">Observation Period (Days 1-3)</h3>
              <p
                className={cn(
                  'text-sm mt-1',
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                )}
              >
                Do <strong>NOT</strong> eat {test.foodName.toLowerCase()} during this
                period. Watch for delayed reactions and log any symptoms below.
              </p>
            </div>
          </div>
          {currentDay >= 4 && (
            <button
              onClick={() => updateTest.mutate({ status: 'CONFIRMING' })}
              disabled={updateTest.isPending}
              className="w-full py-3 rounded-xl bg-purple-500 text-white font-medium hover:bg-purple-600"
            >
              Begin Confirmation Phase
            </button>
          )}
        </div>
      )}

      {/* CONFIRMING: Info + Complete */}
      {test.status === 'CONFIRMING' && (
        <div
          className={cn(
            'p-4 rounded-xl mb-4',
            darkMode ? 'bg-slate-900' : 'bg-white border border-slate-200'
          )}
        >
          <div className="flex items-start gap-3 mb-3">
            <AlertCircle className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium">Confirmation Period (Days 4-7)</h3>
              <p
                className={cn(
                  'text-sm mt-1',
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                )}
              >
                Eat {test.foodName.toLowerCase()} in normal portions each day. Continue
                tracking any symptoms.
              </p>
            </div>
          </div>
          {currentDay >= 7 && (
            <button
              onClick={() => setShowResultForm(true)}
              className="w-full py-3 rounded-xl bg-green-500 text-white font-medium hover:bg-green-600"
            >
              Record Result
            </button>
          )}
        </div>
      )}

      {/* COMPLETE: Result summary */}
      {test.status === 'COMPLETE' && test.result && (
        <div
          className={cn(
            'p-4 rounded-xl mb-4',
            darkMode ? 'bg-slate-900' : 'bg-white border border-slate-200'
          )}
        >
          <h3 className="font-medium mb-2">Result</h3>
          <div className="flex items-center gap-2 mb-2">
            <span
              className={cn(
                'text-sm px-3 py-1 rounded-full font-medium',
                test.result === 'PASS'
                  ? 'text-green-500 bg-green-500/20'
                  : test.result === 'FAIL'
                  ? 'text-orange-500 bg-orange-500/20'
                  : 'text-yellow-500 bg-yellow-500/20'
              )}
            >
              {test.result === 'PASS'
                ? 'Safe for You'
                : test.result === 'FAIL'
                ? 'Reaction Detected'
                : 'Inconclusive'}
            </span>
          </div>
          {test.resultNotes && (
            <p
              className={cn(
                'text-sm',
                darkMode ? 'text-slate-400' : 'text-slate-600'
              )}
            >
              {test.resultNotes}
            </p>
          )}
          <Link
            href={`/reintro/${testId}/results`}
            className="block mt-3 text-sm text-blue-400 hover:text-blue-300"
          >
            View detailed results
          </Link>
        </div>
      )}

      {/* Reaction Logger */}
      {isActive && (
        <div
          className={cn(
            'p-4 rounded-xl mb-4',
            darkMode ? 'bg-slate-900' : 'bg-white border border-slate-200'
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Reactions</h3>
            <button
              onClick={() => setShowReactionForm(!showReactionForm)}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              {showReactionForm ? 'Cancel' : '+ Log Reaction'}
            </button>
          </div>

          {showReactionForm && (
            <div className="space-y-3 mb-4">
              <div>
                <label
                  className={cn(
                    'text-xs font-medium block mb-1',
                    darkMode ? 'text-slate-400' : 'text-slate-600'
                  )}
                >
                  Type
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SYMPTOM_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setReactionType(type)}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs',
                        reactionType === type
                          ? 'bg-blue-500 text-white'
                          : darkMode
                          ? 'bg-slate-800 text-slate-300'
                          : 'bg-slate-100 text-slate-700'
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  className={cn(
                    'text-xs font-medium block mb-1',
                    darkMode ? 'text-slate-400' : 'text-slate-600'
                  )}
                >
                  Severity ({reactionSeverity}/10)
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={reactionSeverity}
                  onChange={(e) => setReactionSeverity(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <input
                type="text"
                placeholder="Notes (optional)"
                value={reactionNotes}
                onChange={(e) => setReactionNotes(e.target.value)}
                className={cn(
                  'w-full px-3 py-2 rounded-lg text-sm',
                  darkMode
                    ? 'bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500'
                    : 'bg-slate-50 border border-slate-300 placeholder:text-slate-400'
                )}
              />

              <button
                onClick={() => addReaction.mutate()}
                disabled={addReaction.isPending}
                className="w-full py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600"
              >
                {addReaction.isPending ? 'Saving...' : 'Log Reaction'}
              </button>
            </div>
          )}

          {/* Reactions list */}
          {test.reactions.length > 0 ? (
            <div className="space-y-2">
              {test.reactions.map((r) => (
                <div
                  key={r.id}
                  className={cn(
                    'p-2 rounded-lg flex items-center justify-between',
                    darkMode ? 'bg-slate-800' : 'bg-slate-50'
                  )}
                >
                  <div>
                    <span className="text-sm font-medium">{r.symptomType}</span>
                    {r.notes && (
                      <p
                        className={cn(
                          'text-xs',
                          darkMode ? 'text-slate-500' : 'text-slate-500'
                        )}
                      >
                        {r.notes}
                      </p>
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      r.severity >= 7
                        ? 'text-red-500 bg-red-500/20'
                        : r.severity >= 4
                        ? 'text-orange-500 bg-orange-500/20'
                        : 'text-yellow-500 bg-yellow-500/20'
                    )}
                  >
                    {r.severity}/10
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p
              className={cn(
                'text-sm text-center py-2',
                darkMode ? 'text-slate-600' : 'text-slate-400'
              )}
            >
              No reactions logged yet
            </p>
          )}
        </div>
      )}

      {/* Result Form Modal */}
      {showResultForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div
            className={cn(
              'w-full p-6 rounded-t-2xl',
              darkMode ? 'bg-slate-900' : 'bg-white'
            )}
          >
            <h3 className="font-semibold text-lg mb-4">Record Your Result</h3>

            <div className="space-y-2 mb-4">
              {(
                [
                  { value: 'PASS', label: 'Safe for You', desc: 'No significant reactions during the test' },
                  { value: 'FAIL', label: 'Reaction Detected', desc: 'Symptoms appeared during or after testing' },
                  { value: 'INCONCLUSIVE', label: 'Inconclusive', desc: 'Not sure — may need to retest later' },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  onClick={() => setResultChoice(option.value)}
                  className={cn(
                    'w-full p-3 rounded-lg text-left border',
                    resultChoice === option.value
                      ? 'border-blue-500 bg-blue-500/10'
                      : darkMode
                      ? 'border-slate-700 bg-slate-800'
                      : 'border-slate-200 bg-slate-50'
                  )}
                >
                  <span className="font-medium text-sm">{option.label}</span>
                  <p
                    className={cn(
                      'text-xs mt-0.5',
                      darkMode ? 'text-slate-500' : 'text-slate-500'
                    )}
                  >
                    {option.desc}
                  </p>
                </button>
              ))}
            </div>

            <textarea
              placeholder="Notes (optional)"
              value={resultNotes}
              onChange={(e) => setResultNotes(e.target.value)}
              rows={2}
              className={cn(
                'w-full px-3 py-2 rounded-lg text-sm mb-4',
                darkMode
                  ? 'bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500'
                  : 'bg-slate-50 border border-slate-300 placeholder:text-slate-400'
              )}
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShowResultForm(false)}
                className={cn(
                  'flex-1 py-3 rounded-xl font-medium',
                  darkMode ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-900'
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitResult}
                disabled={updateTest.isPending}
                className="flex-1 py-3 rounded-xl bg-green-500 text-white font-medium hover:bg-green-600"
              >
                Save Result
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Actions: Abandon / Delete */}
      {isActive && (
        <div className="mt-4">
          {!showAbandonConfirm ? (
            <button
              onClick={() => setShowAbandonConfirm(true)}
              className={cn(
                'text-sm',
                darkMode ? 'text-slate-600 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600'
              )}
            >
              Pause this test
            </button>
          ) : (
            <div
              className={cn(
                'p-4 rounded-xl',
                darkMode ? 'bg-slate-900' : 'bg-white border border-slate-200'
              )}
            >
              <p className="text-sm mb-3">
                Are you sure? You can start a new test for this food later.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAbandonConfirm(false)}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm',
                    darkMode ? 'bg-slate-800' : 'bg-slate-200'
                  )}
                >
                  Keep Going
                </button>
                <button
                  onClick={handleAbandon}
                  className="flex-1 py-2 rounded-lg text-sm bg-orange-500 text-white"
                >
                  Pause Test
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {(test.status === 'ABANDONED' || test.status === 'NOT_STARTED') && (
        <button
          onClick={() => deleteTest.mutate()}
          className={cn(
            'flex items-center gap-1 mt-4 text-sm',
            darkMode ? 'text-red-500 hover:text-red-400' : 'text-red-600 hover:text-red-500'
          )}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete this test
        </button>
      )}
    </div>
  )
}

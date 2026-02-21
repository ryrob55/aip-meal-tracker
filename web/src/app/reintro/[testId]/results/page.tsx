'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import { ReintroTimeline } from '@/components/reintro'
import {
  getResultLabel,
  getResultColor,
  type ReintroStatusType,
  type ReintroResultType,
} from '@/lib/reintro-protocol'
import { CORE_SYMPTOMS } from '@/lib/symptom-utils'

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
  result: ReintroResultType | null
  resultNotes: string | null
  reactions: Reaction[]
  symptomsBefore: Record<string, number> | null
  symptomsDuring: Record<string, number> | null
  symptomsAfter: Record<string, number> | null
}

function SymptomComparisonBar({
  label,
  before,
  during,
  after,
  darkMode,
}: {
  label: string
  before: number | null
  during: number | null
  after: number | null
  darkMode: boolean
}) {
  const max = 10

  return (
    <div className="mb-3">
      <span
        className={cn(
          'text-xs font-medium block mb-1',
          darkMode ? 'text-slate-400' : 'text-slate-600'
        )}
      >
        {label}
      </span>
      <div className="space-y-1">
        {[
          { value: before, label: 'Before', color: 'bg-slate-500' },
          { value: during, label: 'During', color: 'bg-blue-500' },
          { value: after, label: 'After', color: 'bg-green-500' },
        ].map(
          (row) =>
            row.value != null && (
              <div key={row.label} className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-[10px] w-12 text-right flex-shrink-0',
                    darkMode ? 'text-slate-500' : 'text-slate-400'
                  )}
                >
                  {row.label}
                </span>
                <div
                  className={cn(
                    'flex-1 h-2 rounded-full overflow-hidden',
                    darkMode ? 'bg-slate-800' : 'bg-slate-100'
                  )}
                >
                  <div
                    className={cn('h-full rounded-full', row.color)}
                    style={{ width: `${(row.value / max) * 100}%` }}
                  />
                </div>
                <span
                  className={cn(
                    'text-[10px] w-4 flex-shrink-0',
                    darkMode ? 'text-slate-500' : 'text-slate-400'
                  )}
                >
                  {row.value}
                </span>
              </div>
            )
        )}
      </div>
    </div>
  )
}

export default function ResultsPage() {
  const { darkMode } = useTheme()
  const params = useParams()
  const testId = params.testId as string

  const { data: test, isLoading } = useQuery<ReintroTest>({
    queryKey: ['reintro-test', testId],
    queryFn: async () => {
      const res = await fetch(`/api/reintro/${testId}`)
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
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

  const hasSymptomData =
    test.symptomsBefore || test.symptomsDuring || test.symptomsAfter
  const reactionsByType = test.reactions.reduce(
    (acc, r) => {
      acc[r.symptomType] = (acc[r.symptomType] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )
  const maxReactionSeverity = test.reactions.length
    ? Math.max(...test.reactions.map((r) => r.severity))
    : 0

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
          href={`/reintro/${testId}`}
          className={cn(
            'p-2 rounded-lg',
            darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-200'
          )}
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">{test.foodName} — Results</h1>
          <span
            className={cn(
              'text-xs',
              darkMode ? 'text-slate-500' : 'text-slate-500'
            )}
          >
            Stage {test.reintroStage} ·{' '}
            {new Date(test.testDate).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Result Badge */}
      <div
        className={cn(
          'p-6 rounded-xl mb-4 text-center',
          darkMode ? 'bg-slate-900' : 'bg-white border border-slate-200'
        )}
      >
        {test.result ? (
          <>
            <span
              className={cn(
                'text-lg font-semibold px-4 py-1.5 rounded-full inline-block',
                getResultColor(test.result)
              )}
            >
              {getResultLabel(test.result)}
            </span>
            {test.resultNotes && (
              <p
                className={cn(
                  'text-sm mt-3',
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                )}
              >
                {test.resultNotes}
              </p>
            )}
          </>
        ) : (
          <span
            className={cn(
              'text-sm',
              darkMode ? 'text-slate-500' : 'text-slate-500'
            )}
          >
            Test not yet completed
          </span>
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

      {/* Reactions Summary */}
      <div
        className={cn(
          'p-4 rounded-xl mb-4',
          darkMode ? 'bg-slate-900' : 'bg-white border border-slate-200'
        )}
      >
        <h3 className="font-medium mb-3">
          Reactions ({test.reactions.length})
        </h3>

        {test.reactions.length > 0 ? (
          <>
            {/* Reaction type breakdown */}
            <div className="flex flex-wrap gap-2 mb-3">
              {Object.entries(reactionsByType).map(([type, count]) => (
                <span
                  key={type}
                  className={cn(
                    'text-xs px-2 py-1 rounded-full',
                    darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                  )}
                >
                  {type}: {count}
                </span>
              ))}
            </div>

            {/* Max severity */}
            <p
              className={cn(
                'text-xs mb-3',
                maxReactionSeverity >= 7
                  ? 'text-red-400'
                  : maxReactionSeverity >= 4
                  ? 'text-orange-400'
                  : 'text-yellow-400'
              )}
            >
              Peak severity: {maxReactionSeverity}/10
            </p>

            {/* Full reaction log */}
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
                    <span className="text-sm">{r.symptomType}</span>
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
                  <div className="text-right">
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
                    <p
                      className={cn(
                        'text-[10px] mt-0.5',
                        darkMode ? 'text-slate-600' : 'text-slate-400'
                      )}
                    >
                      {new Date(r.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p
            className={cn(
              'text-sm text-center py-4',
              darkMode ? 'text-slate-600' : 'text-slate-400'
            )}
          >
            No reactions were logged during this test
          </p>
        )}
      </div>

      {/* Symptom Comparison */}
      {hasSymptomData && (
        <div
          className={cn(
            'p-4 rounded-xl mb-4',
            darkMode ? 'bg-slate-900' : 'bg-white border border-slate-200'
          )}
        >
          <h3 className="font-medium mb-1">Symptom Comparison</h3>
          <p
            className={cn(
              'text-xs mb-4',
              darkMode ? 'text-slate-500' : 'text-slate-500'
            )}
          >
            Higher scores = feeling better (1-10 scale)
          </p>

          {/* Legend */}
          <div className="flex gap-4 mb-4">
            {[
              { label: 'Before', color: 'bg-slate-500' },
              { label: 'During', color: 'bg-blue-500' },
              { label: 'After', color: 'bg-green-500' },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1">
                <div className={cn('w-2 h-2 rounded-full', l.color)} />
                <span
                  className={cn(
                    'text-[10px]',
                    darkMode ? 'text-slate-500' : 'text-slate-500'
                  )}
                >
                  {l.label}
                </span>
              </div>
            ))}
          </div>

          {CORE_SYMPTOMS.map((symptom) => {
            const before =
              test.symptomsBefore?.[symptom.id] ?? null
            const during =
              test.symptomsDuring?.[symptom.id] ?? null
            const after =
              test.symptomsAfter?.[symptom.id] ?? null

            if (before == null && during == null && after == null) return null

            return (
              <SymptomComparisonBar
                key={symptom.id}
                label={symptom.label}
                before={before}
                during={during}
                after={after}
                darkMode={darkMode}
              />
            )
          })}
        </div>
      )}

      {/* Next Steps */}
      {test.result && (
        <div
          className={cn(
            'p-4 rounded-xl',
            darkMode ? 'bg-slate-900' : 'bg-white border border-slate-200'
          )}
        >
          <h3 className="font-medium mb-2">Next Steps</h3>
          {test.result === 'PASS' && (
            <p
              className={cn(
                'text-sm',
                darkMode ? 'text-slate-400' : 'text-slate-600'
              )}
            >
              Great news! {test.foodName} appears to be safe for you. You can
              add it to your regular diet. Consider testing the next food on your
              reintroduction list.
            </p>
          )}
          {test.result === 'FAIL' && (
            <p
              className={cn(
                'text-sm',
                darkMode ? 'text-slate-400' : 'text-slate-600'
              )}
            >
              It&apos;s okay — this is valuable information. Avoid{' '}
              {test.foodName.toLowerCase()} for now and move on to the next food
              on your list. You can retest in 3-6 months as your gut heals.
            </p>
          )}
          {test.result === 'INCONCLUSIVE' && (
            <p
              className={cn(
                'text-sm',
                darkMode ? 'text-slate-400' : 'text-slate-600'
              )}
            >
              Sometimes results are unclear. Wait at least 2 weeks, then try
              testing {test.foodName.toLowerCase()} again. Make sure you&apos;re
              feeling well before retesting.
            </p>
          )}
          <Link
            href="/reintro/new"
            className="inline-block mt-3 text-sm text-blue-400 hover:text-blue-300"
          >
            Start next test
          </Link>
        </div>
      )}
    </div>
  )
}

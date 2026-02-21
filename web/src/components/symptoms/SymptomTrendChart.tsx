'use client'

import { cn } from '@/lib/utils'
import {
  CORE_SYMPTOMS,
  getScoreColor,
  formatDateShort,
  type SymptomLogData,
  type SymptomId,
} from '@/lib/symptom-utils'

interface Props {
  logs: SymptomLogData[]
  symptomId?: SymptomId
  days?: number
  darkMode?: boolean
}

export function SymptomTrendChart({
  logs,
  symptomId,
  days = 14,
  darkMode = true,
}: Props) {
  const selectedSymptoms = symptomId
    ? CORE_SYMPTOMS.filter((s) => s.id === symptomId)
    : CORE_SYMPTOMS

  // Build date range
  const today = new Date()
  const dates: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().split('T')[0])
  }

  // Aggregate data per date per symptom
  const chartData = dates.map((dateStr) => {
    const dayLogs = logs.filter((l) => l.date === dateStr)
    const scores: Record<string, number | null> = {}

    for (const symptom of selectedSymptoms) {
      const values = dayLogs
        .map((l) => l[symptom.id])
        .filter((v): v is number => v != null)
      scores[symptom.id] = values.length > 0
        ? Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10
        : null
    }

    return { date: dateStr, scores }
  })

  const chartWidth = 600
  const chartHeight = 200
  const paddingLeft = 30
  const paddingRight = 10
  const paddingTop = 10
  const paddingBottom = 30

  const plotWidth = chartWidth - paddingLeft - paddingRight
  const plotHeight = chartHeight - paddingTop - paddingBottom

  const colors = [
    '#22c55e', '#3b82f6', '#f59e0b', '#ef4444',
    '#a855f7', '#ec4899', '#06b6d4', '#84cc16',
  ]

  return (
    <div>
      {/* Legend */}
      {selectedSymptoms.length > 1 && (
        <div className="flex flex-wrap gap-3 mb-3">
          {selectedSymptoms.map((symptom, i) => (
            <div key={symptom.id} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: colors[i % colors.length] }}
              />
              <span
                className={cn(
                  'text-xs',
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                )}
              >
                {symptom.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full" style={{ minWidth: 300 }}>
          {/* Grid lines */}
          {[2, 4, 6, 8, 10].map((tick) => {
            const y = paddingTop + plotHeight - ((tick - 1) / 9) * plotHeight
            return (
              <g key={tick}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke={darkMode ? '#334155' : '#e2e8f0'}
                  strokeWidth={0.5}
                />
                <text
                  x={paddingLeft - 5}
                  y={y + 3}
                  textAnchor="end"
                  fontSize={9}
                  fill={darkMode ? '#64748b' : '#94a3b8'}
                >
                  {tick}
                </text>
              </g>
            )
          })}

          {/* Date labels */}
          {chartData
            .filter((_, i) => i % Math.ceil(days / 7) === 0 || i === chartData.length - 1)
            .map((d, i) => {
              const idx = chartData.indexOf(d)
              const x = paddingLeft + (idx / (chartData.length - 1)) * plotWidth
              return (
                <text
                  key={d.date}
                  x={x}
                  y={chartHeight - 5}
                  textAnchor="middle"
                  fontSize={8}
                  fill={darkMode ? '#64748b' : '#94a3b8'}
                >
                  {new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </text>
              )
            })}

          {/* Data lines */}
          {selectedSymptoms.map((symptom, si) => {
            const points = chartData
              .map((d, i) => {
                const val = d.scores[symptom.id]
                if (val == null) return null
                return {
                  x: paddingLeft + (i / (chartData.length - 1)) * plotWidth,
                  y: paddingTop + plotHeight - ((val - 1) / 9) * plotHeight,
                }
              })
              .filter((p): p is { x: number; y: number } => p != null)

            if (points.length < 2) return null

            const pathD = points
              .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
              .join(' ')

            const color = colors[si % colors.length]

            return (
              <g key={symptom.id}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.8}
                />
                {points.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={color} />
                ))}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

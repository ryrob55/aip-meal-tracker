'use client'

import { cn } from '@/lib/utils'

interface Props {
  data: (number | null)[]
  width?: number
  height?: number
  className?: string
}

export function SymptomSparkline({ data, width = 80, height = 24, className }: Props) {
  const validPoints = data.filter((v): v is number => v != null)
  if (validPoints.length === 0) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ width, height }}>
        <span className="text-xs text-slate-500">—</span>
      </div>
    )
  }

  const min = 1
  const max = 10
  const padding = 2

  const points = data
    .map((v, i) => {
      if (v == null) return null
      const x = padding + (i / (data.length - 1)) * (width - padding * 2)
      const y = height - padding - ((v - min) / (max - min)) * (height - padding * 2)
      return { x, y }
    })
    .filter((p): p is { x: number; y: number } => p != null)

  if (points.length < 2) {
    // Single point - just show a dot
    return (
      <svg width={width} height={height} className={className}>
        <circle cx={points[0].x} cy={points[0].y} r={2} fill="currentColor" className="text-green-500" />
      </svg>
    )
  }

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  // Color based on latest value
  const latest = validPoints[validPoints.length - 1]
  const color = latest >= 7 ? 'text-green-500' : latest >= 4 ? 'text-yellow-500' : 'text-red-500'

  return (
    <svg width={width} height={height} className={cn(color, className)}>
      <path d={pathD} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* Latest point dot */}
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={2} fill="currentColor" />
    </svg>
  )
}

'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Nudge } from '@/lib/nudge-engine'

interface Props {
  nudge: Nudge
  darkMode?: boolean
}

export function NudgeCard({ nudge, darkMode = true }: Props) {
  const typeStyles = {
    info: darkMode ? 'ring-blue-500/20 bg-blue-500/10' : 'ring-blue-200 bg-blue-50',
    warning: darkMode ? 'ring-orange-500/20 bg-orange-500/10' : 'ring-orange-200 bg-orange-50',
    success: darkMode ? 'ring-green-500/20 bg-green-500/10' : 'ring-green-200 bg-green-50',
    tip: darkMode ? 'ring-purple-500/20 bg-purple-500/10' : 'ring-purple-200 bg-purple-50',
  }

  const content = (
    <div className={cn('p-3.5 rounded-xl ring-1', typeStyles[nudge.type])}>
      <h4
        className={cn(
          'text-sm font-medium mb-0.5',
          darkMode ? 'text-zinc-50' : 'text-zinc-900'
        )}
      >
        {nudge.title}
      </h4>
      <p
        className={cn(
          'text-xs',
          darkMode ? 'text-zinc-400' : 'text-zinc-600'
        )}
      >
        {nudge.message}
      </p>
      {nudge.actionLabel && (
        <span
          className={cn(
            'inline-block mt-1 text-xs font-medium',
            nudge.type === 'warning'
              ? 'text-orange-400'
              : nudge.type === 'success'
              ? 'text-green-400'
              : nudge.type === 'tip'
              ? 'text-purple-400'
              : 'text-blue-400'
          )}
        >
          {nudge.actionLabel} &rarr;
        </span>
      )}
    </div>
  )

  if (nudge.actionHref) {
    return (
      <Link href={nudge.actionHref} className="transition-all active:scale-[0.99]">
        {content}
      </Link>
    )
  }

  return content
}

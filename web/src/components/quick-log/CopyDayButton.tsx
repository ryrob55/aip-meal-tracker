'use client'

import { useState } from 'react'
import { Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  targetDate: string
  onCopied: () => void
  darkMode?: boolean
}

export function CopyDayButton({ targetDate, onCopied, darkMode = true }: Props) {
  const [isCopying, setIsCopying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCopyYesterday = async () => {
    setIsCopying(true)
    setError(null)

    const yesterday = new Date(targetDate)
    yesterday.setDate(yesterday.getDate() - 1)

    try {
      const res = await fetch('/api/meals/copy-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromDate: yesterday.toISOString().split('T')[0],
          toDate: targetDate,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to copy')
        return
      }

      onCopied()
    } catch {
      setError('Failed to copy meals')
    } finally {
      setIsCopying(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleCopyYesterday}
        disabled={isCopying}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs',
          darkMode
            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        )}
      >
        <Copy className="w-3 h-3" />
        {isCopying ? 'Copying...' : 'Same as yesterday'}
      </button>
      {error && (
        <p className="text-[10px] text-red-400 mt-1">{error}</p>
      )}
    </div>
  )
}

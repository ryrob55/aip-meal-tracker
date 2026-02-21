'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  onParse: (text: string) => void
  isParsing: boolean
  darkMode?: boolean
}

export function NaturalLanguageInput({ onParse, isParsing, darkMode = true }: Props) {
  const [text, setText] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim() && !isParsing) {
      onParse(text.trim())
    }
  }

  const examples = [
    'Grilled salmon with sweet potato and steamed broccoli',
    'Bone broth with a side of roasted cauliflower',
    'Smoothie with banana, coconut milk, and collagen',
  ]

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Describe what you ate..."
            rows={2}
            className={cn(
              'w-full px-4 py-3 pr-12 rounded-xl text-sm resize-none',
              darkMode
                ? 'bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500'
                : 'bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400'
            )}
          />
          <button
            type="submit"
            disabled={!text.trim() || isParsing}
            className={cn(
              'absolute right-2 bottom-2 p-2 rounded-lg',
              text.trim() && !isParsing
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : darkMode
                ? 'bg-slate-800 text-slate-600'
                : 'bg-slate-100 text-slate-400'
            )}
          >
            <Sparkles className={cn('w-4 h-4', isParsing && 'animate-spin')} />
          </button>
        </div>
      </form>

      {!text && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {examples.map((ex) => (
            <button
              key={ex}
              onClick={() => setText(ex)}
              className={cn(
                'text-[10px] px-2 py-1 rounded-full',
                darkMode
                  ? 'bg-slate-800 text-slate-400 hover:text-slate-300'
                  : 'bg-slate-100 text-slate-500 hover:text-slate-700'
              )}
            >
              {ex.length > 40 ? ex.slice(0, 40) + '...' : ex}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  darkMode?: boolean
}

export function WelcomeStep({ darkMode = true }: Props) {
  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
        <Heart className="w-10 h-10 text-green-500" />
      </div>
      <h1
        className={cn(
          'text-2xl font-bold mb-3',
          darkMode ? 'text-white' : 'text-slate-900'
        )}
      >
        Welcome to Your AIP Journey
      </h1>
      <p
        className={cn(
          'text-base mb-2',
          darkMode ? 'text-slate-300' : 'text-slate-700'
        )}
      >
        Your doctor recommended AIP &mdash; you&apos;re in the right place.
      </p>
      <p
        className={cn(
          'text-sm mb-8',
          darkMode ? 'text-slate-400' : 'text-slate-600'
        )}
      >
        We&apos;ll guide you through setting up a personalized plan that fits your life.
        This takes about 5 minutes.
      </p>

      <div
        className={cn(
          'p-5 rounded-lg text-left space-y-3',
          darkMode ? 'bg-slate-800' : 'bg-slate-100'
        )}
      >
        <p
          className={cn(
            'text-sm font-medium',
            darkMode ? 'text-slate-300' : 'text-slate-700'
          )}
        >
          Here&apos;s what we&apos;ll set up together:
        </p>
        <ul className="space-y-2.5 text-sm">
          {[
            { text: 'Learn what AIP is and how it works', icon: '📖' },
            { text: 'Choose your protocol version', icon: '🎯' },
            { text: 'Set your food restrictions', icon: '🚫' },
            { text: 'Configure daily nutrition targets', icon: '📊' },
            { text: 'Set up optional AI assistance', icon: '✨' },
          ].map((item) => (
            <li
              key={item.text}
              className={cn(
                'flex items-center gap-3',
                darkMode ? 'text-slate-400' : 'text-slate-600'
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.text}
            </li>
          ))}
        </ul>
      </div>

      <p
        className={cn(
          'text-xs mt-6',
          darkMode ? 'text-slate-500' : 'text-slate-500'
        )}
      >
        You can always change these settings later.
      </p>
    </div>
  )
}

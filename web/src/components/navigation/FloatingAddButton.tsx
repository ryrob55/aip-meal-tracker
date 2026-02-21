'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus, X, Utensils, Activity, FlaskConical } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

const ACTIONS = [
  { href: '/quick-log', label: 'Log Meal', icon: Utensils },
  { href: '/symptoms', label: 'Check In', icon: Activity },
  { href: '/reintro/new', label: 'New Test', icon: FlaskConical },
]

export function FloatingAddButton() {
  const { darkMode } = useTheme()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  // Don't show on auth pages or pages that have their own add functionality
  if (
    pathname === '/login' ||
    pathname === '/onboarding' ||
    pathname === '/quick-log' ||
    pathname === '/reintro/new'
  ) {
    return null
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Action menu */}
      {isOpen && (
        <div className="fixed right-4 z-50 flex flex-col gap-2 items-end" style={{ bottom: '8rem' }}>
          {ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg',
                darkMode
                  ? 'bg-zinc-900 ring-1 ring-zinc-800 text-white'
                  : 'bg-white text-zinc-900 border border-zinc-200'
              )}
            >
              <action.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{action.label}</span>
            </Link>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-18 right-4 z-50 w-12 h-12 rounded-full flex items-center justify-center transition-transform',
          isOpen
            ? 'bg-zinc-700 text-white shadow-lg'
            : 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-500/25'
        )}
        style={{ bottom: '4.5rem' }}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
      </button>
    </>
  )
}

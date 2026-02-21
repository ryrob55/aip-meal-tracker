'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

const TOPICS = [
  {
    slug: 'elimination',
    title: 'The Elimination Phase',
    description: 'What to eat, what to avoid, and how long it lasts',
    icon: '🥬',
    color: 'bg-green-500/20 border-green-500/30',
  },
  {
    slug: 'reintroduction',
    title: 'Reintroduction Guide',
    description: 'How to safely test foods and track reactions',
    icon: '🔄',
    color: 'bg-blue-500/20 border-blue-500/30',
  },
  {
    slug: 'nutrients',
    title: 'Preventing Nutrient Gaps',
    description: 'Key nutrients to watch and foods that provide them',
    icon: '💊',
    color: 'bg-purple-500/20 border-purple-500/30',
  },
  {
    slug: 'histamine',
    title: 'Histamine & Tyramine',
    description: 'Understanding food sensitivities beyond AIP',
    icon: '⚠️',
    color: 'bg-orange-500/20 border-orange-500/30',
  },
  {
    slug: 'meal-prep',
    title: 'Meal Prep Tips',
    description: 'Batch cooking, leftovers, and making AIP sustainable',
    icon: '🍳',
    color: 'bg-amber-500/20 border-amber-500/30',
  },
  {
    slug: 'modified-aip',
    title: 'Modified AIP (2024)',
    description: 'The updated protocol and what it allows',
    icon: '📋',
    color: 'bg-teal-500/20 border-teal-500/30',
  },
]

export default function LearnPage() {
  const { darkMode } = useTheme()

  return (
    <div className={cn('min-h-screen', darkMode ? 'bg-slate-900' : 'bg-slate-50')}>
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/aip-diet"
            className={cn(
              'p-2 rounded-lg',
              darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-200'
            )}
          >
            <ArrowLeft className={cn('w-5 h-5', darkMode ? 'text-slate-400' : 'text-slate-600')} />
          </Link>
          <div>
            <h1 className={cn('text-xl font-bold', darkMode ? 'text-white' : 'text-slate-900')}>
              Learn About AIP
            </h1>
            <p className={cn('text-sm', darkMode ? 'text-slate-400' : 'text-slate-600')}>
              Education and guides to support your journey
            </p>
          </div>
        </div>

        {/* Topic cards */}
        <div className="space-y-3">
          {TOPICS.map((topic) => (
            <Link
              key={topic.slug}
              href={`/learn/${topic.slug}`}
              className={cn(
                'block p-4 rounded-lg border transition-all',
                topic.color,
                darkMode ? 'hover:border-slate-500' : 'hover:border-slate-400'
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{topic.icon}</span>
                <div>
                  <h2
                    className={cn(
                      'font-semibold text-sm',
                      darkMode ? 'text-white' : 'text-slate-900'
                    )}
                  >
                    {topic.title}
                  </h2>
                  <p
                    className={cn(
                      'text-xs mt-0.5',
                      darkMode ? 'text-slate-400' : 'text-slate-600'
                    )}
                  >
                    {topic.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import {
  ChefHat,
  UtensilsCrossed,
  CalendarDays,
  BarChart3,
  Settings,
  BookOpen,
  FlaskConical,
  Activity,
  Download,
  Shield,
  Sparkles,
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

const SECTIONS = [
  {
    title: 'Track',
    items: [
      { href: '/aip-diet', label: 'Daily Meal Tracker', icon: CalendarDays, desc: 'Week/day views' },
      { href: '/quick-log', label: 'Quick Log', icon: UtensilsCrossed, desc: 'AI-powered entry' },
      { href: '/symptoms', label: 'Symptom Check-In', icon: Activity, desc: 'Track how you feel' },
      { href: '/symptoms/history', label: 'Symptom History', icon: BarChart3, desc: 'Trends over time' },
    ],
  },
  {
    title: 'Reintroduction',
    items: [
      { href: '/reintro', label: 'Reintro Dashboard', icon: FlaskConical, desc: 'Active & completed tests' },
      { href: '/reintro/new', label: 'Start New Test', icon: FlaskConical, desc: '7-day protocol' },
      { href: '/reintro/history', label: 'Test History', icon: BarChart3, desc: 'All past results' },
    ],
  },
  {
    title: 'Food & Recipes',
    items: [
      { href: '/foods', label: 'Food Database', icon: Shield, desc: 'Browse all AIP foods' },
      { href: '/foods/whats-safe', label: 'What Can I Eat?', icon: Shield, desc: 'Phase-aware guide' },
      { href: '/recipes', label: 'Recipes', icon: ChefHat, desc: 'AIP-compliant recipes' },
      { href: '/meals', label: 'Weekly Meals', icon: UtensilsCrossed, desc: 'Meal plans & grocery' },
    ],
  },
  {
    title: 'Learn & Reports',
    items: [
      { href: '/learn', label: 'AIP Education', icon: BookOpen, desc: 'Learn about AIP' },
      { href: '/insights', label: 'Insights', icon: BarChart3, desc: 'Food-symptom correlations' },
      { href: '/aip-diet/report', label: 'Progress Report', icon: BarChart3, desc: 'Macro trends' },
    ],
  },
  {
    title: 'Settings',
    items: [
      { href: '/settings/ai', label: 'AI Assistant', icon: Sparkles, desc: 'Set up AI-powered features' },
      { href: '/onboarding', label: 'Setup & Preferences', icon: Settings, desc: 'Macros, AI, protocol' },
      { href: '/export', label: 'Export Data', icon: Download, desc: 'Download your data' },
    ],
  },
]

export default function MorePage() {
  const { darkMode } = useTheme()

  return (
    <div
      className={cn(
        'min-h-screen p-4 pb-24',
        darkMode ? 'bg-zinc-900 text-white' : 'bg-zinc-50 text-zinc-900'
      )}
    >
      <h1 className="text-xl font-bold mb-6 pt-2">More</h1>

      {SECTIONS.map((section) => (
        <div key={section.title} className="mb-6">
          <h2
            className={cn(
              'text-xs font-medium mb-2 uppercase tracking-wider',
              darkMode ? 'text-zinc-500' : 'text-zinc-500'
            )}
          >
            {section.title}
          </h2>
          <div
            className={cn(
              'rounded-xl overflow-hidden divide-y',
              darkMode
                ? 'bg-zinc-900 divide-zinc-800'
                : 'bg-white divide-zinc-100 border border-zinc-200'
            )}
          >
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 p-3',
                  darkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-50'
                )}
              >
                <item.icon
                  className={cn(
                    'w-5 h-5 shrink-0',
                    darkMode ? 'text-zinc-400' : 'text-zinc-500'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{item.label}</span>
                  <p
                    className={cn(
                      'text-[10px]',
                      darkMode ? 'text-zinc-500' : 'text-zinc-400'
                    )}
                  >
                    {item.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

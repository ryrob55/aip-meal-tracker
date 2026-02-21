'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, Filter, Shield } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

interface AIPFood {
  id: string
  name: string
  category: string
  aipPhase: string
  calories: number
  protein: number
  carbs: number
  fat: number
  histamineLevel: string
  tyramineLevel: string
  modifiedAIPAllowed: boolean
  whyRestricted: string | null
  reintroStage: number | null
}

const PHASE_LABELS: Record<string, { label: string; color: string }> = {
  ELIMINATION: { label: 'Elimination', color: 'text-green-500 bg-green-500/20' },
  REINTRO_1: { label: 'Reintro 1', color: 'text-blue-500 bg-blue-500/20' },
  REINTRO_2: { label: 'Reintro 2', color: 'text-purple-500 bg-purple-500/20' },
  REINTRO_3: { label: 'Reintro 3', color: 'text-yellow-500 bg-yellow-500/20' },
  REINTRO_4: { label: 'Reintro 4', color: 'text-orange-500 bg-orange-500/20' },
  AVOID: { label: 'Avoid', color: 'text-red-500 bg-red-500/20' },
  SAFE: { label: 'Safe', color: 'text-green-500 bg-green-500/20' },
}

const CATEGORIES = [
  'All',
  'MEAT_POULTRY',
  'MEAT_BEEF',
  'MEAT_PORK',
  'SEAFOOD',
  'VEGETABLE',
  'FRUIT',
  'FAT_OIL',
  'HERB_SPICE',
  'BROTH',
  'BEVERAGE',
]

function formatCategory(cat: string): string {
  return cat
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function FoodsPage() {
  const { darkMode } = useTheme()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [phaseFilter, setPhaseFilter] = useState('All')

  const { data: foods = [], isLoading } = useQuery<AIPFood[]>({
    queryKey: ['aip-foods'],
    queryFn: async () => {
      const res = await fetch('/api/aip-diet/foods')
      if (!res.ok) return []
      return res.json()
    },
  })

  const filtered = foods.filter((f) => {
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false
    if (category !== 'All' && f.category !== category) return false
    if (phaseFilter !== 'All' && f.aipPhase !== phaseFilter) return false
    return true
  })

  // Group by category
  const grouped = filtered.reduce(
    (acc, food) => {
      const cat = food.category
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(food)
      return acc
    },
    {} as Record<string, AIPFood[]>
  )

  return (
    <div
      className={cn(
        'min-h-screen p-4 pb-24',
        darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'
      )}
    >
      <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className={cn(
              'p-2 rounded-lg',
              darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-200'
            )}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">Food Database</h1>
        </div>
        <Link
          href="/foods/whats-safe"
          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600"
        >
          <Shield className="w-4 h-4" />
          Safe for Me
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search
          className={cn(
            'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
            darkMode ? 'text-slate-500' : 'text-slate-400'
          )}
        />
        <input
          type="text"
          placeholder="Search foods..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={cn(
            'w-full pl-10 pr-4 py-2.5 rounded-lg text-sm',
            darkMode
              ? 'bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500'
              : 'bg-white border border-slate-300 placeholder:text-slate-400'
          )}
        />
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 no-scrollbar">
        {['All', 'ELIMINATION', 'REINTRO_1', 'REINTRO_2', 'REINTRO_3', 'REINTRO_4', 'AVOID'].map(
          (phase) => (
            <button
              key={phase}
              onClick={() => setPhaseFilter(phase)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs whitespace-nowrap',
                phaseFilter === phase
                  ? 'bg-blue-500 text-white'
                  : darkMode
                  ? 'bg-slate-800 text-slate-300'
                  : 'bg-slate-100 text-slate-700'
              )}
            >
              {phase === 'All'
                ? `All (${foods.length})`
                : PHASE_LABELS[phase]?.label || phase}
            </button>
          )
        )}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              'px-2.5 py-1 rounded-full text-xs whitespace-nowrap',
              category === cat
                ? 'bg-blue-500 text-white'
                : darkMode
                ? 'bg-slate-800 text-slate-300'
                : 'bg-slate-100 text-slate-700'
            )}
          >
            {cat === 'All' ? 'All' : formatCategory(cat)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div
          className={cn(
            'p-8 rounded-xl text-center',
            darkMode ? 'bg-slate-900' : 'bg-white border border-slate-200'
          )}
        >
          <p className={cn('text-sm', darkMode ? 'text-slate-500' : 'text-slate-500')}>
            No foods match your search.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <h3
                className={cn(
                  'text-xs font-medium mb-2 uppercase tracking-wider',
                  darkMode ? 'text-slate-500' : 'text-slate-500'
                )}
              >
                {formatCategory(cat)} ({items.length})
              </h3>
              <div className="space-y-1">
                {items.map((food) => (
                  <Link key={food.id} href={`/foods/${food.id}`}>
                    <div
                      className={cn(
                        'p-3 rounded-lg flex items-center justify-between',
                        darkMode
                          ? 'bg-slate-900 hover:bg-slate-800'
                          : 'bg-white hover:bg-slate-50 border border-slate-200'
                      )}
                    >
                      <div>
                        <span className="text-sm font-medium">{food.name}</span>
                        <div
                          className={cn(
                            'flex gap-2 mt-0.5 text-xs',
                            darkMode ? 'text-slate-500' : 'text-slate-400'
                          )}
                        >
                          <span>{food.calories} cal</span>
                          <span>{food.protein}g P</span>
                          {food.histamineLevel !== 'LOW' && (
                            <span className="text-orange-400">
                              Histamine: {food.histamineLevel}
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full',
                          PHASE_LABELS[food.aipPhase]?.color || 'text-slate-500 bg-slate-500/20'
                        )}
                      >
                        {PHASE_LABELS[food.aipPhase]?.label || food.aipPhase}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}

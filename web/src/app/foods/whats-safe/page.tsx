'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

interface SafeFood {
  id: string
  name: string
  category: string
  aipPhase: string
  calories: number
  protein: number
  userStatus: string
  isModifiedAllowed: boolean
  richInCalcium: boolean
  richInB12: boolean
  richInIron: boolean
  richInZinc: boolean
  richInOmega3: boolean
}

interface SafeFoodsResponse {
  foods: SafeFood[]
  currentPhase: string
  aipVariant: string
  totalCount: number
}

const NUTRIENT_FILTERS = [
  { value: '', label: 'All' },
  { value: 'calcium', label: 'Calcium' },
  { value: 'b12', label: 'B12' },
  { value: 'iron', label: 'Iron' },
  { value: 'zinc', label: 'Zinc' },
  { value: 'omega3', label: 'Omega-3' },
  { value: 'vitaminD', label: 'Vit D' },
  { value: 'magnesium', label: 'Mg' },
]

function formatCategory(cat: string): string {
  return cat
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function WhatsSafePage() {
  const { darkMode } = useTheme()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [nutrient, setNutrient] = useState('')

  const { data, isLoading } = useQuery<SafeFoodsResponse>({
    queryKey: ['safe-foods', category, nutrient],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (category) params.set('category', category)
      if (nutrient) params.set('nutrient', nutrient)
      const res = await fetch(`/api/foods/whats-safe?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
  })

  const foods = data?.foods || []
  const filtered = search
    ? foods.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    : foods

  // Group by category
  const grouped = filtered.reduce(
    (acc, food) => {
      const cat = food.category
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(food)
      return acc
    },
    {} as Record<string, SafeFood[]>
  )

  const categories = [
    '',
    ...Array.from(new Set(foods.map((f) => f.category))).sort(),
  ]

  return (
    <div
      className={cn(
        'min-h-screen p-4 pb-24',
        darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          href="/foods"
          className={cn(
            'p-2 rounded-lg',
            darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-200'
          )}
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">What Can I Eat?</h1>
          {data && (
            <span
              className={cn(
                'text-xs',
                darkMode ? 'text-slate-500' : 'text-slate-500'
              )}
            >
              {data.currentPhase.replace(/_/g, ' ')} ·{' '}
              {data.aipVariant === 'MODIFIED_2024' ? 'Modified AIP' : 'Standard AIP'} ·{' '}
              {data.totalCount} foods
            </span>
          )}
        </div>
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
          placeholder="Search safe foods..."
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

      {/* Nutrient filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 no-scrollbar">
        {NUTRIENT_FILTERS.map((nf) => (
          <button
            key={nf.value}
            onClick={() => setNutrient(nf.value)}
            className={cn(
              'px-2.5 py-1 rounded-full text-xs whitespace-nowrap',
              nutrient === nf.value
                ? 'bg-green-500 text-white'
                : darkMode
                ? 'bg-slate-800 text-slate-300'
                : 'bg-slate-100 text-slate-700'
            )}
          >
            {nf.label}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat || 'all'}
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
            {cat ? formatCategory(cat) : 'All'}
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
            No foods match your filters.
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
              <div className="grid grid-cols-2 gap-2">
                {items.map((food) => (
                  <Link key={food.id} href={`/foods/${food.id}`}>
                    <div
                      className={cn(
                        'p-3 rounded-lg',
                        darkMode
                          ? 'bg-slate-900 hover:bg-slate-800'
                          : 'bg-white hover:bg-slate-50 border border-slate-200'
                      )}
                    >
                      <span className="text-sm font-medium block truncate">
                        {food.name}
                      </span>
                      <span
                        className={cn(
                          'text-[10px]',
                          darkMode ? 'text-slate-500' : 'text-slate-400'
                        )}
                      >
                        {food.calories} cal · {food.protein}g P
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
  )
}

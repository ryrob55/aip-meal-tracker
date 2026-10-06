'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import {
  CATEGORY_LABELS,
  PHASE_LABELS,
  PHASE_COLORS,
  LEVEL_LABELS,
  TYRAMINE_COLORS,
  groupFoodsByCategory,
  getQualityBadges,
  formatMacros,
} from '@/lib/aip-foods'
import type { AIPFood, AIPFoodCategory, AIPPhase, TyramineLevel } from '@prisma/client'

export default function FoodsPage() {
  const { darkMode } = useTheme()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<AIPFoodCategory | 'ALL'>('ALL')
  const [selectedPhase, setSelectedPhase] = useState<AIPPhase | 'ALL'>('ALL')
  const [showAvoid, setShowAvoid] = useState(false)

  // Fetch foods
  const { data: foods = [], isLoading } = useQuery<AIPFood[]>({
    queryKey: ['aipFoods', search, selectedCategory, selectedPhase, showAvoid],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (selectedCategory !== 'ALL') params.set('category', selectedCategory)
      if (selectedPhase !== 'ALL') params.set('phase', selectedPhase)
      if (!showAvoid) params.set('excludeAvoid', 'true')

      const res = await fetch(`/api/aip-diet/foods?${params}`)
      if (!res.ok) throw new Error('Failed to fetch foods')
      return res.json()
    },
  })

  const groupedFoods = groupFoodsByCategory(foods)

  const categories: (AIPFoodCategory | 'ALL')[] = [
    'ALL',
    'MEAT_POULTRY',
    'MEAT_BEEF',
    'MEAT_PORK',
    'SEAFOOD',
    'VEGETABLE',
    'FRUIT',
    'FAT_OIL',
    'BROTH',
    'SMOOTHIE_INGREDIENT',
    'BEVERAGE',
    'HERB_SPICE',
    'OTHER',
  ]

  return (
    <div
      className={cn(
        'min-h-screen',
        darkMode ? 'bg-slate-900' : 'bg-slate-50'
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'sticky top-0 z-10 px-4 py-3 border-b',
          darkMode
            ? 'bg-slate-900 border-slate-800'
            : 'bg-white border-slate-200'
        )}
      >
        <div className="flex items-center gap-3 mb-3">
          <Link
            href="/aip-diet"
            className={cn(
              'p-2 -ml-2 rounded-lg transition-colors',
              darkMode
                ? 'hover:bg-slate-800 text-slate-400'
                : 'hover:bg-slate-100 text-slate-600'
            )}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <h1
            className={cn(
              'text-lg font-bold',
              darkMode ? 'text-white' : 'text-slate-900'
            )}
          >
            AIP Food Database
          </h1>
        </div>

        {/* Search */}
        <div className="relative">
          <svg
            className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
              darkMode ? 'text-slate-500' : 'text-slate-400'
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search foods..."
            className={cn(
              'w-full pl-10 pr-4 py-2 rounded-lg text-sm',
              darkMode
                ? 'bg-slate-800 text-white placeholder-slate-500 border border-slate-700'
                : 'bg-white text-slate-900 placeholder-slate-400 border border-slate-300'
            )}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as AIPFoodCategory | 'ALL')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm',
              darkMode
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'bg-white text-slate-900 border border-slate-300'
            )}
          >
            <option value="ALL">All Categories</option>
            {categories.filter(c => c !== 'ALL').map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat as AIPFoodCategory]}
              </option>
            ))}
          </select>

          <select
            value={selectedPhase}
            onChange={(e) => setSelectedPhase(e.target.value as AIPPhase | 'ALL')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm',
              darkMode
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'bg-white text-slate-900 border border-slate-300'
            )}
          >
            <option value="ALL">All Phases</option>
            <option value="ELIMINATION">Elimination (Safe)</option>
            <option value="REINTRO_1">Reintro Phase 1</option>
            <option value="REINTRO_2">Reintro Phase 2</option>
            <option value="AVOID">Avoid</option>
          </select>

          <button
            onClick={() => setShowAvoid(!showAvoid)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors',
              showAvoid
                ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                : darkMode
                ? 'bg-slate-800 text-slate-400 border border-slate-700'
                : 'bg-white text-slate-600 border border-slate-300'
            )}
          >
            {showAvoid ? 'Showing Avoided' : 'Show Avoided'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full" />
          </div>
        ) : foods.length === 0 ? (
          <div className="text-center py-12">
            <p
              className={cn(
                'text-sm',
                darkMode ? 'text-slate-500' : 'text-slate-400'
              )}
            >
              No foods found matching your criteria.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from(groupedFoods.entries()).map(([category, categoryFoods]) => (
              <div key={category}>
                <h2
                  className={cn(
                    'text-sm font-medium mb-3',
                    darkMode ? 'text-slate-400' : 'text-slate-600'
                  )}
                >
                  {CATEGORY_LABELS[category]} ({categoryFoods.length})
                </h2>

                <div className="space-y-2">
                  {categoryFoods.map((food) => {
                    const qualityBadges = getQualityBadges(food)

                    return (
                      <div
                        key={food.id}
                        className={cn(
                          'p-4 rounded-lg',
                          food.aipPhase === 'AVOID'
                            ? darkMode
                              ? 'bg-red-500/10 border border-red-500/30'
                              : 'bg-red-50 border border-red-200'
                            : darkMode
                            ? 'bg-slate-800'
                            : 'bg-white border border-slate-200'
                        )}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3
                              className={cn(
                                'font-medium',
                                darkMode ? 'text-white' : 'text-slate-900'
                              )}
                            >
                              {food.name}
                            </h3>
                            {food.servingSize && (
                              <p
                                className={cn(
                                  'text-xs',
                                  darkMode ? 'text-slate-500' : 'text-slate-500'
                                )}
                              >
                                Serving: {food.servingSize}
                              </p>
                            )}
                          </div>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-sm text-xs font-medium',
                              PHASE_COLORS[food.aipPhase]
                            )}
                          >
                            {PHASE_LABELS[food.aipPhase]}
                          </span>
                        </div>

                        {/* Macros */}
                        <div
                          className={cn(
                            'text-xs mb-2',
                            darkMode ? 'text-slate-400' : 'text-slate-600'
                          )}
                        >
                          {formatMacros(food)}
                        </div>

                        {/* Tyramine/Histamine indicators */}
                        {(food.tyramineLevel !== 'LOW' || food.histamineLevel !== 'LOW') && (
                          <div className="flex gap-3 mb-2 text-xs">
                            {food.tyramineLevel !== 'LOW' && (
                              <span className={TYRAMINE_COLORS[food.tyramineLevel]}>
                                Tyramine: {LEVEL_LABELS[food.tyramineLevel]}
                              </span>
                            )}
                            {food.histamineLevel !== 'LOW' && (
                              <span className={TYRAMINE_COLORS[food.histamineLevel]}>
                                Histamine: {LEVEL_LABELS[food.histamineLevel]}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Quality badges */}
                        {qualityBadges.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {qualityBadges.map((badge) => (
                              <span
                                key={badge.label}
                                className={cn(
                                  'px-2 py-0.5 rounded-sm text-xs',
                                  badge.color
                                )}
                              >
                                {badge.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats footer */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 px-4 py-2 border-t text-center text-xs',
          darkMode
            ? 'bg-slate-900 border-slate-800 text-slate-500'
            : 'bg-white border-slate-200 text-slate-500'
        )}
      >
        {foods.length} foods loaded
      </div>
    </div>
  )
}

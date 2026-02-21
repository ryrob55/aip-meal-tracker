'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import {
  NaturalLanguageInput,
  ParsedMealPreview,
  QuickAddBar,
  CopyDayButton,
  BatchLogger,
} from '@/components/quick-log'

interface ParsedResult {
  meals: Array<{
    name: string
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber?: number
    aipCompliant: boolean
    aipWarning?: string | null
  }>
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  mealType: string
}

interface FavoriteFood {
  id: string
  foodName: string
  defaultAmount: string | null
  macros: { calories?: number; protein?: number; carbs?: number; fat?: number } | null
  useCount: number
}

export default function QuickLogPage() {
  const { darkMode } = useTheme()
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<'ai' | 'batch'>('ai')
  const [parsedResult, setParsedResult] = useState<ParsedResult | null>(null)
  const [saved, setSaved] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const { data: favorites = [] } = useQuery<FavoriteFood[]>({
    queryKey: ['favorites'],
    queryFn: async () => {
      const res = await fetch('/api/meals/favorites')
      if (!res.ok) return []
      return res.json()
    },
  })

  const parseMeal = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch('/api/meals/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to parse')
      }
      return res.json()
    },
    onSuccess: (data) => {
      setParsedResult(data)
    },
  })

  const saveBatch = useMutation({
    mutationFn: async (
      meals: Array<{
        mealType: string
        mealName: string
        calories?: number
        protein?: number
        carbs?: number
        fat?: number
      }>
    ) => {
      const res = await fetch('/api/meals/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today, meals }),
      })
      if (!res.ok) throw new Error('Failed to save')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-log'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  const confirmParsed = () => {
    if (!parsedResult) return
    saveBatch.mutate(
      parsedResult.meals.map((m) => ({
        mealType: parsedResult.mealType,
        mealName: m.name,
        calories: m.calories,
        protein: m.protein,
        carbs: m.carbs,
        fat: m.fat,
      }))
    )
    setParsedResult(null)
  }

  const handleFavoriteSelect = (fav: FavoriteFood) => {
    parseMeal.mutate(fav.foodName)
  }

  return (
    <div
      className={cn(
        'min-h-screen p-4 pb-24',
        darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'
      )}
    >
      <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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
          <h1 className="text-xl font-bold">Quick Log</h1>
        </div>
        <CopyDayButton
          targetDate={today}
          onCopied={() => {
            queryClient.invalidateQueries({ queryKey: ['daily-log'] })
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
          }}
          darkMode={darkMode}
        />
      </div>

      {/* Success banner */}
      {saved && (
        <div className="p-3 rounded-lg bg-green-500/20 text-green-400 text-sm mb-4 text-center">
          Meals saved!
        </div>
      )}

      {/* Mode toggle */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setMode('ai')}
          className={cn(
            'flex-1 py-2 rounded-lg text-sm font-medium',
            mode === 'ai'
              ? 'bg-blue-500 text-white'
              : darkMode
              ? 'bg-slate-800 text-slate-300'
              : 'bg-slate-100 text-slate-700'
          )}
        >
          AI Parse
        </button>
        <button
          onClick={() => setMode('batch')}
          className={cn(
            'flex-1 py-2 rounded-lg text-sm font-medium',
            mode === 'batch'
              ? 'bg-blue-500 text-white'
              : darkMode
              ? 'bg-slate-800 text-slate-300'
              : 'bg-slate-100 text-slate-700'
          )}
        >
          Manual Entry
        </button>
      </div>

      {/* AI Mode */}
      {mode === 'ai' && (
        <div className="space-y-4">
          <NaturalLanguageInput
            onParse={(text) => parseMeal.mutate(text)}
            isParsing={parseMeal.isPending}
            darkMode={darkMode}
          />

          {parseMeal.isError && (
            <div className="p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">
              {parseMeal.error.message}
            </div>
          )}

          {parsedResult && (
            <ParsedMealPreview
              result={parsedResult}
              onConfirm={confirmParsed}
              onEdit={() => setParsedResult(null)}
              isConfirming={saveBatch.isPending}
              darkMode={darkMode}
            />
          )}

          {favorites.length > 0 && !parsedResult && (
            <QuickAddBar
              favorites={favorites}
              onSelect={handleFavoriteSelect}
              darkMode={darkMode}
            />
          )}
        </div>
      )}

      {/* Batch Mode */}
      {mode === 'batch' && (
        <BatchLogger
          date={today}
          onSave={(meals) => saveBatch.mutate(meals)}
          isSaving={saveBatch.isPending}
          darkMode={darkMode}
        />
      )}
      </div>
    </div>
  )
}

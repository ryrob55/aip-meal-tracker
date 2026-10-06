'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronDown, ChevronUp, Search } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import { REINTRO_STAGES, type ReintroFood } from '@/lib/reintro-foods'

export default function NewReintroPage() {
  const { darkMode } = useTheme()
  const router = useRouter()
  const [selectedFood, setSelectedFood] = useState<{
    name: string
    stage: number
    notes?: string
  } | null>(null)
  const [customFood, setCustomFood] = useState('')
  const [customStage, setCustomStage] = useState(1)
  const [expandedStage, setExpandedStage] = useState(1)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  const handleStartTest = async () => {
    const foodName = selectedFood?.name || customFood.trim()
    const stage = selectedFood?.stage || customStage

    if (!foodName) return

    setIsCreating(true)
    setError(null)

    try {
      const res = await fetch('/api/reintro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foodName,
          reintroStage: stage,
          testDate: new Date().toISOString(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to create test')
        setIsCreating(false)
        return
      }

      const test = await res.json()
      router.push(`/reintro/${test.id}`)
    } catch {
      setError('Failed to create test')
      setIsCreating(false)
    }
  }

  // Filter foods by search
  const filteredStages = searchQuery.trim()
    ? Object.entries(REINTRO_STAGES).reduce(
        (acc, [stage, data]) => {
          const filtered = data.foods.filter(
            (f) =>
              f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              f.notes?.toLowerCase().includes(searchQuery.toLowerCase())
          )
          if (filtered.length > 0) {
            acc[Number(stage)] = { ...data, foods: filtered }
          }
          return acc
        },
        {} as typeof REINTRO_STAGES
      )
    : REINTRO_STAGES

  return (
    <div
      className={cn(
        'min-h-screen p-4 pb-24',
        darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/reintro"
          className={cn(
            'p-2 rounded-lg',
            darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-200'
          )}
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">Start Reintroduction Test</h1>
      </div>

      {/* Instructions */}
      <div
        className={cn(
          'p-4 rounded-xl mb-6',
          darkMode ? 'bg-slate-900' : 'bg-blue-50 border border-blue-200'
        )}
      >
        <h3 className={cn('font-medium mb-2', darkMode ? 'text-blue-400' : 'text-blue-700')}>
          How this works
        </h3>
        <ol
          className={cn(
            'text-sm space-y-1 list-decimal list-inside',
            darkMode ? 'text-slate-300' : 'text-slate-700'
          )}
        >
          <li>Pick a food to test (start with Stage 1 for best results)</li>
          <li>Day 0: Eat graduated portions throughout the day</li>
          <li>Days 1-3: Do NOT eat the food. Track any symptoms.</li>
          <li>Days 4-7: Eat the food daily if no reactions on Days 1-3</li>
          <li>Record your result: Safe, Reaction Detected, or Inconclusive</li>
        </ol>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/20 text-red-400 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search
          className={cn(
            'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
            darkMode ? 'text-slate-500' : 'text-slate-400'
          )}
        />
        <input
          type="text"
          placeholder="Search foods..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(
            'w-full pl-10 pr-4 py-2.5 rounded-lg text-sm',
            darkMode
              ? 'bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500'
              : 'bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400'
          )}
        />
      </div>

      {/* Food List by Stage */}
      <div className="space-y-3 mb-6">
        {Object.entries(filteredStages).map(([stage, data]) => (
          <div
            key={stage}
            className={cn(
              'rounded-xl overflow-hidden',
              darkMode ? 'bg-slate-900' : 'bg-white border border-slate-200'
            )}
          >
            <button
              onClick={() =>
                setExpandedStage(expandedStage === Number(stage) ? 0 : Number(stage))
              }
              className={cn(
                'w-full p-3 flex items-center justify-between text-left',
                darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
              )}
            >
              <div>
                <span className="font-medium text-sm">{data.label}</span>
                <p
                  className={cn(
                    'text-xs',
                    darkMode ? 'text-slate-500' : 'text-slate-500'
                  )}
                >
                  {data.description}
                </p>
              </div>
              {expandedStage === Number(stage) ? (
                <ChevronUp className="w-4 h-4 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 shrink-0" />
              )}
            </button>

            {expandedStage === Number(stage) && (
              <div className="px-3 pb-3">
                {data.foods.map((food) => {
                  const isSelected = selectedFood?.name === food.name
                  return (
                    <button
                      key={food.name}
                      onClick={() => {
                        setSelectedFood({
                          name: food.name,
                          stage: Number(stage),
                          notes: food.notes,
                        })
                        setShowCustom(false)
                        setCustomFood('')
                      }}
                      className={cn(
                        'w-full p-3 rounded-lg text-left mb-1 transition-colors',
                        isSelected
                          ? 'bg-blue-500/20 border border-blue-500/50'
                          : darkMode
                          ? 'hover:bg-slate-800 border border-transparent'
                          : 'hover:bg-slate-50 border border-transparent'
                      )}
                    >
                      <span
                        className={cn(
                          'text-sm font-medium',
                          isSelected
                            ? 'text-blue-400'
                            : darkMode
                            ? 'text-white'
                            : 'text-slate-900'
                        )}
                      >
                        {food.name}
                      </span>
                      {food.notes && (
                        <p
                          className={cn(
                            'text-xs mt-0.5',
                            darkMode ? 'text-slate-500' : 'text-slate-500'
                          )}
                        >
                          {food.notes}
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Custom Food */}
      <div className="mb-6">
        <button
          onClick={() => {
            setShowCustom(!showCustom)
            setSelectedFood(null)
          }}
          className={cn(
            'text-sm',
            darkMode ? 'text-blue-400' : 'text-blue-600'
          )}
        >
          {showCustom ? 'Hide custom food' : 'Test a food not listed above'}
        </button>

        {showCustom && (
          <div className="mt-3 space-y-3">
            <input
              type="text"
              placeholder="Food name"
              value={customFood}
              onChange={(e) => setCustomFood(e.target.value)}
              className={cn(
                'w-full px-3 py-2.5 rounded-lg text-sm',
                darkMode
                  ? 'bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500'
                  : 'bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400'
              )}
            />
            <div>
              <label
                className={cn(
                  'text-xs font-medium block mb-1',
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                )}
              >
                Reactivity stage
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((s) => (
                  <button
                    key={s}
                    onClick={() => setCustomStage(s)}
                    className={cn(
                      'flex-1 py-2 rounded-lg text-sm font-medium',
                      customStage === s
                        ? 'bg-blue-500 text-white'
                        : darkMode
                        ? 'bg-slate-800 text-slate-300'
                        : 'bg-slate-100 text-slate-700'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Start Button */}
      {(selectedFood || customFood.trim()) && (
        <div
          className={cn(
            'fixed bottom-0 left-0 right-0 p-4',
            darkMode ? 'bg-slate-900/90 backdrop-blur-sm' : 'bg-white/90 backdrop-blur-sm border-t border-slate-200'
          )}
        >
          <div className="mb-2 text-center">
            <span className={cn('text-sm', darkMode ? 'text-slate-400' : 'text-slate-600')}>
              Testing:{' '}
            </span>
            <span className="text-sm font-medium">
              {selectedFood?.name || customFood.trim()}
            </span>
            <span className={cn('text-xs ml-2', darkMode ? 'text-slate-500' : 'text-slate-500')}>
              (Stage {selectedFood?.stage || customStage})
            </span>
          </div>
          <button
            onClick={handleStartTest}
            disabled={isCreating}
            className={cn(
              'w-full py-3 rounded-xl text-white font-medium',
              isCreating
                ? 'bg-blue-500/50 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            )}
          >
            {isCreating ? 'Creating...' : 'Start 7-Day Test'}
          </button>
        </div>
      )}
    </div>
  )
}

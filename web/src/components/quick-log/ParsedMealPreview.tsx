'use client'

import { cn } from '@/lib/utils'

interface ParsedMeal {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  aipCompliant: boolean
  aipWarning?: string | null
}

interface ParsedResult {
  meals: ParsedMeal[]
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  mealType: string
}

interface Props {
  result: ParsedResult
  onConfirm: () => void
  onEdit: () => void
  isConfirming: boolean
  darkMode?: boolean
}

export function ParsedMealPreview({
  result,
  onConfirm,
  onEdit,
  isConfirming,
  darkMode = true,
}: Props) {
  return (
    <div
      className={cn(
        'p-4 rounded-xl',
        darkMode ? 'bg-slate-900' : 'bg-white border border-slate-200'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className={cn('text-sm font-medium', darkMode ? 'text-slate-300' : 'text-slate-700')}>
          Parsed Meal
        </h4>
        <span
          className={cn(
            'text-xs px-2 py-0.5 rounded-full',
            darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
          )}
        >
          {result.mealType.replace('_', ' ')}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        {result.meals.map((meal, i) => (
          <div
            key={i}
            className={cn(
              'p-2 rounded-lg',
              darkMode ? 'bg-slate-800' : 'bg-slate-50'
            )}
          >
            <div className="flex items-start justify-between">
              <span className="text-sm font-medium">{meal.name}</span>
              {!meal.aipCompliant && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-orange-500/20 text-orange-400">
                  Not AIP
                </span>
              )}
            </div>
            <div
              className={cn(
                'flex gap-3 mt-1 text-[10px]',
                darkMode ? 'text-slate-500' : 'text-slate-400'
              )}
            >
              <span>{meal.calories} cal</span>
              <span>{meal.protein}g P</span>
              <span>{meal.carbs}g C</span>
              <span>{meal.fat}g F</span>
            </div>
            {meal.aipWarning && (
              <p className="text-[10px] text-orange-400 mt-1">{meal.aipWarning}</p>
            )}
          </div>
        ))}
      </div>

      {/* Totals */}
      <div
        className={cn(
          'flex gap-4 mb-4 py-2 px-3 rounded-lg text-xs',
          darkMode ? 'bg-slate-800' : 'bg-slate-50'
        )}
      >
        <div>
          <span className={cn('block', darkMode ? 'text-slate-500' : 'text-slate-400')}>Calories</span>
          <span className="font-medium">{result.totalCalories}</span>
        </div>
        <div>
          <span className={cn('block', darkMode ? 'text-slate-500' : 'text-slate-400')}>Protein</span>
          <span className="font-medium">{result.totalProtein}g</span>
        </div>
        <div>
          <span className={cn('block', darkMode ? 'text-slate-500' : 'text-slate-400')}>Carbs</span>
          <span className="font-medium">{result.totalCarbs}g</span>
        </div>
        <div>
          <span className={cn('block', darkMode ? 'text-slate-500' : 'text-slate-400')}>Fat</span>
          <span className="font-medium">{result.totalFat}g</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className={cn(
            'flex-1 py-2.5 rounded-xl text-sm font-medium',
            darkMode ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-900'
          )}
        >
          Edit
        </button>
        <button
          onClick={onConfirm}
          disabled={isConfirming}
          className={cn(
            'flex-1 py-2.5 rounded-xl text-sm font-medium text-white',
            isConfirming ? 'bg-green-500/50' : 'bg-green-500 hover:bg-green-600'
          )}
        >
          {isConfirming ? 'Saving...' : 'Confirm & Save'}
        </button>
      </div>
    </div>
  )
}

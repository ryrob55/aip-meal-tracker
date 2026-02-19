'use client'

import { cn } from '@/lib/utils'
import {
  calculateMacroProgress,
  getMacroProgressBarColor,
  type MacroTargets,
} from '@/lib/macro-calculator'
import type { AIPMealEntry } from '@prisma/client'

// Extended type with linked recipe for dynamic macros
interface MealWithRecipe extends Partial<AIPMealEntry> {
  recipe?: {
    calories: number | null
    protein: number | null
    carbs: number | null
    fiber: number | null
    fat: number | null
    netCarbs: number | null
  } | null
}

interface Props {
  meals: MealWithRecipe[]
  targets?: MacroTargets
  darkMode?: boolean
  compact?: boolean
}

export function DailyMacroProgress({
  meals,
  targets = { calories: 2600, protein: 150, netCarbs: 80 },
  darkMode = true,
  compact = false,
}: Props) {
  const progress = calculateMacroProgress(meals, targets)

  if (compact) {
    return (
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <span className={cn(darkMode ? 'text-slate-500' : 'text-slate-400')}>
            Cal:
          </span>
          <span
            className={cn(
              'font-medium',
              progress.percentages.calories >= 90
                ? 'text-green-500'
                : darkMode
                ? 'text-slate-300'
                : 'text-slate-600'
            )}
          >
            {Math.round(progress.current.calories)}
          </span>
          <span className={cn(darkMode ? 'text-slate-600' : 'text-slate-400')}>
            /{targets.calories}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span className={cn(darkMode ? 'text-slate-500' : 'text-slate-400')}>
            P:
          </span>
          <span
            className={cn(
              'font-medium',
              progress.percentages.protein >= 90
                ? 'text-green-500'
                : darkMode
                ? 'text-slate-300'
                : 'text-slate-600'
            )}
          >
            {Math.round(progress.current.protein)}g
          </span>
          <span className={cn(darkMode ? 'text-slate-600' : 'text-slate-400')}>
            /{targets.protein}g
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span className={cn(darkMode ? 'text-slate-500' : 'text-slate-400')}>
            NC:
          </span>
          <span
            className={cn(
              'font-medium',
              progress.percentages.netCarbs > 100
                ? 'text-red-500'
                : progress.percentages.netCarbs > 80
                ? 'text-yellow-500'
                : 'text-green-500'
            )}
          >
            {Math.round(progress.current.netCarbs)}g
          </span>
          <span className={cn(darkMode ? 'text-slate-600' : 'text-slate-400')}>
            /{targets.netCarbs}g
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg p-4',
        darkMode ? 'bg-slate-800/50' : 'bg-slate-100'
      )}
    >
      <div className="flex justify-between items-center mb-3">
        <h3
          className={cn(
            'text-sm font-medium',
            darkMode ? 'text-slate-300' : 'text-slate-700'
          )}
        >
          Daily Progress
        </h3>
        <span
          className={cn(
            'text-xs',
            darkMode ? 'text-slate-500' : 'text-slate-400'
          )}
        >
          {meals.length} meals logged
        </span>
      </div>

      <div className="space-y-4">
        {/* Calories */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span
              className={cn(
                'text-xs',
                darkMode ? 'text-slate-400' : 'text-slate-600'
              )}
            >
              Calories
            </span>
            <span
              className={cn(
                'text-xs font-medium',
                darkMode ? 'text-slate-300' : 'text-slate-700'
              )}
            >
              {Math.round(progress.current.calories)} / {targets.calories}
            </span>
          </div>
          <div
            className={cn(
              'h-2 rounded-full overflow-hidden',
              darkMode ? 'bg-slate-700' : 'bg-slate-200'
            )}
          >
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                getMacroProgressBarColor(progress.percentages.calories, 'target')
              )}
              style={{
                width: `${Math.min(100, progress.percentages.calories)}%`,
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span
              className={cn(
                'text-xs',
                progress.percentages.calories >= 90
                  ? 'text-green-500'
                  : darkMode
                  ? 'text-slate-500'
                  : 'text-slate-400'
              )}
            >
              {progress.percentages.calories}%
            </span>
            <span
              className={cn(
                'text-xs',
                darkMode ? 'text-slate-500' : 'text-slate-400'
              )}
            >
              {progress.remaining.calories} remaining
            </span>
          </div>
        </div>

        {/* Protein */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span
              className={cn(
                'text-xs',
                darkMode ? 'text-slate-400' : 'text-slate-600'
              )}
            >
              Protein
            </span>
            <span
              className={cn(
                'text-xs font-medium',
                darkMode ? 'text-slate-300' : 'text-slate-700'
              )}
            >
              {Math.round(progress.current.protein)}g / {targets.protein}g
            </span>
          </div>
          <div
            className={cn(
              'h-2 rounded-full overflow-hidden',
              darkMode ? 'bg-slate-700' : 'bg-slate-200'
            )}
          >
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                getMacroProgressBarColor(progress.percentages.protein, 'target')
              )}
              style={{
                width: `${Math.min(100, progress.percentages.protein)}%`,
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span
              className={cn(
                'text-xs',
                progress.percentages.protein >= 90
                  ? 'text-green-500'
                  : darkMode
                  ? 'text-slate-500'
                  : 'text-slate-400'
              )}
            >
              {progress.percentages.protein}%
            </span>
            <span
              className={cn(
                'text-xs',
                darkMode ? 'text-slate-500' : 'text-slate-400'
              )}
            >
              {Math.round(progress.remaining.protein)}g remaining
            </span>
          </div>
        </div>

        {/* Net Carbs */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span
              className={cn(
                'text-xs',
                darkMode ? 'text-slate-400' : 'text-slate-600'
              )}
            >
              Net Carbs (limit)
            </span>
            <span
              className={cn(
                'text-xs font-medium',
                progress.percentages.netCarbs > 100
                  ? 'text-red-500'
                  : darkMode
                  ? 'text-slate-300'
                  : 'text-slate-700'
              )}
            >
              {Math.round(progress.current.netCarbs)}g / {targets.netCarbs}g
            </span>
          </div>
          <div
            className={cn(
              'h-2 rounded-full overflow-hidden',
              darkMode ? 'bg-slate-700' : 'bg-slate-200'
            )}
          >
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                getMacroProgressBarColor(progress.percentages.netCarbs, 'limit')
              )}
              style={{
                width: `${Math.min(100, progress.percentages.netCarbs)}%`,
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span
              className={cn(
                'text-xs',
                progress.percentages.netCarbs <= 80
                  ? 'text-green-500'
                  : progress.percentages.netCarbs <= 100
                  ? 'text-yellow-500'
                  : 'text-red-500'
              )}
            >
              {progress.percentages.netCarbs}% of limit
            </span>
            <span
              className={cn(
                'text-xs',
                progress.percentages.netCarbs > 100
                  ? 'text-red-500'
                  : darkMode
                  ? 'text-slate-500'
                  : 'text-slate-400'
              )}
            >
              {progress.remaining.netCarbs > 0
                ? `${Math.round(progress.remaining.netCarbs)}g available`
                : `${Math.abs(Math.round(progress.remaining.netCarbs))}g over!`}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

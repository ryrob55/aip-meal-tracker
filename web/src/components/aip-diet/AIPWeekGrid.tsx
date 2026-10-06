'use client'

import { format, isToday } from 'date-fns'
import { Coffee, CupSoda, Salad, Drumstick, UtensilsCrossed, Apple, LeafyGreen } from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AIPMealEntry, MealType } from '@prisma/client'

type IconComponent = React.ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>>

// Extended type with linked recipe
interface MealEntryWithRecipe extends AIPMealEntry {
  recipe?: {
    id: string
    name: string
    calories: number | null
    protein: number | null
    carbs: number | null
    fiber: number | null
    fat: number | null
    netCarbs: number | null
    servings: number | null
    ingredients?: unknown[]
    instructions?: string
  } | null
}

interface AIPDailyLog {
  id: string
  date: string
  meals: MealEntryWithRecipe[]
}

interface AIPWeekGridProps {
  weekDays: Date[]
  dailyLogs: AIPDailyLog[]
  mealTypes: MealType[]
  darkMode: boolean
  onMealClick?: (date: Date, mealType: MealType, meal: MealEntryWithRecipe | null) => void
  onViewMeal?: (meal: MealEntryWithRecipe) => void
  onMarkEaten?: (meal: MealEntryWithRecipe, eaten: boolean) => void
  onMarkSkipped?: (meal: MealEntryWithRecipe, skipped: boolean) => void
}

const MEAL_TYPE_CONFIG: Record<MealType, { label: string; shortLabel: string; icon: IconComponent; color: string; bgColor: string }> = {
  MORNING_COFFEE: { label: 'Morning Coffee', shortLabel: 'Coffee', icon: Coffee, color: 'text-amber-500', bgColor: 'bg-amber-500/20' },
  SMOOTHIE: { label: 'Smoothie', shortLabel: 'Smoothie', icon: CupSoda, color: 'text-purple-500', bgColor: 'bg-purple-500/20' },
  LUNCH: { label: 'Lunch', shortLabel: 'Lunch', icon: Salad, color: 'text-green-500', bgColor: 'bg-green-500/20' },
  AFTERNOON_SNACK: { label: 'Afternoon Snack', shortLabel: 'Snack', icon: Drumstick, color: 'text-blue-500', bgColor: 'bg-blue-500/20' },
  DINNER: { label: 'Dinner', shortLabel: 'Dinner', icon: UtensilsCrossed, color: 'text-orange-500', bgColor: 'bg-orange-500/20' },
  EVENING_SNACK: { label: 'Evening Snack', shortLabel: 'Evening', icon: Apple, color: 'text-pink-500', bgColor: 'bg-pink-500/20' },
  EXTRA_SNACKS: { label: 'Extra Snacks', shortLabel: 'Extra', icon: LeafyGreen, color: 'text-lime-500', bgColor: 'bg-lime-500/20' },
}

export function AIPWeekGrid({
  weekDays,
  dailyLogs,
  mealTypes,
  darkMode,
  onMealClick,
  onViewMeal,
  onMarkEaten,
  onMarkSkipped,
}: AIPWeekGridProps) {
  // Get meal for a specific date and type (returns first match for non-extra-snacks)
  const getMeal = (date: Date, mealType: MealType): MealEntryWithRecipe | null => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const log = dailyLogs.find((l) => l.date.split('T')[0] === dateStr)
    return log?.meals.find((m) => m.mealType === mealType) || null
  }

  // Get all extra snacks for a date
  const getExtraSnacks = (date: Date): MealEntryWithRecipe[] => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const log = dailyLogs.find((l) => l.date.split('T')[0] === dateStr)
    return log?.meals.filter((m) => m.mealType === 'EXTRA_SNACKS') || []
  }

  // Get daily totals - use recipe macros if linked, otherwise fall back to stored macros
  const getDayTotals = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const log = dailyLogs.find((l) => l.date.split('T')[0] === dateStr)
    if (!log) return { calories: 0, protein: 0, netCarbs: 0, eaten: 0, total: 0 }
    return {
      calories: log.meals.reduce((sum, m) => sum + (m.recipe?.calories ?? m.calories ?? 0) * (m.actualServings ?? m.servings ?? 1), 0),
      protein: log.meals.reduce((sum, m) => sum + (m.recipe?.protein ?? m.protein ?? 0) * (m.actualServings ?? m.servings ?? 1), 0),
      netCarbs: log.meals.reduce((sum, m) => sum + (m.recipe?.netCarbs ?? m.netCarbs ?? 0) * (m.actualServings ?? m.servings ?? 1), 0),
      eaten: log.meals.filter((m) => m.eaten).length,
      total: log.meals.length,
    }
  }

  return (
    <div className="w-full">
      {/* Header row with days */}
      <div className="grid grid-cols-8 gap-2 mb-2">
        {/* Empty corner cell */}
        <div className={cn(
          'p-3 rounded-lg flex items-center justify-center',
          darkMode ? 'bg-slate-700/50' : 'bg-slate-100'
        )}>
          <span className={cn('text-sm font-semibold', darkMode ? 'text-slate-400' : 'text-slate-500')}>
            Meal
          </span>
        </div>

        {/* Day headers */}
        {weekDays.map((day) => {
          const totals = getDayTotals(day)
          const today = isToday(day)
          const hasData = totals.total > 0

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'p-3 rounded-lg text-center transition-all',
                today
                  ? 'bg-green-500 text-white ring-2 ring-green-400 ring-offset-2 ring-offset-slate-900'
                  : darkMode
                  ? 'bg-slate-700'
                  : 'bg-slate-100'
              )}
            >
              <div className={cn('font-bold text-base', today ? 'text-white' : darkMode ? 'text-slate-200' : 'text-slate-700')}>
                {format(day, 'EEE')}
              </div>
              <div className={cn('text-sm', today ? 'text-green-100' : darkMode ? 'text-slate-400' : 'text-slate-500')}>
                {format(day, 'M/d')}
              </div>
              {hasData && (
                <div className={cn(
                  'mt-1.5 pt-1.5 border-t text-xs leading-tight',
                  today ? 'border-green-400/50 text-green-100' : darkMode ? 'border-slate-600 text-slate-500' : 'border-slate-200 text-slate-400'
                )}>
                  <span className="font-medium">{Math.round(totals.calories)}</span> cal
                  <br />
                  <span className="text-blue-400">{Math.round(totals.protein)}p</span>
                  {' · '}
                  <span className="text-orange-400">{Math.round(totals.netCarbs)}c</span>
                  {totals.eaten > 0 && (
                    <>
                      <br />
                      <span className="text-green-400">{totals.eaten}/{totals.total} ✓</span>
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Meal rows */}
      {mealTypes.map((mealType) => {
        const config = MEAL_TYPE_CONFIG[mealType]

        return (
          <div key={mealType} className="grid grid-cols-8 gap-2 mb-2">
            {/* Meal type label */}
            <div className={cn(
              'p-3 rounded-lg flex items-center gap-2',
              darkMode ? 'bg-slate-700/50' : 'bg-slate-100'
            )}>
              <config.icon className={cn('w-5 h-5', config.color)} />
              <span className={cn(
                'text-sm font-semibold',
                darkMode ? 'text-slate-300' : 'text-slate-600'
              )}>
                {config.shortLabel}
              </span>
            </div>

            {/* Meal cells for each day */}
            {weekDays.map((day) => {
              const today = isToday(day)

              if (mealType === 'EXTRA_SNACKS') {
                const snacks = getExtraSnacks(day)
                return (
                  <ExtraSnackCell
                    key={`${format(day, 'yyyy-MM-dd')}-${mealType}`}
                    snacks={snacks}
                    darkMode={darkMode}
                    isToday={today}
                    onAdd={() => onMealClick?.(day, mealType, null)}
                    onView={onViewMeal}
                    onMarkEaten={onMarkEaten}
                  />
                )
              }

              const meal = getMeal(day, mealType)
              return (
                <MealCell
                  key={`${format(day, 'yyyy-MM-dd')}-${mealType}`}
                  meal={meal}
                  mealType={mealType}
                  config={config}
                  darkMode={darkMode}
                  isToday={today}
                  onAdd={() => onMealClick?.(day, mealType, null)}
                  onView={onViewMeal}
                  onMarkEaten={onMarkEaten}
                  onMarkSkipped={onMarkSkipped}
                />
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

// Extra snack cell - supports multiple stacked items
function ExtraSnackCell({
  snacks,
  darkMode,
  isToday,
  onAdd,
  onView,
  onMarkEaten,
}: {
  snacks: MealEntryWithRecipe[]
  darkMode: boolean
  isToday: boolean
  onAdd: () => void
  onView?: (meal: MealEntryWithRecipe) => void
  onMarkEaten?: (meal: MealEntryWithRecipe, eaten: boolean) => void
}) {
  if (snacks.length === 0) {
    return (
      <button
        onClick={onAdd}
        className={cn(
          'p-3 rounded-lg border-2 border-dashed transition-all min-h-[100px] flex flex-col items-center justify-center gap-1 group',
          darkMode
            ? 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'
            : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50',
          isToday && 'border-green-500/30 hover:border-green-500/50'
        )}
      >
        <span className={cn(
          'text-3xl opacity-30 group-hover:opacity-60 transition-opacity',
          darkMode ? 'text-slate-500' : 'text-slate-400'
        )}>
          +
        </span>
        <span className={cn(
          'text-xs opacity-0 group-hover:opacity-60 transition-opacity',
          darkMode ? 'text-slate-500' : 'text-slate-400'
        )}>
          Add
        </span>
      </button>
    )
  }

  const totalCals = snacks.reduce((sum, s) => sum + (s.recipe?.calories ?? s.calories ?? 0) * (s.actualServings ?? s.servings ?? 1), 0)
  const totalProtein = snacks.reduce((sum, s) => sum + (s.recipe?.protein ?? s.protein ?? 0) * (s.actualServings ?? s.servings ?? 1), 0)
  const totalNetCarbs = snacks.reduce((sum, s) => sum + (s.recipe?.netCarbs ?? s.netCarbs ?? 0) * (s.actualServings ?? s.servings ?? 1), 0)

  return (
    <div
      className={cn(
        'p-2 rounded-lg border transition-all min-h-[100px] flex flex-col',
        darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200',
        isToday && 'ring-1 ring-green-500/30'
      )}
    >
      {/* Stacked snack items */}
      <div className="flex-1 space-y-1">
        {snacks.map((snack) => (
          <button
            key={snack.id}
            onClick={() => onView?.(snack)}
            className={cn(
              'w-full text-left px-1.5 py-1 rounded-sm text-xs leading-tight hover:underline cursor-pointer flex items-center gap-1',
              snack.eaten
                ? darkMode ? 'text-green-400 bg-green-900/20' : 'text-green-700 bg-green-50'
                : darkMode ? 'text-slate-300 hover:bg-slate-700/50' : 'text-slate-700 hover:bg-slate-50'
            )}
          >
            <span className="flex-1 truncate font-medium">
              {snack.mealName.replace(/^AIP\s+/i, '')}
            </span>
            <span className={cn('text-[10px] shrink-0', darkMode ? 'text-slate-500' : 'text-slate-400')}>
              {Math.round((snack.recipe?.calories ?? snack.calories ?? 0) * (snack.actualServings ?? snack.servings ?? 1))}
            </span>
            {snack.eaten && (
              <span className="text-green-500 text-[10px] shrink-0">✓</span>
            )}
          </button>
        ))}
      </div>

      {/* Aggregate totals + add button */}
      <div className={cn(
        'flex items-center justify-between gap-1 mt-1.5 pt-1.5 border-t',
        darkMode ? 'border-slate-700/30' : 'border-slate-200'
      )}>
        <div className={cn('text-[10px]', darkMode ? 'text-slate-500' : 'text-slate-400')}>
          <span className="font-medium">{Math.round(totalCals)}</span>
          {' '}
          <span className="text-blue-500">{Math.round(totalProtein)}p</span>
          {' '}
          <span className="text-orange-500">{Math.round(totalNetCarbs)}c</span>
        </div>
        <button
          onClick={onAdd}
          className={cn(
            'w-6 h-6 rounded-sm flex items-center justify-center text-sm font-bold transition-colors',
            darkMode
              ? 'bg-slate-700/50 text-slate-400 hover:bg-slate-600 hover:text-slate-200'
              : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
          )}
        >
          +
        </button>
      </div>
    </div>
  )
}

// Individual meal cell component
function MealCell({
  meal,
  mealType,
  config,
  darkMode,
  isToday,
  onAdd,
  onView,
  onMarkEaten,
  onMarkSkipped,
}: {
  meal: MealEntryWithRecipe | null
  mealType: MealType
  config: { label: string; shortLabel: string; icon: IconComponent; color: string; bgColor: string }
  darkMode: boolean
  isToday: boolean
  onAdd: () => void
  onView?: (meal: MealEntryWithRecipe) => void
  onMarkEaten?: (meal: MealEntryWithRecipe, eaten: boolean) => void
  onMarkSkipped?: (meal: MealEntryWithRecipe, skipped: boolean) => void
}) {
  if (!meal) {
    // Empty cell - add button
    return (
      <button
        onClick={onAdd}
        className={cn(
          'p-3 rounded-lg border-2 border-dashed transition-all min-h-[100px] flex flex-col items-center justify-center gap-1 group',
          darkMode
            ? 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'
            : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50',
          isToday && 'border-green-500/30 hover:border-green-500/50'
        )}
      >
        <span className={cn(
          'text-3xl opacity-30 group-hover:opacity-60 transition-opacity',
          darkMode ? 'text-slate-500' : 'text-slate-400'
        )}>
          +
        </span>
        <span className={cn(
          'text-xs opacity-0 group-hover:opacity-60 transition-opacity',
          darkMode ? 'text-slate-500' : 'text-slate-400'
        )}>
          Add
        </span>
      </button>
    )
  }

  // Meal cell with content
  const isEaten = meal.eaten
  const isSkipped = meal.skipped

  return (
    <div
      className={cn(
        'p-3 rounded-lg border transition-all min-h-[100px] flex flex-col',
        isEaten
          ? darkMode
            ? 'bg-green-900/30 border-green-700/50'
            : 'bg-green-50 border-green-300'
          : isSkipped
          ? darkMode
            ? 'bg-slate-800/30 border-slate-700/50 opacity-50'
            : 'bg-slate-50 border-slate-200 opacity-50'
          : darkMode
          ? 'bg-slate-800 border-slate-700'
          : 'bg-white border-slate-200',
        isToday && !isEaten && !isSkipped && 'ring-1 ring-green-500/30'
      )}
    >
      {/* Meal name - clickable to view details */}
      <button
        onClick={() => onView?.(meal)}
        className={cn(
          'text-sm leading-snug font-medium flex-1 text-left hover:underline cursor-pointer',
          isEaten
            ? darkMode ? 'text-green-300' : 'text-green-700'
            : isSkipped
            ? darkMode ? 'text-slate-500' : 'text-slate-400'
            : darkMode ? 'text-slate-200' : 'text-slate-700'
        )}
      >
        {meal.mealName
          .replace(/^AIP\s+/i, '')
          .replace(/with /gi, 'w/')
          .substring(0, 60)}
        {meal.mealName.length > 60 ? '...' : ''}
      </button>

      {/* Macros row - use recipe macros if linked */}
      <div className={cn(
        'flex items-center gap-2 text-xs mt-1.5',
        darkMode ? 'text-slate-500' : 'text-slate-400'
      )}>
        <span className="font-medium">{Math.round((meal.recipe?.calories ?? meal.calories ?? 0) * (meal.actualServings ?? meal.servings ?? 1))}</span>
        <span className="text-blue-500">{Math.round((meal.recipe?.protein ?? meal.protein ?? 0) * (meal.actualServings ?? meal.servings ?? 1))}p</span>
        <span className="text-orange-500">{Math.round((meal.recipe?.netCarbs ?? meal.netCarbs ?? 0) * (meal.actualServings ?? meal.servings ?? 1))}c</span>
        {meal.isLeftover && (
          <span className="text-yellow-500 ml-auto" title="Leftover">↺</span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-1.5 mt-2 pt-2 border-t border-slate-700/30">
        {!isEaten && !isSkipped ? (
          <>
            <button
              onClick={() => onMarkEaten?.(meal, true)}
              className={cn(
                'flex-1 py-1.5 rounded-sm text-xs font-medium transition-colors',
                'bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white'
              )}
            >
              ✓ Eaten
            </button>
            <button
              onClick={() => onMarkSkipped?.(meal, true)}
              className={cn(
                'px-3 py-1.5 rounded-sm text-xs transition-colors',
                darkMode
                  ? 'bg-slate-700/50 text-slate-400 hover:bg-slate-600'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              )}
            >
              Skip
            </button>
          </>
        ) : isEaten ? (
          <button
            onClick={() => onMarkEaten?.(meal, false)}
            className={cn(
              'flex-1 py-1.5 rounded-sm text-xs font-medium',
              'bg-green-500/30 text-green-400'
            )}
          >
            ✓ Done
          </button>
        ) : (
          <button
            onClick={() => onMarkSkipped?.(meal, false)}
            className={cn(
              'flex-1 py-1.5 rounded-sm text-xs',
              darkMode ? 'bg-slate-700/50 text-slate-500' : 'bg-slate-100 text-slate-400'
            )}
          >
            Skipped
          </button>
        )}
      </div>
    </div>
  )
}

'use client'

import { Coffee, CupSoda, Salad, Drumstick, UtensilsCrossed, Apple, LeafyGreen } from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MealType, AIPMealEntry } from '@prisma/client'

type IconComponent = React.ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>>

interface MealSlotProps {
  mealType: MealType
  time?: string
  meal?: AIPMealEntry | null
  onSelect?: () => void
  onRemove?: () => void
  onEdit?: () => void
  onMarkEaten?: (eaten: boolean) => void
  onMarkSkipped?: (skipped: boolean) => void
  darkMode?: boolean
  disabled?: boolean
  showTracking?: boolean
}

const MEAL_TYPE_CONFIG: Record<
  MealType,
  { label: string; icon: IconComponent; color: string; defaultTime: string }
> = {
  MORNING_COFFEE: {
    label: 'Morning Coffee',
    icon: Coffee,
    color: 'bg-amber-500',
    defaultTime: '6:30 AM',
  },
  SMOOTHIE: {
    label: 'Smoothie',
    icon: CupSoda,
    color: 'bg-purple-500',
    defaultTime: '11:30 AM',
  },
  LUNCH: {
    label: 'Lunch',
    icon: Salad,
    color: 'bg-green-500',
    defaultTime: '12:30 PM',
  },
  AFTERNOON_SNACK: {
    label: 'Afternoon Snack',
    icon: Drumstick,
    color: 'bg-blue-500',
    defaultTime: '2:30 PM',
  },
  DINNER: {
    label: 'Dinner',
    icon: UtensilsCrossed,
    color: 'bg-orange-500',
    defaultTime: '5:30 PM',
  },
  EVENING_SNACK: {
    label: 'Evening Snack',
    icon: Apple,
    color: 'bg-pink-500',
    defaultTime: '6:30 PM',
  },
  EXTRA_SNACKS: {
    label: 'Extra Snacks',
    icon: LeafyGreen,
    color: 'bg-lime-500',
    defaultTime: '',
  },
}

function formatTime(time: string): string {
  if (!time) return ''
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

export function MealSlot({
  mealType,
  time,
  meal,
  onSelect,
  onRemove,
  onEdit,
  onMarkEaten,
  onMarkSkipped,
  darkMode = true,
  disabled = false,
  showTracking = true,
}: MealSlotProps) {
  const config = MEAL_TYPE_CONFIG[mealType]
  const displayTime = time ? formatTime(time) : config.defaultTime

  const hasMeal = !!meal
  const mealName = meal?.mealName || 'Unknown meal'
  const isEaten = meal?.eaten ?? false
  const isSkipped = meal?.skipped ?? false

  return (
    <div
      className={cn(
        'relative rounded-lg border-2 transition-all',
        hasMeal
          ? isEaten
            ? darkMode
              ? 'bg-green-900/30 border-green-700'
              : 'bg-green-50 border-green-300'
            : isSkipped
            ? darkMode
              ? 'bg-slate-800/50 border-slate-700 opacity-60'
              : 'bg-slate-100 border-slate-300 opacity-60'
            : darkMode
            ? 'bg-slate-800 border-slate-700'
            : 'bg-white border-slate-200'
          : darkMode
          ? 'bg-slate-800/50 border-dashed border-slate-700 hover:border-slate-600'
          : 'bg-slate-50 border-dashed border-slate-300 hover:border-slate-400',
        disabled && 'opacity-50 pointer-events-none'
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between px-3 py-2 border-b',
          darkMode ? 'border-slate-700' : 'border-slate-200'
        )}
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center',
              config.color
            )}
          >
            <config.icon className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p
              className={cn(
                'text-sm font-medium',
                darkMode ? 'text-slate-200' : 'text-slate-800'
              )}
            >
              {config.label}
            </p>
            <p
              className={cn(
                'text-xs',
                darkMode ? 'text-slate-500' : 'text-slate-400'
              )}
            >
              {displayTime}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {hasMeal && onEdit && (
            <button
              onClick={onEdit}
              className={cn(
                'p-1 rounded-sm hover:bg-slate-700/50',
                darkMode ? 'text-slate-400' : 'text-slate-500'
              )}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>
          )}
          {hasMeal && onRemove && (
            <button
              onClick={onRemove}
              className="p-1 rounded-sm hover:bg-red-500/20 text-red-400"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {hasMeal ? (
          <div>
            <p
              className={cn(
                'font-medium',
                darkMode ? 'text-white' : 'text-slate-900'
              )}
            >
              {mealName}
            </p>

            {/* Macros */}
            {(meal?.calories || meal?.protein) && (
              <div
                className={cn(
                  'flex flex-wrap gap-2 mt-2 text-xs',
                  darkMode ? 'text-slate-400' : 'text-slate-500'
                )}
              >
                {meal.calories && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    {Math.round(meal.calories)} cal
                  </span>
                )}
                {meal.protein && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    {Math.round(meal.protein)}g P
                  </span>
                )}
                {meal.netCarbs && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    {Math.round(meal.netCarbs)}g NC
                  </span>
                )}
                {meal.fat && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    {Math.round(meal.fat)}g F
                  </span>
                )}
              </div>
            )}

            {/* Leftover indicator */}
            {meal.isLeftover && (
              <div className="mt-2">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs',
                    'bg-yellow-500/20 text-yellow-400'
                  )}
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Leftover
                </span>
              </div>
            )}

            {/* Notes */}
            {meal.trackingNotes && (
              <p
                className={cn(
                  'mt-2 text-xs italic',
                  darkMode ? 'text-slate-500' : 'text-slate-400'
                )}
              >
                {meal.trackingNotes}
              </p>
            )}

            {/* Tracking Buttons */}
            {showTracking && (onMarkEaten || onMarkSkipped) && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700/50">
                {onMarkEaten && (
                  <button
                    onClick={() => onMarkEaten(!isEaten)}
                    className={cn(
                      'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
                      isEaten
                        ? 'bg-green-500 text-white'
                        : darkMode
                        ? 'bg-slate-700 text-slate-300 hover:bg-green-600 hover:text-white'
                        : 'bg-slate-200 text-slate-700 hover:bg-green-500 hover:text-white'
                    )}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {isEaten ? 'Eaten' : 'Mark Eaten'}
                  </button>
                )}
                {onMarkSkipped && !isEaten && (
                  <button
                    onClick={() => onMarkSkipped(!isSkipped)}
                    className={cn(
                      'py-2 px-3 rounded-lg text-sm transition-all',
                      isSkipped
                        ? 'bg-slate-600 text-slate-300'
                        : darkMode
                        ? 'bg-slate-700/50 text-slate-400 hover:bg-slate-600'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    )}
                  >
                    {isSkipped ? 'Skipped' : 'Skip'}
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onSelect}
            className={cn(
              'w-full py-4 flex flex-col items-center justify-center gap-2',
              'transition-colors rounded-lg',
              darkMode
                ? 'hover:bg-slate-700/50 text-slate-500'
                : 'hover:bg-slate-100 text-slate-400'
            )}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <span className="text-sm">Add {config.label}</span>
          </button>
        )}
      </div>
    </div>
  )
}

// Quick-add component for commonly used meals
interface QuickAddOption {
  name: string
  mealType: MealType
  calories: number
  protein: number
  netCarbs: number
  fat: number
}

interface QuickAddMealProps {
  options: QuickAddOption[]
  onSelect: (option: QuickAddOption) => void
  darkMode?: boolean
}

export function QuickAddMeal({ options, onSelect, darkMode = true }: QuickAddMealProps) {
  return (
    <div className="space-y-2">
      <p
        className={cn(
          'text-xs font-medium',
          darkMode ? 'text-slate-400' : 'text-slate-600'
        )}
      >
        Quick Add
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.name}
            onClick={() => onSelect(option)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs transition-colors',
              darkMode
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            )}
          >
            {option.name}
          </button>
        ))}
      </div>
    </div>
  )
}

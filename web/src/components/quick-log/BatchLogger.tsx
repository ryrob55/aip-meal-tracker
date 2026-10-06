'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MealEntry {
  mealType: string
  mealName: string
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
}

const MEAL_TYPES = [
  { value: 'MORNING_COFFEE', label: 'Morning Coffee' },
  { value: 'SMOOTHIE', label: 'Smoothie' },
  { value: 'LUNCH', label: 'Lunch' },
  { value: 'AFTERNOON_SNACK', label: 'Snack' },
  { value: 'DINNER', label: 'Dinner' },
  { value: 'EVENING_SNACK', label: 'Evening Snack' },
]

interface Props {
  date: string
  onSave: (meals: MealEntry[]) => void
  isSaving: boolean
  darkMode?: boolean
}

export function BatchLogger({ date, onSave, isSaving, darkMode = true }: Props) {
  const [meals, setMeals] = useState<MealEntry[]>([
    { mealType: 'LUNCH', mealName: '' },
  ])

  const addMeal = () => {
    setMeals([...meals, { mealType: 'DINNER', mealName: '' }])
  }

  const removeMeal = (index: number) => {
    setMeals(meals.filter((_, i) => i !== index))
  }

  const updateMeal = (index: number, field: keyof MealEntry, value: string | number) => {
    const updated = [...meals]
    updated[index] = { ...updated[index], [field]: value }
    setMeals(updated)
  }

  const handleSubmit = () => {
    const validMeals = meals.filter((m) => m.mealName.trim())
    if (validMeals.length > 0) {
      onSave(validMeals)
    }
  }

  return (
    <div
      className={cn(
        'p-4 rounded-xl',
        darkMode ? 'bg-slate-900' : 'bg-white border border-slate-200'
      )}
    >
      <h3 className="font-medium mb-3">
        Log today&apos;s meals
      </h3>

      <div className="space-y-3 mb-4">
        {meals.map((meal, index) => (
          <div
            key={index}
            className={cn(
              'p-3 rounded-lg',
              darkMode ? 'bg-slate-800' : 'bg-slate-50'
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <select
                value={meal.mealType}
                onChange={(e) => updateMeal(index, 'mealType', e.target.value)}
                className={cn(
                  'text-xs px-2 py-1 rounded-lg',
                  darkMode
                    ? 'bg-slate-700 border border-slate-600 text-white'
                    : 'bg-white border border-slate-300'
                )}
              >
                {MEAL_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {meals.length > 1 && (
                <button
                  onClick={() => removeMeal(index)}
                  className={cn(
                    'p-1 rounded-sm',
                    darkMode ? 'text-slate-600 hover:text-red-400' : 'text-slate-400 hover:text-red-500'
                  )}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <input
              type="text"
              placeholder="What did you eat?"
              value={meal.mealName}
              onChange={(e) => updateMeal(index, 'mealName', e.target.value)}
              className={cn(
                'w-full px-3 py-2 rounded-lg text-sm mb-2',
                darkMode
                  ? 'bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500'
                  : 'bg-white border border-slate-300 placeholder:text-slate-400'
              )}
            />

            <div className="grid grid-cols-4 gap-2">
              {(['calories', 'protein', 'carbs', 'fat'] as const).map((field) => (
                <div key={field}>
                  <label
                    className={cn(
                      'text-[10px] block mb-0.5',
                      darkMode ? 'text-slate-500' : 'text-slate-400'
                    )}
                  >
                    {field === 'calories' ? 'Cal' : field.charAt(0).toUpperCase() + field.slice(1)}
                  </label>
                  <input
                    type="number"
                    value={meal[field] ?? ''}
                    onChange={(e) =>
                      updateMeal(
                        index,
                        field,
                        e.target.value ? Number(e.target.value) : ''
                      )
                    }
                    className={cn(
                      'w-full px-2 py-1 rounded-sm text-xs',
                      darkMode
                        ? 'bg-slate-700 border border-slate-600 text-white'
                        : 'bg-white border border-slate-300'
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={addMeal}
          className={cn(
            'flex items-center gap-1 px-3 py-2 rounded-lg text-xs',
            darkMode
              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          )}
        >
          <Plus className="w-3.5 h-3.5" />
          Add meal
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSaving || meals.every((m) => !m.mealName.trim())}
          className={cn(
            'flex-1 py-2 rounded-lg text-sm font-medium text-white',
            isSaving || meals.every((m) => !m.mealName.trim())
              ? 'bg-green-500/50'
              : 'bg-green-500 hover:bg-green-600'
          )}
        >
          {isSaving ? 'Saving...' : 'Save All'}
        </button>
      </div>
    </div>
  )
}

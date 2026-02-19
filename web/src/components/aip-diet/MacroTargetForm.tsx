'use client'

import { cn } from '@/lib/utils'
import { useAIPQuestionnaire } from '@/contexts/AIPQuestionnaireContext'

interface Props {
  darkMode?: boolean
}

export function MacroTargetForm({ darkMode = true }: Props) {
  const { data, updateData } = useAIPQuestionnaire()

  const presets = [
    {
      name: 'Standard AIP',
      calories: 2000,
      protein: 100,
      netCarbs: 100,
      description: 'Moderate macros for maintenance',
    },
    {
      name: 'High Protein',
      calories: 2600,
      protein: 150,
      netCarbs: 80,
      description: 'Your current plan - optimal for muscle and satiety',
    },
    {
      name: 'Low Carb AIP',
      calories: 2200,
      protein: 130,
      netCarbs: 50,
      description: 'Stricter carb limit for inflammation',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Presets */}
      <div>
        <h3
          className={cn(
            'text-sm font-medium mb-3',
            darkMode ? 'text-slate-300' : 'text-slate-700'
          )}
        >
          Quick Presets
        </h3>
        <div className="grid gap-3">
          {presets.map((preset) => {
            const isSelected =
              data.dailyCalories === preset.calories &&
              data.dailyProtein === preset.protein &&
              data.dailyNetCarbs === preset.netCarbs

            return (
              <button
                key={preset.name}
                onClick={() =>
                  updateData({
                    dailyCalories: preset.calories,
                    dailyProtein: preset.protein,
                    dailyNetCarbs: preset.netCarbs,
                  })
                }
                className={cn(
                  'p-4 rounded-lg text-left transition-all',
                  isSelected
                    ? 'bg-green-500/20 border-2 border-green-500'
                    : darkMode
                    ? 'bg-slate-800 border-2 border-transparent hover:border-slate-600'
                    : 'bg-slate-100 border-2 border-transparent hover:border-slate-300'
                )}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span
                      className={cn(
                        'font-medium',
                        darkMode ? 'text-white' : 'text-slate-900'
                      )}
                    >
                      {preset.name}
                    </span>
                    <p
                      className={cn(
                        'text-xs mt-1',
                        darkMode ? 'text-slate-400' : 'text-slate-500'
                      )}
                    >
                      {preset.description}
                    </p>
                  </div>
                  {isSelected && (
                    <svg
                      className="w-5 h-5 text-green-500"
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
                  )}
                </div>
                <div className="flex gap-4 mt-2">
                  <span
                    className={cn(
                      'text-xs',
                      darkMode ? 'text-slate-500' : 'text-slate-400'
                    )}
                  >
                    {preset.calories} cal
                  </span>
                  <span
                    className={cn(
                      'text-xs',
                      darkMode ? 'text-slate-500' : 'text-slate-400'
                    )}
                  >
                    {preset.protein}g protein
                  </span>
                  <span
                    className={cn(
                      'text-xs',
                      darkMode ? 'text-slate-500' : 'text-slate-400'
                    )}
                  >
                    {preset.netCarbs}g net carbs
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom Values */}
      <div>
        <h3
          className={cn(
            'text-sm font-medium mb-3',
            darkMode ? 'text-slate-300' : 'text-slate-700'
          )}
        >
          Custom Targets
        </h3>

        <div className="grid gap-4">
          {/* Calories */}
          <div>
            <label
              className={cn(
                'block text-sm mb-2',
                darkMode ? 'text-slate-400' : 'text-slate-600'
              )}
            >
              Daily Calories
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1500"
                max="4000"
                step="100"
                value={data.dailyCalories}
                onChange={(e) =>
                  updateData({ dailyCalories: parseInt(e.target.value) })
                }
                className="flex-1 accent-green-500"
              />
              <input
                type="number"
                value={data.dailyCalories}
                onChange={(e) =>
                  updateData({ dailyCalories: parseInt(e.target.value) || 2000 })
                }
                className={cn(
                  'w-24 px-3 py-2 rounded-lg text-sm text-center',
                  darkMode
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'bg-white text-slate-900 border border-slate-300'
                )}
              />
            </div>
          </div>

          {/* Protein */}
          <div>
            <label
              className={cn(
                'block text-sm mb-2',
                darkMode ? 'text-slate-400' : 'text-slate-600'
              )}
            >
              Daily Protein (grams)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="50"
                max="250"
                step="5"
                value={data.dailyProtein}
                onChange={(e) =>
                  updateData({ dailyProtein: parseInt(e.target.value) })
                }
                className="flex-1 accent-blue-500"
              />
              <input
                type="number"
                value={data.dailyProtein}
                onChange={(e) =>
                  updateData({ dailyProtein: parseInt(e.target.value) || 100 })
                }
                className={cn(
                  'w-24 px-3 py-2 rounded-lg text-sm text-center',
                  darkMode
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'bg-white text-slate-900 border border-slate-300'
                )}
              />
            </div>
          </div>

          {/* Net Carbs */}
          <div>
            <label
              className={cn(
                'block text-sm mb-2',
                darkMode ? 'text-slate-400' : 'text-slate-600'
              )}
            >
              Daily Net Carbs (grams) - Limit
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="20"
                max="200"
                step="5"
                value={data.dailyNetCarbs}
                onChange={(e) =>
                  updateData({ dailyNetCarbs: parseInt(e.target.value) })
                }
                className="flex-1 accent-orange-500"
              />
              <input
                type="number"
                value={data.dailyNetCarbs}
                onChange={(e) =>
                  updateData({ dailyNetCarbs: parseInt(e.target.value) || 80 })
                }
                className={cn(
                  'w-24 px-3 py-2 rounded-lg text-sm text-center',
                  darkMode
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'bg-white text-slate-900 border border-slate-300'
                )}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div
        className={cn(
          'p-4 rounded-lg',
          darkMode ? 'bg-slate-800' : 'bg-slate-100'
        )}
      >
        <h4
          className={cn(
            'text-sm font-medium mb-3',
            darkMode ? 'text-slate-300' : 'text-slate-700'
          )}
        >
          Daily Target Summary
        </h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p
              className={cn(
                'text-2xl font-bold',
                darkMode ? 'text-green-400' : 'text-green-600'
              )}
            >
              {data.dailyCalories}
            </p>
            <p
              className={cn(
                'text-xs',
                darkMode ? 'text-slate-500' : 'text-slate-500'
              )}
            >
              Calories
            </p>
          </div>
          <div>
            <p
              className={cn(
                'text-2xl font-bold',
                darkMode ? 'text-blue-400' : 'text-blue-600'
              )}
            >
              {data.dailyProtein}g
            </p>
            <p
              className={cn(
                'text-xs',
                darkMode ? 'text-slate-500' : 'text-slate-500'
              )}
            >
              Protein
            </p>
          </div>
          <div>
            <p
              className={cn(
                'text-2xl font-bold',
                darkMode ? 'text-orange-400' : 'text-orange-600'
              )}
            >
              ≤{data.dailyNetCarbs}g
            </p>
            <p
              className={cn(
                'text-xs',
                darkMode ? 'text-slate-500' : 'text-slate-500'
              )}
            >
              Net Carbs
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

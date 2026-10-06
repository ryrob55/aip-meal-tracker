'use client'

import { Salad } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useAIPQuestionnaire,
  HEALTH_GOALS,
  PROTEIN_OPTIONS,
} from '@/contexts/AIPQuestionnaireContext'
import { ProgressIndicator } from './ProgressIndicator'
import { RestrictionSelector } from './RestrictionSelector'
import { MacroTargetForm } from './MacroTargetForm'
import { FastingWindowPicker } from './FastingWindowPicker'

interface Props {
  onComplete?: () => void
  darkMode?: boolean
}

export function QuestionnaireWizard({ onComplete, darkMode = true }: Props) {
  const {
    currentStep,
    data,
    updateData,
    goNext,
    goPrev,
    canGoNext,
    canGoPrev,
    isSubmitting,
    submitQuestionnaire,
  } = useAIPQuestionnaire()

  const handleComplete = async () => {
    await submitQuestionnaire()
    onComplete?.()
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Progress bar */}
      <div
        className={cn(
          'sticky top-0 z-10 px-4 py-3',
          darkMode ? 'bg-slate-900' : 'bg-white'
        )}
      >
        <ProgressIndicator currentStep={currentStep} darkMode={darkMode} />
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="max-w-lg mx-auto">
          {/* Welcome Step */}
          {currentStep === 'welcome' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                <Salad className="w-10 h-10 text-green-500" />
              </div>
              <h1
                className={cn(
                  'text-2xl font-bold mb-4',
                  darkMode ? 'text-white' : 'text-slate-900'
                )}
              >
                AIP Diet Setup
              </h1>
              <p
                className={cn(
                  'text-sm mb-8',
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                )}
              >
                Let&apos;s set up your personalized AIP meal plan. We&apos;ll capture your
                restrictions, macro targets, and eating schedule.
              </p>
              <div
                className={cn(
                  'p-4 rounded-lg text-left space-y-3',
                  darkMode ? 'bg-slate-800' : 'bg-slate-100'
                )}
              >
                <p
                  className={cn(
                    'text-sm font-medium',
                    darkMode ? 'text-slate-300' : 'text-slate-700'
                  )}
                >
                  What we&apos;ll set up:
                </p>
                <ul className="space-y-2 text-sm">
                  {[
                    'Food restrictions & sensitivities',
                    'Health goals',
                    'Daily macro targets',
                    'Intermittent fasting schedule',
                    'Protein & meal preferences',
                  ].map((item) => (
                    <li
                      key={item}
                      className={cn(
                        'flex items-center gap-2',
                        darkMode ? 'text-slate-400' : 'text-slate-600'
                      )}
                    >
                      <svg
                        className="w-4 h-4 text-green-500"
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
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Restrictions Step */}
          {currentStep === 'restrictions' && (
            <div>
              <h2
                className={cn(
                  'text-xl font-bold mb-2',
                  darkMode ? 'text-white' : 'text-slate-900'
                )}
              >
                Food Restrictions
              </h2>
              <p
                className={cn(
                  'text-sm mb-6',
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                )}
              >
                Select foods you need to avoid. Standard AIP eliminations are
                pre-selected.
              </p>
              <RestrictionSelector darkMode={darkMode} />
            </div>
          )}

          {/* Goals Step */}
          {currentStep === 'goals' && (
            <div>
              <h2
                className={cn(
                  'text-xl font-bold mb-2',
                  darkMode ? 'text-white' : 'text-slate-900'
                )}
              >
                Health Goals
              </h2>
              <p
                className={cn(
                  'text-sm mb-6',
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                )}
              >
                What are you hoping to achieve with AIP?
              </p>

              <div className="grid gap-3">
                {HEALTH_GOALS.map((goal) => {
                  const isSelected = data.healthGoals.includes(goal.id)

                  return (
                    <button
                      key={goal.id}
                      onClick={() => {
                        if (isSelected) {
                          updateData({
                            healthGoals: data.healthGoals.filter(
                              (g) => g !== goal.id
                            ),
                          })
                        } else {
                          updateData({
                            healthGoals: [...data.healthGoals, goal.id],
                          })
                        }
                      }}
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
                            {goal.label}
                          </span>
                          <p
                            className={cn(
                              'text-xs mt-1',
                              darkMode ? 'text-slate-500' : 'text-slate-500'
                            )}
                          >
                            {goal.description}
                          </p>
                        </div>
                        <div
                          className={cn(
                            'w-5 h-5 rounded-full flex items-center justify-center',
                            isSelected
                              ? 'bg-green-500'
                              : darkMode
                              ? 'border-2 border-slate-600'
                              : 'border-2 border-slate-400'
                          )}
                        >
                          {isSelected && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Macros Step */}
          {currentStep === 'macros' && (
            <div>
              <h2
                className={cn(
                  'text-xl font-bold mb-2',
                  darkMode ? 'text-white' : 'text-slate-900'
                )}
              >
                Macro Targets
              </h2>
              <p
                className={cn(
                  'text-sm mb-6',
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                )}
              >
                Set your daily calorie, protein, and carbohydrate goals.
              </p>
              <MacroTargetForm darkMode={darkMode} />
            </div>
          )}

          {/* Fasting Step */}
          {currentStep === 'fasting' && (
            <div>
              <h2
                className={cn(
                  'text-xl font-bold mb-2',
                  darkMode ? 'text-white' : 'text-slate-900'
                )}
              >
                Eating Schedule
              </h2>
              <p
                className={cn(
                  'text-sm mb-6',
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                )}
              >
                Configure your intermittent fasting window and meal timing.
              </p>
              <FastingWindowPicker darkMode={darkMode} />
            </div>
          )}

          {/* Preferences Step */}
          {currentStep === 'preferences' && (
            <div>
              <h2
                className={cn(
                  'text-xl font-bold mb-2',
                  darkMode ? 'text-white' : 'text-slate-900'
                )}
              >
                Food Preferences
              </h2>
              <p
                className={cn(
                  'text-sm mb-6',
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                )}
              >
                Select your preferred proteins and configure leftover rules.
              </p>

              {/* Preferred Proteins */}
              <div className="mb-6">
                <h3
                  className={cn(
                    'text-sm font-medium mb-3',
                    darkMode ? 'text-slate-300' : 'text-slate-700'
                  )}
                >
                  Preferred Proteins
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {PROTEIN_OPTIONS.map((protein) => {
                    const isSelected = data.preferredProteins.includes(protein.id)

                    return (
                      <button
                        key={protein.id}
                        onClick={() => {
                          if (isSelected) {
                            updateData({
                              preferredProteins: data.preferredProteins.filter(
                                (p) => p !== protein.id
                              ),
                            })
                          } else {
                            updateData({
                              preferredProteins: [
                                ...data.preferredProteins,
                                protein.id,
                              ],
                            })
                          }
                        }}
                        className={cn(
                          'p-3 rounded-lg text-left transition-all',
                          isSelected
                            ? 'bg-blue-500/20 border-2 border-blue-500'
                            : darkMode
                            ? 'bg-slate-800 border-2 border-transparent hover:border-slate-600'
                            : 'bg-slate-100 border-2 border-transparent hover:border-slate-300'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              'w-4 h-4 rounded-sm border-2 flex items-center justify-center',
                              isSelected
                                ? 'bg-blue-500 border-blue-500'
                                : darkMode
                                ? 'border-slate-600'
                                : 'border-slate-400'
                            )}
                          >
                            {isSelected && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                          <span
                            className={cn(
                              'text-sm',
                              darkMode ? 'text-slate-200' : 'text-slate-800'
                            )}
                          >
                            {protein.label}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Leftover Rules */}
              <div>
                <h3
                  className={cn(
                    'text-sm font-medium mb-3',
                    darkMode ? 'text-slate-300' : 'text-slate-700'
                  )}
                >
                  Leftover Rules (Tyramine Safety)
                </h3>

                <div
                  className={cn(
                    'p-4 rounded-lg',
                    darkMode ? 'bg-slate-800' : 'bg-slate-100'
                  )}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span
                        className={cn(
                          'text-sm font-medium',
                          darkMode ? 'text-slate-200' : 'text-slate-800'
                        )}
                      >
                        Allow Leftovers
                      </span>
                      <p
                        className={cn(
                          'text-xs',
                          darkMode ? 'text-slate-500' : 'text-slate-500'
                        )}
                      >
                        Use yesterday&apos;s dinner for today&apos;s lunch
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        updateData({ allowLeftovers: !data.allowLeftovers })
                      }
                      className={cn(
                        'w-12 h-6 rounded-full transition-colors relative',
                        data.allowLeftovers ? 'bg-green-500' : 'bg-slate-600'
                      )}
                    >
                      <div
                        className={cn(
                          'w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform',
                          data.allowLeftovers ? 'translate-x-6' : 'translate-x-0.5'
                        )}
                      />
                    </button>
                  </div>

                  {data.allowLeftovers && (
                    <div>
                      <label
                        className={cn(
                          'block text-xs mb-2',
                          darkMode ? 'text-slate-400' : 'text-slate-600'
                        )}
                      >
                        Maximum leftover age (hours)
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="12"
                          max="48"
                          step="4"
                          value={data.maxLeftoverHours}
                          onChange={(e) =>
                            updateData({
                              maxLeftoverHours: parseInt(e.target.value),
                            })
                          }
                          className="flex-1 accent-green-500"
                        />
                        <span
                          className={cn(
                            'text-sm font-medium w-12 text-center',
                            darkMode ? 'text-slate-200' : 'text-slate-800'
                          )}
                        >
                          {data.maxLeftoverHours}h
                        </span>
                      </div>
                      <p
                        className={cn(
                          'text-xs mt-2',
                          darkMode ? 'text-yellow-500/80' : 'text-yellow-600'
                        )}
                      >
                        24 hours recommended for tyramine sensitivity
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Review Step */}
          {currentStep === 'review' && (
            <div>
              <h2
                className={cn(
                  'text-xl font-bold mb-2',
                  darkMode ? 'text-white' : 'text-slate-900'
                )}
              >
                Review Your Settings
              </h2>
              <p
                className={cn(
                  'text-sm mb-6',
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                )}
              >
                Make sure everything looks correct before saving.
              </p>

              <div className="space-y-4">
                {/* Macros Summary */}
                <div
                  className={cn(
                    'p-4 rounded-lg',
                    darkMode ? 'bg-slate-800' : 'bg-slate-100'
                  )}
                >
                  <h3
                    className={cn(
                      'text-sm font-medium mb-3',
                      darkMode ? 'text-slate-300' : 'text-slate-700'
                    )}
                  >
                    Daily Targets
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p
                        className={cn(
                          'text-xl font-bold',
                          darkMode ? 'text-green-400' : 'text-green-600'
                        )}
                      >
                        {data.dailyCalories}
                      </p>
                      <p className="text-xs text-slate-500">Calories</p>
                    </div>
                    <div>
                      <p
                        className={cn(
                          'text-xl font-bold',
                          darkMode ? 'text-blue-400' : 'text-blue-600'
                        )}
                      >
                        {data.dailyProtein}g
                      </p>
                      <p className="text-xs text-slate-500">Protein</p>
                    </div>
                    <div>
                      <p
                        className={cn(
                          'text-xl font-bold',
                          darkMode ? 'text-orange-400' : 'text-orange-600'
                        )}
                      >
                        ≤{data.dailyNetCarbs}g
                      </p>
                      <p className="text-xs text-slate-500">Net Carbs</p>
                    </div>
                  </div>
                </div>

                {/* Eating Window */}
                <div
                  className={cn(
                    'p-4 rounded-lg',
                    darkMode ? 'bg-slate-800' : 'bg-slate-100'
                  )}
                >
                  <h3
                    className={cn(
                      'text-sm font-medium mb-2',
                      darkMode ? 'text-slate-300' : 'text-slate-700'
                    )}
                  >
                    Eating Window
                  </h3>
                  <p
                    className={cn(
                      'text-lg font-bold',
                      darkMode ? 'text-purple-400' : 'text-purple-600'
                    )}
                  >
                    {data.eatingWindowStart} - {data.eatingWindowEnd}
                  </p>
                </div>

                {/* Restrictions */}
                <div
                  className={cn(
                    'p-4 rounded-lg',
                    darkMode ? 'bg-slate-800' : 'bg-slate-100'
                  )}
                >
                  <h3
                    className={cn(
                      'text-sm font-medium mb-2',
                      darkMode ? 'text-slate-300' : 'text-slate-700'
                    )}
                  >
                    Restrictions ({data.restrictions.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {data.restrictions.slice(0, 8).map((r) => (
                      <span
                        key={r.foodName}
                        className="px-2 py-0.5 rounded-sm text-xs bg-red-500/20 text-red-400"
                      >
                        {r.foodName}
                      </span>
                    ))}
                    {data.restrictions.length > 8 && (
                      <span className="px-2 py-0.5 rounded-sm text-xs bg-slate-700 text-slate-400">
                        +{data.restrictions.length - 8} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Health Goals */}
                <div
                  className={cn(
                    'p-4 rounded-lg',
                    darkMode ? 'bg-slate-800' : 'bg-slate-100'
                  )}
                >
                  <h3
                    className={cn(
                      'text-sm font-medium mb-2',
                      darkMode ? 'text-slate-300' : 'text-slate-700'
                    )}
                  >
                    Health Goals
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {data.healthGoals.map((goalId) => {
                      const goal = HEALTH_GOALS.find((g) => g.id === goalId)
                      return (
                        <span
                          key={goalId}
                          className="px-2 py-0.5 rounded-sm text-xs bg-green-500/20 text-green-400"
                        >
                          {goal?.label || goalId}
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Navigation */}
      <div
        className={cn(
          'sticky bottom-0 px-4 py-4 border-t',
          darkMode
            ? 'bg-slate-900 border-slate-800'
            : 'bg-white border-slate-200'
        )}
      >
        <div className="max-w-lg mx-auto flex gap-3">
          {canGoPrev && (
            <button
              onClick={goPrev}
              className={cn(
                'flex-1 py-3 rounded-lg font-medium transition-colors',
                darkMode
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              )}
            >
              Back
            </button>
          )}

          {canGoNext ? (
            <button
              onClick={goNext}
              className="flex-1 py-3 rounded-lg font-medium bg-green-500 text-white hover:bg-green-600 transition-colors"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={isSubmitting}
              className={cn(
                'flex-1 py-3 rounded-lg font-medium transition-colors',
                isSubmitting
                  ? 'bg-slate-600 text-slate-400'
                  : 'bg-green-500 text-white hover:bg-green-600'
              )}
            >
              {isSubmitting ? 'Saving...' : 'Save & Complete'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

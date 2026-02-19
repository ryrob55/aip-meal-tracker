'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { AIPRestrictionType, AIPSeverity } from '@prisma/client'
import {
  useAIPQuestionnaire,
  COMMON_RESTRICTIONS,
  TYRAMINE_RESTRICTIONS,
  type RestrictionInput,
} from '@/contexts/AIPQuestionnaireContext'

interface Props {
  darkMode?: boolean
}

const RESTRICTION_TYPES: { value: AIPRestrictionType; label: string }[] = [
  { value: 'AVOID', label: 'Avoid (AIP)' },
  { value: 'ALLERGY', label: 'Allergy' },
  { value: 'INTOLERANCE', label: 'Intolerance' },
  { value: 'MIGRAINE_TRIGGER', label: 'Migraine Trigger' },
  { value: 'HIGH_TYRAMINE', label: 'High Tyramine' },
  { value: 'HIGH_HISTAMINE', label: 'High Histamine' },
]

const SEVERITY_OPTIONS: { value: AIPSeverity; label: string; color: string }[] = [
  { value: 'MILD', label: 'Mild', color: 'bg-yellow-500' },
  { value: 'MODERATE', label: 'Moderate', color: 'bg-orange-500' },
  { value: 'SEVERE', label: 'Severe', color: 'bg-red-500' },
]

export function RestrictionSelector({ darkMode = true }: Props) {
  const { data, addRestriction, removeRestriction } = useAIPQuestionnaire()
  const [customFood, setCustomFood] = useState('')
  const [showTyramine, setShowTyramine] = useState(false)

  const isSelected = (foodName: string) =>
    data.restrictions.some((r) => r.foodName === foodName)

  const toggleRestriction = (
    foodName: string,
    type: AIPRestrictionType = 'AVOID',
    severity: AIPSeverity = 'SEVERE'
  ) => {
    if (isSelected(foodName)) {
      removeRestriction(foodName)
    } else {
      addRestriction({ foodName, restrictionType: type, severity })
    }
  }

  const addCustomRestriction = () => {
    if (customFood.trim() && !isSelected(customFood.trim())) {
      addRestriction({
        foodName: customFood.trim(),
        restrictionType: 'AVOID',
        severity: 'MODERATE',
      })
      setCustomFood('')
    }
  }

  return (
    <div className="space-y-6">
      {/* Standard AIP Restrictions */}
      <div>
        <h3
          className={cn(
            'text-sm font-medium mb-3',
            darkMode ? 'text-slate-300' : 'text-slate-700'
          )}
        >
          Standard AIP Eliminations
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {COMMON_RESTRICTIONS.map((item) => (
            <button
              key={item.foodName}
              onClick={() => toggleRestriction(item.foodName, 'AVOID', 'SEVERE')}
              className={cn(
                'p-3 rounded-lg text-left transition-all',
                isSelected(item.foodName)
                  ? 'bg-red-500/20 border-2 border-red-500'
                  : darkMode
                  ? 'bg-slate-800 border-2 border-transparent hover:border-slate-600'
                  : 'bg-slate-100 border-2 border-transparent hover:border-slate-300'
              )}
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-4 h-4 rounded border-2 flex items-center justify-center',
                    isSelected(item.foodName)
                      ? 'bg-red-500 border-red-500'
                      : darkMode
                      ? 'border-slate-600'
                      : 'border-slate-400'
                  )}
                >
                  {isSelected(item.foodName) && (
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
                    'font-medium text-sm',
                    darkMode ? 'text-slate-200' : 'text-slate-800'
                  )}
                >
                  {item.foodName}
                </span>
              </div>
              <p
                className={cn(
                  'text-xs mt-1 ml-6',
                  darkMode ? 'text-slate-500' : 'text-slate-500'
                )}
              >
                {item.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Tyramine Restrictions Toggle */}
      <div>
        <button
          onClick={() => setShowTyramine(!showTyramine)}
          className={cn(
            'flex items-center gap-2 text-sm font-medium',
            darkMode ? 'text-blue-400' : 'text-blue-600'
          )}
        >
          <svg
            className={cn('w-4 h-4 transition-transform', showTyramine && 'rotate-90')}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          Tyramine-Sensitive (for migraines)
        </button>

        {showTyramine && (
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TYRAMINE_RESTRICTIONS.map((item) => (
              <button
                key={item.foodName}
                onClick={() =>
                  toggleRestriction(item.foodName, 'HIGH_TYRAMINE', 'SEVERE')
                }
                className={cn(
                  'p-3 rounded-lg text-left transition-all',
                  isSelected(item.foodName)
                    ? 'bg-orange-500/20 border-2 border-orange-500'
                    : darkMode
                    ? 'bg-slate-800 border-2 border-transparent hover:border-slate-600'
                    : 'bg-slate-100 border-2 border-transparent hover:border-slate-300'
                )}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-4 h-4 rounded border-2 flex items-center justify-center',
                      isSelected(item.foodName)
                        ? 'bg-orange-500 border-orange-500'
                        : darkMode
                        ? 'border-slate-600'
                        : 'border-slate-400'
                    )}
                  >
                    {isSelected(item.foodName) && (
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
                      'font-medium text-sm',
                      darkMode ? 'text-slate-200' : 'text-slate-800'
                    )}
                  >
                    {item.foodName}
                  </span>
                </div>
                <p
                  className={cn(
                    'text-xs mt-1 ml-6',
                    darkMode ? 'text-slate-500' : 'text-slate-500'
                  )}
                >
                  {item.description}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Custom Restriction */}
      <div>
        <h3
          className={cn(
            'text-sm font-medium mb-3',
            darkMode ? 'text-slate-300' : 'text-slate-700'
          )}
        >
          Add Custom Restriction
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={customFood}
            onChange={(e) => setCustomFood(e.target.value)}
            placeholder="Food name..."
            className={cn(
              'flex-1 px-3 py-2 rounded-lg text-sm',
              darkMode
                ? 'bg-slate-800 text-white placeholder-slate-500 border border-slate-700'
                : 'bg-white text-slate-900 placeholder-slate-400 border border-slate-300'
            )}
            onKeyDown={(e) => e.key === 'Enter' && addCustomRestriction()}
          />
          <button
            onClick={addCustomRestriction}
            disabled={!customFood.trim()}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              customFood.trim()
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : darkMode
                ? 'bg-slate-700 text-slate-500'
                : 'bg-slate-200 text-slate-400'
            )}
          >
            Add
          </button>
        </div>
      </div>

      {/* Selected Restrictions Summary */}
      {data.restrictions.length > 0 && (
        <div>
          <h3
            className={cn(
              'text-sm font-medium mb-3',
              darkMode ? 'text-slate-300' : 'text-slate-700'
            )}
          >
            Your Restrictions ({data.restrictions.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.restrictions.map((restriction) => (
              <span
                key={restriction.foodName}
                className={cn(
                  'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm',
                  restriction.restrictionType === 'HIGH_TYRAMINE'
                    ? 'bg-orange-500/20 text-orange-300'
                    : 'bg-red-500/20 text-red-300'
                )}
              >
                {restriction.foodName}
                <button
                  onClick={() => removeRestriction(restriction.foodName)}
                  className="ml-1 hover:text-white"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

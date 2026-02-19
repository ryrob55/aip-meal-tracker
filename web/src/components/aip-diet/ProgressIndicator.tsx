'use client'

import { cn } from '@/lib/utils'
import type { QuestionnaireStep } from '@/contexts/AIPQuestionnaireContext'

interface Props {
  currentStep: QuestionnaireStep
  darkMode?: boolean
}

const STEPS: { step: QuestionnaireStep; label: string }[] = [
  { step: 'welcome', label: 'Start' },
  { step: 'restrictions', label: 'Restrictions' },
  { step: 'goals', label: 'Goals' },
  { step: 'macros', label: 'Macros' },
  { step: 'fasting', label: 'Fasting' },
  { step: 'preferences', label: 'Preferences' },
  { step: 'review', label: 'Review' },
]

export function ProgressIndicator({ currentStep, darkMode = true }: Props) {
  const currentIndex = STEPS.findIndex((s) => s.step === currentStep)

  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="relative">
        <div
          className={cn(
            'h-1 rounded-full',
            darkMode ? 'bg-slate-700' : 'bg-slate-200'
          )}
        >
          <div
            className="h-1 rounded-full bg-green-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step labels - mobile: show current only, desktop: show all */}
      <div className="mt-2 sm:hidden">
        <p
          className={cn(
            'text-sm font-medium text-center',
            darkMode ? 'text-slate-300' : 'text-slate-600'
          )}
        >
          Step {currentIndex + 1} of {STEPS.length}: {STEPS[currentIndex].label}
        </p>
      </div>

      <div className="hidden sm:flex justify-between mt-3">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentIndex
          const isCurrent = index === currentIndex

          return (
            <div key={step.step} className="flex flex-col items-center">
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                  isCompleted && 'bg-green-500 text-white',
                  isCurrent && 'bg-blue-500 text-white',
                  !isCompleted &&
                    !isCurrent &&
                    (darkMode
                      ? 'bg-slate-700 text-slate-400'
                      : 'bg-slate-200 text-slate-500')
                )}
              >
                {isCompleted ? (
                  <svg
                    className="w-3 h-3"
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
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  'mt-1 text-xs',
                  isCurrent
                    ? darkMode
                      ? 'text-white font-medium'
                      : 'text-slate-900 font-medium'
                    : darkMode
                    ? 'text-slate-500'
                    : 'text-slate-400'
                )}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

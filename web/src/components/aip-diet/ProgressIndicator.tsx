'use client'

import { cn } from '@/lib/utils'
import type { QuestionnaireStep } from '@/contexts/AIPQuestionnaireContext'

// Default step labels
const DEFAULT_STEP_LABELS: Record<QuestionnaireStep, string> = {
  welcome: 'Start',
  aip_explainer: 'About AIP',
  variant: 'Protocol',
  experience: 'Experience',
  restrictions: 'Restrictions',
  goals: 'Goals',
  macros: 'Macros',
  fasting: 'Fasting',
  preferences: 'Preferences',
  ai_setup: 'AI Setup',
  review: 'Review',
}

interface Props {
  currentStep: QuestionnaireStep
  darkMode?: boolean
  steps?: { step: QuestionnaireStep; label: string }[]
  stepOrder?: QuestionnaireStep[]
}

export function ProgressIndicator({ currentStep, darkMode = true, steps, stepOrder }: Props) {
  // Build steps list from either explicit steps, stepOrder, or fallback
  const resolvedSteps = steps
    ? steps
    : stepOrder
    ? stepOrder.map((s) => ({ step: s, label: DEFAULT_STEP_LABELS[s] || s }))
    : [
        { step: 'welcome' as const, label: 'Start' },
        { step: 'restrictions' as const, label: 'Restrictions' },
        { step: 'goals' as const, label: 'Goals' },
        { step: 'macros' as const, label: 'Macros' },
        { step: 'fasting' as const, label: 'Fasting' },
        { step: 'preferences' as const, label: 'Preferences' },
        { step: 'review' as const, label: 'Review' },
      ]

  const currentIndex = resolvedSteps.findIndex((s) => s.step === currentStep)

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
            style={{ width: `${((currentIndex + 1) / resolvedSteps.length) * 100}%` }}
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
          Step {currentIndex + 1} of {resolvedSteps.length}: {resolvedSteps[currentIndex]?.label}
        </p>
      </div>

      <div className="hidden sm:flex justify-between mt-3">
        {resolvedSteps.map((step, index) => {
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

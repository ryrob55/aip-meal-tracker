'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useAIPQuestionnaire } from '@/contexts/AIPQuestionnaireContext'
import { RestrictionSelector } from '@/components/aip-diet/RestrictionSelector'
import { MacroTargetForm } from '@/components/aip-diet/MacroTargetForm'

interface Props {
  onComplete?: () => void
  darkMode?: boolean
}

export function StreamlinedOnboarding({ onComplete, darkMode = true }: Props) {
  const {
    currentStep,
    stepOrder,
    transitionDirection,
    data,
    updateData,
    goNext,
    goPrev,
    canGoNext,
    canGoPrev,
    isSubmitting,
    submitQuestionnaire,
  } = useAIPQuestionnaire()

  const currentIndex = stepOrder.indexOf(currentStep)
  const totalSteps = stepOrder.length

  const handleComplete = async () => {
    await submitQuestionnaire()
    onComplete?.()
  }

  const animationClass =
    transitionDirection === 'forward'
      ? 'onboarding-slide-forward'
      : 'onboarding-slide-back'

  // Welcome and done steps have inline buttons -- no footer nav needed
  const showFooter = currentStep !== 'welcome' && currentStep !== 'review'

  return (
    <div
      className={cn(
        'min-h-screen flex flex-col',
        darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'
      )}
    >
      {/* Progress bar */}
      {showFooter && (
        <div className="px-5 pt-5">
          <div
            className={cn(
              'h-1 rounded-full overflow-hidden',
              darkMode ? 'bg-slate-800' : 'bg-slate-200'
            )}
          >
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-500 ease-out"
              style={{ width: `${((currentIndex + 1) / totalSteps) * 100}%` }}
            />
          </div>
          <p
            className={cn(
              'text-xs mt-2',
              darkMode ? 'text-slate-500' : 'text-slate-400'
            )}
          >
            Step {currentIndex + 1} of {totalSteps}
          </p>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div
          key={currentStep}
          className={cn('w-full max-w-lg', animationClass)}
        >
          {currentStep === 'welcome' && (
            <WelcomeContent darkMode={darkMode} onContinue={goNext} />
          )}
          {currentStep === 'experience' && (
            <ExperienceContent
              darkMode={darkMode}
              value={data.experienceLevel}
              onChange={(v) => updateData({ experienceLevel: v })}
            />
          )}
          {currentStep === 'variant' && (
            <VariantContent
              darkMode={darkMode}
              value={data.aipVariant}
              onChange={(v) => updateData({ aipVariant: v })}
            />
          )}
          {currentStep === 'restrictions' && (
            <RestrictionsContent darkMode={darkMode} variant={data.aipVariant} />
          )}
          {currentStep === 'macros' && <MacrosContent darkMode={darkMode} />}
          {currentStep === 'review' && (
            <DoneContent
              darkMode={darkMode}
              data={data}
              isSubmitting={isSubmitting}
              onComplete={handleComplete}
            />
          )}
        </div>
      </div>

      {/* Footer navigation */}
      {showFooter && (
        <div className="px-6 pb-8 pt-4">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            {canGoPrev ? (
              <button
                onClick={goPrev}
                className={cn(
                  'text-base font-medium transition-colors',
                  darkMode
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {canGoNext ? (
              <button
                onClick={goNext}
                className="bg-green-500 hover:bg-green-600 text-white rounded-xl px-8 py-3 text-base font-semibold transition-colors"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={isSubmitting}
                className={cn(
                  'rounded-xl px-8 py-3 text-base font-semibold transition-colors',
                  isSubmitting
                    ? 'bg-slate-600 text-slate-400'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                )}
              >
                {isSubmitting ? 'Saving...' : 'Start Tracking'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ──────────── Step Content Components ──────────── */

function WelcomeContent({
  darkMode,
  onContinue,
}: {
  darkMode: boolean
  onContinue: () => void
}) {
  return (
    <div className="text-center">
      {/* App logo */}
      <div className="mb-10 welcome-icon-enter">
        <Image
          src="/AIP_logo.png"
          alt="AIP Tracker"
          width={180}
          height={180}
          className="mx-auto"
          priority
        />
      </div>

      <h1
        className={cn(
          'text-3xl sm:text-4xl font-bold mb-3 welcome-text-enter-1',
          darkMode ? 'text-white' : 'text-slate-900'
        )}
      >
        Let&apos;s get you started
      </h1>
      <p
        className={cn(
          'text-base sm:text-lg max-w-sm mx-auto mb-10 leading-relaxed welcome-text-enter-2',
          darkMode ? 'text-slate-400' : 'text-slate-500'
        )}
      >
        We&apos;ll personalize your AIP plan in about 2 minutes.
        You can always adjust everything later.
      </p>

      <div className="welcome-text-enter-3">
        <button
          onClick={onContinue}
          className="bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-xl px-10 py-3.5 text-lg font-semibold transition-colors"
        >
          Let&apos;s Go
        </button>
      </div>
    </div>
  )
}

function ExperienceContent({
  darkMode,
  value,
  onChange,
}: {
  darkMode: boolean
  value: string
  onChange: (v: 'BEGINNER' | 'SOME_KNOWLEDGE' | 'EXPERIENCED') => void
}) {
  const options = [
    {
      id: 'BEGINNER' as const,
      label: 'Brand New',
      description: "I'm just getting started with AIP",
    },
    {
      id: 'SOME_KNOWLEDGE' as const,
      label: 'Some Knowledge',
      description: "I've read about AIP or tried parts of it",
    },
    {
      id: 'EXPERIENCED' as const,
      label: 'Experienced',
      description: "I've followed AIP before and know the basics",
    },
  ]

  return (
    <div>
      <h2
        className={cn(
          'text-2xl sm:text-3xl font-bold mb-2',
          darkMode ? 'text-white' : 'text-slate-900'
        )}
      >
        How familiar are you with AIP?
      </h2>
      <p
        className={cn(
          'text-base mb-8',
          darkMode ? 'text-slate-400' : 'text-slate-600'
        )}
      >
        This helps us tailor the experience for you.
      </p>
      <div className="space-y-3">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={cn(
              'w-full text-left p-5 rounded-xl border transition-all',
              value === opt.id
                ? darkMode
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-green-500 bg-green-50'
                : darkMode
                  ? 'border-slate-700 bg-slate-800 hover:border-slate-600'
                  : 'border-slate-200 bg-white hover:border-slate-300'
            )}
          >
            <span
              className={cn(
                'text-lg font-semibold block',
                darkMode ? 'text-white' : 'text-slate-900'
              )}
            >
              {opt.label}
            </span>
            <span
              className={cn(
                'text-sm mt-1 block',
                darkMode ? 'text-slate-400' : 'text-slate-500'
              )}
            >
              {opt.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function VariantContent({
  darkMode,
  value,
  onChange,
}: {
  darkMode: boolean
  value: string
  onChange: (v: 'STANDARD' | 'MODIFIED_2024') => void
}) {
  const options = [
    {
      id: 'STANDARD' as const,
      label: 'Standard AIP',
      badge: 'Recommended',
      bullets: [
        'Full elimination phase',
        'Well-established protocol',
        'Widest recipe support',
      ],
    },
    {
      id: 'MODIFIED_2024' as const,
      label: 'Modified AIP (2024)',
      badge: null,
      bullets: [
        'Updated research-based approach',
        'Some foods reintroduced earlier',
        'More flexible starting point',
      ],
    },
  ]

  return (
    <div>
      <h2
        className={cn(
          'text-2xl sm:text-3xl font-bold mb-2',
          darkMode ? 'text-white' : 'text-slate-900'
        )}
      >
        Which protocol fits you best?
      </h2>
      <p
        className={cn(
          'text-base mb-8',
          darkMode ? 'text-slate-400' : 'text-slate-600'
        )}
      >
        Both are effective. You can switch anytime.
      </p>
      <div className="space-y-3">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={cn(
              'w-full text-left p-5 rounded-xl border transition-all',
              value === opt.id
                ? darkMode
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-green-500 bg-green-50'
                : darkMode
                  ? 'border-slate-700 bg-slate-800 hover:border-slate-600'
                  : 'border-slate-200 bg-white hover:border-slate-300'
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className={cn(
                  'text-lg font-semibold',
                  darkMode ? 'text-white' : 'text-slate-900'
                )}
              >
                {opt.label}
              </span>
              {opt.badge && (
                <span
                  className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full',
                    darkMode
                      ? 'bg-green-500/15 text-green-400'
                      : 'bg-green-100 text-green-700'
                  )}
                >
                  {opt.badge}
                </span>
              )}
            </div>
            <ul
              className={cn(
                'text-sm space-y-1',
                darkMode ? 'text-slate-400' : 'text-slate-500'
              )}
            >
              {opt.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5 shrink-0">&bull;</span>
                  {b}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>
    </div>
  )
}

function RestrictionsContent({
  darkMode,
  variant,
}: {
  darkMode: boolean
  variant: string
}) {
  return (
    <div>
      <h2
        className={cn(
          'text-2xl sm:text-3xl font-bold mb-2',
          darkMode ? 'text-white' : 'text-slate-900'
        )}
      >
        What foods should we track?
      </h2>
      <p
        className={cn(
          'text-base mb-8',
          darkMode ? 'text-slate-400' : 'text-slate-600'
        )}
      >
        {variant === 'MODIFIED_2024'
          ? 'Select foods you need to avoid. Modified AIP allows some items that Standard AIP removes.'
          : 'Standard AIP eliminations are pre-selected. Adjust as needed.'}
      </p>
      <RestrictionSelector darkMode={darkMode} />
    </div>
  )
}

function MacrosContent({ darkMode }: { darkMode: boolean }) {
  return (
    <div>
      <h2
        className={cn(
          'text-2xl sm:text-3xl font-bold mb-2',
          darkMode ? 'text-white' : 'text-slate-900'
        )}
      >
        Set your daily nutrition targets
      </h2>
      <p
        className={cn(
          'text-base mb-8',
          darkMode ? 'text-slate-400' : 'text-slate-600'
        )}
      >
        Not sure? The &ldquo;Standard AIP&rdquo; preset is a great starting
        point.
      </p>
      <MacroTargetForm darkMode={darkMode} />
    </div>
  )
}

function DoneContent({
  darkMode,
  data,
  isSubmitting,
  onComplete,
}: {
  darkMode: boolean
  data: {
    aipVariant: string
    dailyCalories: number
    dailyProtein: number
    dailyNetCarbs: number
  }
  isSubmitting: boolean
  onComplete: () => void
}) {
  return (
    <div className="text-center">
      {/* Checkmark */}
      <div className="relative inline-flex items-center justify-center mb-8">
        <div
          className={cn(
            'absolute w-24 h-24 rounded-full celebration-ring',
            darkMode ? 'bg-green-500/20' : 'bg-green-500/15'
          )}
        />
        <div className="celebration-check w-24 h-24 rounded-full bg-green-500 flex items-center justify-center">
          <svg
            className="w-12 h-12 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      </div>

      <h2
        className={cn(
          'text-3xl sm:text-4xl font-bold mb-4',
          darkMode ? 'text-white' : 'text-slate-900'
        )}
      >
        You&apos;re all set!
      </h2>

      {/* Summary */}
      <div
        className={cn(
          'text-base space-y-1 mb-10',
          darkMode ? 'text-slate-400' : 'text-slate-600'
        )}
      >
        <p className="font-medium">
          {data.aipVariant === 'MODIFIED_2024' ? 'Modified AIP (2024)' : 'Standard AIP'}
        </p>
        <p>
          {data.dailyCalories} cal &middot; {data.dailyProtein}g protein &middot;{' '}
          {data.dailyNetCarbs}g carbs
        </p>
      </div>

      <button
        onClick={onComplete}
        disabled={isSubmitting}
        className={cn(
          'rounded-xl px-10 py-3.5 text-lg font-semibold transition-colors',
          isSubmitting
            ? 'bg-slate-600 text-slate-400'
            : 'bg-green-500 hover:bg-green-600 active:bg-green-700 text-white'
        )}
      >
        {isSubmitting ? 'Saving...' : 'Start Tracking'}
      </button>
    </div>
  )
}

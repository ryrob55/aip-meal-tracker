'use client'

import { cn } from '@/lib/utils'
import { useAIPQuestionnaire } from '@/contexts/AIPQuestionnaireContext'
import { ProgressIndicator } from '@/components/aip-diet/ProgressIndicator'
import { RestrictionSelector } from '@/components/aip-diet/RestrictionSelector'
import { MacroTargetForm } from '@/components/aip-diet/MacroTargetForm'
import { FastingWindowPicker } from '@/components/aip-diet/FastingWindowPicker'
import { WelcomeStep } from './WelcomeStep'
import { AIPExplainerStep } from './AIPExplainerStep'
import { VariantPickerStep } from './VariantPickerStep'
import { ExperienceStep } from './ExperienceStep'
import { AISetupStep } from './AISetupStep'

interface Props {
  onComplete?: () => void
  darkMode?: boolean
}

export function OnboardingWizard({ onComplete, darkMode = true }: Props) {
  const {
    currentStep,
    stepOrder,
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

    // Also save AI settings to UserSettings if configured
    if (data.aiProvider && data.aiProvider !== 'NONE') {
      try {
        await fetch('/api/user/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            aiProvider: data.aiProvider,
            llmBaseUrl: data.llmBaseUrl,
            llmApiKey: data.llmApiKey,
            llmModel: data.llmModel,
            aipVariant: data.aipVariant,
          }),
        })
      } catch {
        // Non-blocking — settings can be configured later
        console.error('Failed to save AI settings')
      }
    }

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
        <ProgressIndicator
          currentStep={currentStep}
          darkMode={darkMode}
          stepOrder={stepOrder}
        />
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="max-w-lg mx-auto">
          {/* Welcome */}
          {currentStep === 'welcome' && <WelcomeStep darkMode={darkMode} />}

          {/* AIP Explainer */}
          {currentStep === 'aip_explainer' && <AIPExplainerStep darkMode={darkMode} />}

          {/* Variant Picker */}
          {currentStep === 'variant' && <VariantPickerStep darkMode={darkMode} />}

          {/* Experience */}
          {currentStep === 'experience' && <ExperienceStep darkMode={darkMode} />}

          {/* Restrictions */}
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
                {data.aipVariant === 'MODIFIED_2024'
                  ? 'Select foods you need to avoid. Modified AIP allows some items that Standard AIP removes.'
                  : 'Select foods you need to avoid. Standard AIP eliminations are pre-selected.'}
              </p>
              <RestrictionSelector darkMode={darkMode} />
            </div>
          )}

          {/* Macros */}
          {currentStep === 'macros' && (
            <div>
              <h2
                className={cn(
                  'text-xl font-bold mb-2',
                  darkMode ? 'text-white' : 'text-slate-900'
                )}
              >
                Nutrition Targets
              </h2>
              <p
                className={cn(
                  'text-sm mb-6',
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                )}
              >
                Set your daily calorie, protein, and carbohydrate goals. Not sure? The
                &ldquo;Standard AIP&rdquo; preset is a great starting point.
              </p>
              <MacroTargetForm darkMode={darkMode} />
            </div>
          )}

          {/* Fasting */}
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
                {data.experienceLevel === 'BEGINNER'
                  ? 'Set when you typically eat. If you\'re not doing intermittent fasting, just use a wide window like 7:00 AM - 8:00 PM.'
                  : 'Configure your intermittent fasting window and meal timing.'}
              </p>
              <FastingWindowPicker darkMode={darkMode} />
            </div>
          )}

          {/* AI Setup */}
          {currentStep === 'ai_setup' && <AISetupStep darkMode={darkMode} />}

          {/* Review */}
          {currentStep === 'review' && (
            <div>
              <h2
                className={cn(
                  'text-xl font-bold mb-2',
                  darkMode ? 'text-white' : 'text-slate-900'
                )}
              >
                You&apos;re All Set!
              </h2>
              <p
                className={cn(
                  'text-sm mb-6',
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                )}
              >
                Here&apos;s a summary of your settings. You can always change these later.
              </p>

              <div className="space-y-4">
                {/* Protocol */}
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
                    Protocol
                  </h3>
                  <p
                    className={cn(
                      'text-lg font-bold',
                      darkMode ? 'text-green-400' : 'text-green-600'
                    )}
                  >
                    {data.aipVariant === 'MODIFIED_2024' ? 'Modified AIP (2024)' : 'Standard AIP'}
                  </p>
                </div>

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
                        &le;{data.dailyNetCarbs}g
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
                    {data.restrictions.slice(0, 10).map((r) => (
                      <span
                        key={r.foodName}
                        className="px-2 py-0.5 rounded-sm text-xs bg-red-500/20 text-red-400"
                      >
                        {r.foodName}
                      </span>
                    ))}
                    {data.restrictions.length > 10 && (
                      <span className="px-2 py-0.5 rounded-sm text-xs bg-slate-700 text-slate-400">
                        +{data.restrictions.length - 10} more
                      </span>
                    )}
                    {data.restrictions.length === 0 && (
                      <span
                        className={cn(
                          'text-xs',
                          darkMode ? 'text-slate-500' : 'text-slate-500'
                        )}
                      >
                        None selected
                      </span>
                    )}
                  </div>
                </div>

                {/* AI Status */}
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
                    AI Assistant
                  </h3>
                  <p
                    className={cn(
                      'text-sm',
                      data.aiProvider && data.aiProvider !== 'NONE'
                        ? darkMode ? 'text-green-400' : 'text-green-600'
                        : darkMode ? 'text-slate-500' : 'text-slate-500'
                    )}
                  >
                    {data.aiProvider && data.aiProvider !== 'NONE'
                      ? `Configured (${data.aiProvider})`
                      : 'Not configured - you can set this up later'}
                  </p>
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
              {currentStep === 'welcome' ? "Let's Go" : 'Continue'}
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
              {isSubmitting ? 'Saving...' : 'Start Tracking'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

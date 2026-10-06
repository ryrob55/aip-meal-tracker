'use client'

import { cn } from '@/lib/utils'
import { useAIPQuestionnaire } from '@/contexts/AIPQuestionnaireContext'

interface Props {
  darkMode?: boolean
}

const EXPERIENCE_OPTIONS = [
  {
    id: 'BEGINNER' as const,
    label: 'Brand New',
    description: 'I just learned about AIP and want to understand the basics',
    icon: '🌱',
  },
  {
    id: 'SOME_KNOWLEDGE' as const,
    label: 'Some Knowledge',
    description: 'I\'ve read about AIP or tried parts of it before',
    icon: '📚',
  },
  {
    id: 'EXPERIENCED' as const,
    label: 'Experienced',
    description: 'I\'ve done AIP before and want to track a new round',
    icon: '⭐',
  },
]

export function ExperienceStep({ darkMode = true }: Props) {
  const { data, updateData } = useAIPQuestionnaire()

  return (
    <div>
      <h2
        className={cn(
          'text-xl font-bold mb-2',
          darkMode ? 'text-white' : 'text-slate-900'
        )}
      >
        Your Experience Level
      </h2>
      <p
        className={cn(
          'text-sm mb-6',
          darkMode ? 'text-slate-400' : 'text-slate-600'
        )}
      >
        This helps us adjust the amount of guidance and education you see.
      </p>

      <div className="space-y-3">
        {EXPERIENCE_OPTIONS.map((option) => {
          const isSelected = data.experienceLevel === option.id

          return (
            <button
              key={option.id}
              onClick={() => updateData({ experienceLevel: option.id })}
              className={cn(
                'w-full p-4 rounded-lg text-left transition-all',
                isSelected
                  ? 'bg-green-500/20 border-2 border-green-500'
                  : darkMode
                  ? 'bg-slate-800 border-2 border-transparent hover:border-slate-600'
                  : 'bg-slate-100 border-2 border-transparent hover:border-slate-300'
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{option.icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <span
                      className={cn(
                        'font-medium',
                        darkMode ? 'text-white' : 'text-slate-900'
                      )}
                    >
                      {option.label}
                    </span>
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center shrink-0',
                        isSelected
                          ? 'bg-green-500'
                          : darkMode
                          ? 'border-2 border-slate-600'
                          : 'border-2 border-slate-400'
                      )}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <p
                    className={cn(
                      'text-sm mt-1',
                      darkMode ? 'text-slate-400' : 'text-slate-600'
                    )}
                  >
                    {option.description}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Optional diagnosis info */}
      <div className="mt-6">
        <label
          className={cn(
            'block text-sm font-medium mb-2',
            darkMode ? 'text-slate-300' : 'text-slate-700'
          )}
        >
          What condition(s) are you managing? (optional)
        </label>
        <textarea
          value={data.diagnosisInfo}
          onChange={(e) => updateData({ diagnosisInfo: e.target.value })}
          placeholder="e.g., Hashimoto's, rheumatoid arthritis, IBS..."
          rows={2}
          className={cn(
            'w-full px-3 py-2 rounded-lg text-sm resize-none',
            darkMode
              ? 'bg-slate-800 text-white placeholder-slate-500 border border-slate-700 focus:border-green-500'
              : 'bg-white text-slate-900 placeholder-slate-400 border border-slate-300 focus:border-green-500'
          )}
        />
        <p
          className={cn(
            'text-xs mt-1',
            darkMode ? 'text-slate-500' : 'text-slate-500'
          )}
        >
          This is private and only used to personalize your experience.
        </p>
      </div>
    </div>
  )
}

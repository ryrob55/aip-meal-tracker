'use client'

import { cn } from '@/lib/utils'
import { useAIPQuestionnaire } from '@/contexts/AIPQuestionnaireContext'

interface Props {
  darkMode?: boolean
}

export function VariantPickerStep({ darkMode = true }: Props) {
  const { data, updateData } = useAIPQuestionnaire()

  const variants = [
    {
      id: 'STANDARD' as const,
      name: 'Standard AIP',
      description: 'The classic elimination protocol',
      details: [
        'Removes all grains, dairy, eggs, nuts, seeds, legumes, nightshades',
        'Most studied and widely recommended',
        'Best if you\'re new to AIP or have severe symptoms',
      ],
      badge: 'Recommended for beginners',
      badgeColor: darkMode ? 'text-green-400 bg-green-900/40' : 'text-green-700 bg-green-100',
    },
    {
      id: 'MODIFIED_2024' as const,
      name: 'Modified AIP (2024)',
      description: 'Updated protocol with expanded allowed foods',
      details: [
        'Allows rice, pseudo-grains (quinoa, buckwheat), ghee',
        'Allows most legumes (except soy), seeds, coffee, cocoa',
        'Based on recent research showing these are well-tolerated by most',
      ],
      badge: 'More flexible',
      badgeColor: darkMode ? 'text-blue-400 bg-blue-900/40' : 'text-blue-700 bg-blue-100',
    },
  ]

  return (
    <div>
      <h2
        className={cn(
          'text-xl font-bold mb-2',
          darkMode ? 'text-white' : 'text-slate-900'
        )}
      >
        Choose Your Protocol
      </h2>
      <p
        className={cn(
          'text-sm mb-6',
          darkMode ? 'text-slate-400' : 'text-slate-600'
        )}
      >
        Both are valid approaches. Pick whichever fits your situation best &mdash; you can
        switch later.
      </p>

      <div className="space-y-4">
        {variants.map((variant) => {
          const isSelected = data.aipVariant === variant.id

          return (
            <button
              key={variant.id}
              onClick={() => updateData({ aipVariant: variant.id })}
              className={cn(
                'w-full p-5 rounded-lg text-left transition-all',
                isSelected
                  ? 'bg-green-500/20 border-2 border-green-500'
                  : darkMode
                  ? 'bg-slate-800 border-2 border-transparent hover:border-slate-600'
                  : 'bg-slate-100 border-2 border-transparent hover:border-slate-300'
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span
                    className={cn(
                      'font-semibold text-base',
                      darkMode ? 'text-white' : 'text-slate-900'
                    )}
                  >
                    {variant.name}
                  </span>
                  <p
                    className={cn(
                      'text-xs mt-0.5',
                      darkMode ? 'text-slate-400' : 'text-slate-500'
                    )}
                  >
                    {variant.description}
                  </p>
                </div>
                <div
                  className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5',
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

              <span className={cn('inline-block text-xs px-2 py-0.5 rounded-full mb-3', variant.badgeColor)}>
                {variant.badge}
              </span>

              <ul className="space-y-1.5">
                {variant.details.map((detail) => (
                  <li
                    key={detail}
                    className={cn(
                      'text-xs flex items-start gap-2',
                      darkMode ? 'text-slate-400' : 'text-slate-600'
                    )}
                  >
                    <span className="mt-0.5 shrink-0">&#8226;</span>
                    {detail}
                  </li>
                ))}
              </ul>
            </button>
          )
        })}
      </div>

      {/* Doctor recommendation toggle */}
      <div
        className={cn(
          'mt-6 p-4 rounded-lg',
          darkMode ? 'bg-slate-800' : 'bg-slate-100'
        )}
      >
        <label className="flex items-center gap-3 cursor-pointer">
          <button
            onClick={() => updateData({ doctorRecommended: !data.doctorRecommended })}
            className={cn(
              'w-5 h-5 rounded-sm border-2 flex items-center justify-center shrink-0',
              data.doctorRecommended
                ? 'bg-green-500 border-green-500'
                : darkMode
                ? 'border-slate-600'
                : 'border-slate-400'
            )}
          >
            {data.doctorRecommended && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          <div>
            <span
              className={cn(
                'text-sm font-medium',
                darkMode ? 'text-slate-200' : 'text-slate-800'
              )}
            >
              A doctor or practitioner recommended AIP to me
            </span>
            <p
              className={cn(
                'text-xs',
                darkMode ? 'text-slate-500' : 'text-slate-500'
              )}
            >
              Helps us tailor recommendations
            </p>
          </div>
        </label>
      </div>
    </div>
  )
}

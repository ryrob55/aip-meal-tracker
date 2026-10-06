'use client'

import { cn } from '@/lib/utils'

interface Props {
  darkMode?: boolean
}

export function AIPExplainerStep({ darkMode = true }: Props) {
  return (
    <div>
      <h2
        className={cn(
          'text-xl font-bold mb-2',
          darkMode ? 'text-white' : 'text-slate-900'
        )}
      >
        What is AIP?
      </h2>
      <p
        className={cn(
          'text-sm mb-6',
          darkMode ? 'text-slate-400' : 'text-slate-600'
        )}
      >
        A quick overview so you know what to expect.
      </p>

      {/* AIP 101 */}
      <div className="space-y-4">
        <div
          className={cn(
            'p-4 rounded-lg',
            darkMode ? 'bg-slate-800' : 'bg-slate-100'
          )}
        >
          <h3
            className={cn(
              'text-sm font-semibold mb-2',
              darkMode ? 'text-green-400' : 'text-green-700'
            )}
          >
            The Autoimmune Protocol (AIP)
          </h3>
          <p
            className={cn(
              'text-sm leading-relaxed',
              darkMode ? 'text-slate-300' : 'text-slate-700'
            )}
          >
            AIP is a therapeutic diet designed to reduce inflammation and help your immune
            system heal. It temporarily removes foods that commonly trigger immune
            reactions, then systematically reintroduces them to find your personal triggers.
          </p>
        </div>

        {/* Two Phases */}
        <div className="grid gap-3">
          <div
            className={cn(
              'p-4 rounded-lg border-l-4 border-green-500',
              darkMode ? 'bg-slate-800' : 'bg-slate-100'
            )}
          >
            <h4
              className={cn(
                'text-sm font-semibold mb-1',
                darkMode ? 'text-white' : 'text-slate-900'
              )}
            >
              Phase 1: Elimination (30-90 days)
            </h4>
            <p
              className={cn(
                'text-sm',
                darkMode ? 'text-slate-400' : 'text-slate-600'
              )}
            >
              Remove potential trigger foods to give your body time to calm
              inflammation and heal. You&apos;ll eat nutrient-dense whole foods &mdash;
              quality meats, vegetables, fruits, and healthy fats.
            </p>
          </div>

          <div
            className={cn(
              'p-4 rounded-lg border-l-4 border-blue-500',
              darkMode ? 'bg-slate-800' : 'bg-slate-100'
            )}
          >
            <h4
              className={cn(
                'text-sm font-semibold mb-1',
                darkMode ? 'text-white' : 'text-slate-900'
              )}
            >
              Phase 2: Reintroduction (gradual)
            </h4>
            <p
              className={cn(
                'text-sm',
                darkMode ? 'text-slate-400' : 'text-slate-600'
              )}
            >
              Once symptoms improve, you&apos;ll add foods back one at a time,
              tracking how your body responds. This helps you build a personalized
              diet that works for you.
            </p>
          </div>
        </div>

        {/* What you CAN eat */}
        <div
          className={cn(
            'p-4 rounded-lg',
            darkMode ? 'bg-green-900/30' : 'bg-green-50'
          )}
        >
          <h4
            className={cn(
              'text-sm font-semibold mb-2',
              darkMode ? 'text-green-400' : 'text-green-700'
            )}
          >
            What you CAN eat (there&apos;s a lot!)
          </h4>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              'All meats & poultry',
              'Most seafood',
              'All vegetables (except nightshades)',
              'All fruits',
              'Olive oil & coconut oil',
              'Bone broth',
              'Fresh herbs',
              'Sweet potatoes',
            ].map((food) => (
              <p
                key={food}
                className={cn(
                  'text-xs flex items-center gap-1.5',
                  darkMode ? 'text-green-300' : 'text-green-700'
                )}
              >
                <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {food}
              </p>
            ))}
          </div>
        </div>

        {/* Encouragement */}
        <div
          className={cn(
            'p-4 rounded-lg text-center',
            darkMode ? 'bg-slate-800' : 'bg-slate-100'
          )}
        >
          <p
            className={cn(
              'text-sm italic',
              darkMode ? 'text-slate-300' : 'text-slate-700'
            )}
          >
            &ldquo;It feels overwhelming at first, but it gets easier fast. Most people
            start feeling better within 2-4 weeks.&rdquo;
          </p>
        </div>
      </div>
    </div>
  )
}

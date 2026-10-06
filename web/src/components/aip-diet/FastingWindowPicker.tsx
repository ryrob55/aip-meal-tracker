'use client'

import { cn } from '@/lib/utils'
import { useAIPQuestionnaire } from '@/contexts/AIPQuestionnaireContext'

interface Props {
  darkMode?: boolean
}

// Generate time options in 30-minute increments
function generateTimeOptions(): string[] {
  const times: string[] = []
  for (let hour = 0; hour < 24; hour++) {
    for (let min = 0; min < 60; min += 30) {
      times.push(
        `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
      )
    }
  }
  return times
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

function calculateFastingHours(start: string, end: string): number {
  const [startHour, startMin] = start.split(':').map(Number)
  const [endHour, endMin] = end.split(':').map(Number)

  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin

  const eatingMinutes = endMinutes - startMinutes
  const fastingMinutes = 24 * 60 - eatingMinutes

  return Math.round(fastingMinutes / 60 * 10) / 10
}

const TIME_OPTIONS = generateTimeOptions()

export function FastingWindowPicker({ darkMode = true }: Props) {
  const { data, updateData } = useAIPQuestionnaire()

  const fastingHours = calculateFastingHours(
    data.eatingWindowStart,
    data.eatingWindowEnd
  )

  const presets = [
    { name: '16:8', start: '12:00', end: '20:00', description: 'Most popular IF protocol' },
    { name: '18:6', start: '12:00', end: '18:00', description: 'Extended fasting window' },
    { name: 'Your Plan', start: '11:30', end: '18:30', description: '7-hour eating window' },
    { name: 'OMAD', start: '17:00', end: '18:00', description: 'One meal a day' },
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
          Common IF Schedules
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {presets.map((preset) => {
            const isSelected =
              data.eatingWindowStart === preset.start &&
              data.eatingWindowEnd === preset.end

            return (
              <button
                key={preset.name}
                onClick={() =>
                  updateData({
                    eatingWindowStart: preset.start,
                    eatingWindowEnd: preset.end,
                  })
                }
                className={cn(
                  'p-3 rounded-lg text-left transition-all',
                  isSelected
                    ? 'bg-purple-500/20 border-2 border-purple-500'
                    : darkMode
                    ? 'bg-slate-800 border-2 border-transparent hover:border-slate-600'
                    : 'bg-slate-100 border-2 border-transparent hover:border-slate-300'
                )}
              >
                <div className="flex justify-between items-start">
                  <span
                    className={cn(
                      'font-medium',
                      darkMode ? 'text-white' : 'text-slate-900'
                    )}
                  >
                    {preset.name}
                  </span>
                  {isSelected && (
                    <svg
                      className="w-4 h-4 text-purple-500"
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
                <p
                  className={cn(
                    'text-xs mt-1',
                    darkMode ? 'text-slate-500' : 'text-slate-500'
                  )}
                >
                  {preset.description}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom Time Selection */}
      <div>
        <h3
          className={cn(
            'text-sm font-medium mb-3',
            darkMode ? 'text-slate-300' : 'text-slate-700'
          )}
        >
          Custom Eating Window
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              className={cn(
                'block text-xs mb-2',
                darkMode ? 'text-slate-400' : 'text-slate-600'
              )}
            >
              First Meal
            </label>
            <select
              value={data.eatingWindowStart}
              onChange={(e) => updateData({ eatingWindowStart: e.target.value })}
              className={cn(
                'w-full px-3 py-2 rounded-lg text-sm',
                darkMode
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'bg-white text-slate-900 border border-slate-300'
              )}
            >
              {TIME_OPTIONS.map((time) => (
                <option key={time} value={time}>
                  {formatTime(time)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className={cn(
                'block text-xs mb-2',
                darkMode ? 'text-slate-400' : 'text-slate-600'
              )}
            >
              Last Meal/Snack
            </label>
            <select
              value={data.eatingWindowEnd}
              onChange={(e) => updateData({ eatingWindowEnd: e.target.value })}
              className={cn(
                'w-full px-3 py-2 rounded-lg text-sm',
                darkMode
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'bg-white text-slate-900 border border-slate-300'
              )}
            >
              {TIME_OPTIONS.map((time) => (
                <option key={time} value={time}>
                  {formatTime(time)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Visual Timeline */}
      <div
        className={cn(
          'p-4 rounded-lg',
          darkMode ? 'bg-slate-800' : 'bg-slate-100'
        )}
      >
        <div className="flex justify-between items-center mb-3">
          <span
            className={cn(
              'text-sm font-medium',
              darkMode ? 'text-slate-300' : 'text-slate-700'
            )}
          >
            Your Fasting Schedule
          </span>
          <span
            className={cn(
              'text-sm font-bold',
              darkMode ? 'text-purple-400' : 'text-purple-600'
            )}
          >
            {fastingHours}h fasting
          </span>
        </div>

        {/* Timeline bar */}
        <div className="relative h-8 rounded-full overflow-hidden bg-slate-700">
          {/* Fasting periods (before and after eating) */}
          <div className="absolute inset-0 bg-purple-600/30" />

          {/* Eating window */}
          {(() => {
            const [startHour, startMin] = data.eatingWindowStart
              .split(':')
              .map(Number)
            const [endHour, endMin] = data.eatingWindowEnd.split(':').map(Number)

            const startPercent = ((startHour * 60 + startMin) / (24 * 60)) * 100
            const endPercent = ((endHour * 60 + endMin) / (24 * 60)) * 100

            return (
              <div
                className="absolute top-0 bottom-0 bg-green-500"
                style={{
                  left: `${startPercent}%`,
                  width: `${endPercent - startPercent}%`,
                }}
              />
            )
          })()}

          {/* Hour markers */}
          <div className="absolute inset-0 flex">
            {[0, 6, 12, 18].map((hour) => (
              <div
                key={hour}
                className="absolute top-0 bottom-0 w-px bg-slate-600"
                style={{ left: `${(hour / 24) * 100}%` }}
              />
            ))}
          </div>
        </div>

        {/* Time labels */}
        <div className="flex justify-between mt-1 text-xs text-slate-500">
          <span>12am</span>
          <span>6am</span>
          <span>12pm</span>
          <span>6pm</span>
          <span>12am</span>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-3 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-green-500" />
            <span className={cn('text-xs', darkMode ? 'text-slate-400' : 'text-slate-600')}>
              Eating Window
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-purple-600/30" />
            <span className={cn('text-xs', darkMode ? 'text-slate-400' : 'text-slate-600')}>
              Fasting
            </span>
          </div>
        </div>
      </div>

      {/* Meal Timing Options */}
      <div>
        <h3
          className={cn(
            'text-sm font-medium mb-3',
            darkMode ? 'text-slate-300' : 'text-slate-700'
          )}
        >
          Meal Timing
        </h3>

        <div className="space-y-3">
          {/* Morning Coffee */}
          <div
            className={cn(
              'flex items-center justify-between p-3 rounded-lg',
              darkMode ? 'bg-slate-800' : 'bg-slate-100'
            )}
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={data.includeMorningCoffee}
                onChange={(e) =>
                  updateData({ includeMorningCoffee: e.target.checked })
                }
                className="w-4 h-4 accent-green-500"
              />
              <div>
                <span
                  className={cn(
                    'text-sm font-medium',
                    darkMode ? 'text-slate-200' : 'text-slate-800'
                  )}
                >
                  Morning Coffee
                </span>
                <p
                  className={cn(
                    'text-xs',
                    darkMode ? 'text-slate-500' : 'text-slate-500'
                  )}
                >
                  Coffee + MCT oil (during fast)
                </p>
              </div>
            </div>
            {data.includeMorningCoffee && (
              <select
                value={data.morningCoffeeTime || '06:30'}
                onChange={(e) => updateData({ morningCoffeeTime: e.target.value })}
                className={cn(
                  'px-2 py-1 rounded-sm text-sm',
                  darkMode
                    ? 'bg-slate-700 text-white border border-slate-600'
                    : 'bg-white text-slate-900 border border-slate-300'
                )}
              >
                {TIME_OPTIONS.filter((t) => {
                  const hour = parseInt(t.split(':')[0])
                  return hour >= 5 && hour <= 10
                }).map((time) => (
                  <option key={time} value={time}>
                    {formatTime(time)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Smoothie */}
          <div
            className={cn(
              'flex items-center justify-between p-3 rounded-lg',
              darkMode ? 'bg-slate-800' : 'bg-slate-100'
            )}
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={data.includeSmoothie}
                onChange={(e) => updateData({ includeSmoothie: e.target.checked })}
                className="w-4 h-4 accent-green-500"
              />
              <div>
                <span
                  className={cn(
                    'text-sm font-medium',
                    darkMode ? 'text-slate-200' : 'text-slate-800'
                  )}
                >
                  Daily Smoothie
                </span>
                <p
                  className={cn(
                    'text-xs',
                    darkMode ? 'text-slate-500' : 'text-slate-500'
                  )}
                >
                  AIP berry smoothie to break fast
                </p>
              </div>
            </div>
            {data.includeSmoothie && (
              <select
                value={data.smoothieTime || data.eatingWindowStart}
                onChange={(e) => updateData({ smoothieTime: e.target.value })}
                className={cn(
                  'px-2 py-1 rounded-sm text-sm',
                  darkMode
                    ? 'bg-slate-700 text-white border border-slate-600'
                    : 'bg-white text-slate-900 border border-slate-300'
                )}
              >
                {TIME_OPTIONS.filter((t) => {
                  const hour = parseInt(t.split(':')[0])
                  return hour >= 9 && hour <= 14
                }).map((time) => (
                  <option key={time} value={time}>
                    {formatTime(time)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Evening Snack */}
          <div
            className={cn(
              'flex items-center justify-between p-3 rounded-lg',
              darkMode ? 'bg-slate-800' : 'bg-slate-100'
            )}
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={data.includeSnack}
                onChange={(e) => updateData({ includeSnack: e.target.checked })}
                className="w-4 h-4 accent-green-500"
              />
              <div>
                <span
                  className={cn(
                    'text-sm font-medium',
                    darkMode ? 'text-slate-200' : 'text-slate-800'
                  )}
                >
                  Evening Snack
                </span>
                <p
                  className={cn(
                    'text-xs',
                    darkMode ? 'text-slate-500' : 'text-slate-500'
                  )}
                >
                  Light snack before fast (no meat)
                </p>
              </div>
            </div>
            {data.includeSnack && (
              <select
                value={data.snackTime || data.eatingWindowEnd}
                onChange={(e) => updateData({ snackTime: e.target.value })}
                className={cn(
                  'px-2 py-1 rounded-sm text-sm',
                  darkMode
                    ? 'bg-slate-700 text-white border border-slate-600'
                    : 'bg-white text-slate-900 border border-slate-300'
                )}
              >
                {TIME_OPTIONS.filter((t) => {
                  const hour = parseInt(t.split(':')[0])
                  return hour >= 17 && hour <= 21
                }).map((time) => (
                  <option key={time} value={time}>
                    {formatTime(time)}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

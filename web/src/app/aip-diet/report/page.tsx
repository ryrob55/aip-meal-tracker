'use client'

import { useState, useMemo, useCallback, Fragment } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { format, subDays, startOfMonth } from 'date-fns'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import { getMacroProgressBarColor, getMacroStatusColor } from '@/lib/macro-calculator'

// --- Date Range Presets ---

const AIP_START_DATE = new Date('2025-02-01')

type PresetKey = 'last7' | 'last14' | 'last30' | 'mtd' | 'all' | 'custom'

interface DatePreset {
  key: PresetKey
  label: string
  getRange: () => { start: Date; end: Date }
}

const DATE_PRESETS: DatePreset[] = [
  { key: 'last7', label: 'Last 7 Days', getRange: () => ({ start: subDays(new Date(), 6), end: new Date() }) },
  { key: 'last14', label: 'Last 14 Days', getRange: () => ({ start: subDays(new Date(), 13), end: new Date() }) },
  { key: 'last30', label: 'Last 30 Days', getRange: () => ({ start: subDays(new Date(), 29), end: new Date() }) },
  { key: 'mtd', label: 'Month to Date', getRange: () => ({ start: startOfMonth(new Date()), end: new Date() }) },
  { key: 'all', label: 'All Time', getRange: () => ({ start: AIP_START_DATE, end: new Date() }) },
  { key: 'custom', label: 'Custom', getRange: () => ({ start: AIP_START_DATE, end: new Date() }) },
]

// --- Types ---

interface MealSummary {
  mealType: string
  mealName: string
  eaten: boolean
  skipped: boolean
  isLeftover: boolean
  calories: number
  protein: number
  netCarbs: number
  fat: number
  fiber: number
}

interface DaySummary {
  date: string
  dayOfWeek: string
  totalCalories: number
  totalProtein: number
  totalNetCarbs: number
  totalFat: number
  totalFiber: number
  mealsPlanned: number
  mealsEaten: number
  mealsSkipped: number
  adherenceRate: number
  calorieTargetMet: boolean
  proteinTargetMet: boolean
  carbsUnderLimit: boolean
  meals: MealSummary[]
}

interface WeekSummary {
  weekOf: string
  weekEnd: string
  avgCalories: number
  avgProtein: number
  avgNetCarbs: number
  avgFat: number
  avgFiber: number
  totalMealsPlanned: number
  totalMealsEaten: number
  totalMealsSkipped: number
  adherenceRate: number
  daysTracked: number
  days: DaySummary[]
}

interface Restriction {
  foodName: string
  type: string
  severity: string
  notes: string | null
}

interface WeeklyTrend {
  weekOf: string
  caloriesDelta: number
  proteinDelta: number
  netCarbsDelta: number
  adherenceDelta: number
}

interface ReportData {
  reportGenerated: string
  dateRange: { start: string; end: string; weeks: number }
  protocol: {
    phase: string
    eatingWindow: string
    restrictions: Restriction[]
    restrictionsByType: Record<string, { foodName: string; severity: string; notes: string | null }[]>
    healthGoals: string[]
    allowLeftovers: boolean
    maxLeftoverHours: number
    includeSmoothie: boolean
    includeMorningCoffee: boolean
  }
  targets: {
    dailyCalories: number
    dailyProtein: number
    dailyNetCarbs: number
    eatingWindow: string
  }
  summary: {
    totalMealsPlanned: number
    totalMealsEaten: number
    totalMealsSkipped: number
    totalDaysTracked: number
    overallAdherenceRate: number
    avgDailyCalories: number
    avgDailyProtein: number
    avgDailyNetCarbs: number
    avgDailyFat: number
    avgDailyFiber: number
    calorieTargetMet: boolean
    proteinTargetMet: boolean
    carbsUnderLimit: boolean
  }
  insights: {
    daysUnderProtein: number
    daysOverCarbs: number
    daysLowCalories: number
    totalDaysTracked: number
    mostCommonMeals: { name: string; count: number }[]
    weeklyTrends: WeeklyTrend[]
    flags: string[]
  }
  weeklyBreakdown: WeekSummary[]
}

// --- Helpers ---

const MEAL_TYPE_LABELS: Record<string, string> = {
  MORNING_COFFEE: 'Coffee',
  SMOOTHIE: 'Smoothie',
  LUNCH: 'Lunch',
  AFTERNOON_SNACK: 'PM Snack',
  DINNER: 'Dinner',
  EVENING_SNACK: 'Eve Snack',
  EXTRA_SNACKS: 'Extra',
}

const RESTRICTION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  ALLERGY: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-300 dark:border-red-700' },
  INTOLERANCE: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-300 dark:border-orange-700' },
  MIGRAINE_TRIGGER: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-300 dark:border-purple-700' },
  HIGH_TYRAMINE: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-400', border: 'border-violet-300 dark:border-violet-700' },
  HIGH_HISTAMINE: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-400', border: 'border-pink-300 dark:border-pink-700' },
  AVOID: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-400', border: 'border-slate-300 dark:border-slate-600' },
}

function restrictionLabel(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function TrendArrow({ delta }: { delta: number }) {
  if (delta === 0) return <span className="text-slate-400">-</span>
  return delta > 0
    ? <span className="text-green-500">+{delta}</span>
    : <span className="text-red-500">{delta}</span>
}

function TrendArrowCarbs({ delta }: { delta: number }) {
  if (delta === 0) return <span className="text-slate-400">-</span>
  // For carbs, going down is good
  return delta < 0
    ? <span className="text-green-500">{delta}</span>
    : <span className="text-red-500">+{delta}</span>
}

function ProgressBar({ percentage, type, small, colorOverride }: { percentage: number; type: 'target' | 'limit'; small?: boolean; colorOverride?: string }) {
  const barColor = colorOverride || getMacroProgressBarColor(Math.min(percentage, 100), type)
  const height = small ? 'h-1.5' : 'h-2'
  return (
    <div className={cn('w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden', height)}>
      <div
        className={cn('rounded-full transition-all', barColor, height)}
        style={{ width: `${Math.min(percentage, 100)}%`, printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
      />
    </div>
  )
}

function StatusDot({ met }: { met: boolean }) {
  return (
    <span
      className={cn(
        'inline-block w-2 h-2 rounded-full',
        met ? 'bg-green-500' : 'bg-yellow-500'
      )}
      style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
    />
  )
}

// --- Component ---

export default function ReportPage() {
  const { darkMode } = useTheme()
  const [preset, setPreset] = useState<PresetKey>('mtd')
  const [customStart, setCustomStart] = useState(format(AIP_START_DATE, 'yyyy-MM-dd'))
  const [customEnd, setCustomEnd] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({})
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({})
  const [printing, setPrinting] = useState(false)

  const dateRange = useMemo(() => {
    if (preset === 'custom') {
      return { start: new Date(customStart + 'T12:00:00'), end: new Date(customEnd + 'T12:00:00') }
    }
    const p = DATE_PRESETS.find(d => d.key === preset) || DATE_PRESETS[4]
    return p.getRange()
  }, [preset, customStart, customEnd])

  const startStr = format(dateRange.start, 'yyyy-MM-dd')
  const endStr = format(dateRange.end, 'yyyy-MM-dd')

  const { data: report, isLoading } = useQuery<ReportData>({
    queryKey: ['aipReport', startStr, endStr],
    queryFn: async () => {
      const res = await fetch(`/api/aip-diet/report?startDate=${startStr}&endDate=${endStr}`)
      if (!res.ok) throw new Error('Failed to fetch report')
      return res.json()
    },
  })

  const toggleWeek = useCallback((weekOf: string) => {
    setExpandedWeeks(prev => ({ ...prev, [weekOf]: !prev[weekOf] }))
  }, [])

  const toggleDay = useCallback((date: string) => {
    setExpandedDays(prev => ({ ...prev, [date]: !prev[date] }))
  }, [])

  const handlePrint = useCallback(() => {
    if (!report) return
    setPrinting(true)
    // Expand all weeks and days for print
    const allWeeks: Record<string, boolean> = {}
    const allDays: Record<string, boolean> = {}
    for (const week of report.weeklyBreakdown) {
      allWeeks[week.weekOf] = true
      for (const day of week.days) {
        if (day.mealsPlanned > 0) allDays[day.date] = true
      }
    }
    setExpandedWeeks(allWeeks)
    setExpandedDays(allDays)
    setTimeout(() => {
      window.print()
      setPrinting(false)
    }, 100)
  }, [report])

  const cardClass = cn(
    'p-4 rounded-lg print:border print:border-gray-300 print:shadow-none',
    darkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'
  )
  const headingClass = cn('text-sm font-semibold mb-3', darkMode ? 'text-slate-300' : 'text-slate-700')
  const labelClass = cn('text-xs', darkMode ? 'text-slate-500' : 'text-slate-500')
  const valueClass = cn('text-lg font-bold', darkMode ? 'text-white' : 'text-slate-900')
  const mutedText = cn('text-sm', darkMode ? 'text-slate-400' : 'text-slate-600')

  return (
    <div className={cn('min-h-screen', darkMode ? 'bg-slate-900' : 'bg-slate-50')}>
      {/* Header */}
      <div
        className={cn(
          'sticky top-0 z-10 px-4 py-2.5 border-b print:hidden',
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Link
              href="/aip-diet"
              className={cn(
                'p-1.5 -ml-1.5 rounded-lg transition-colors',
                darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'
              )}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className={cn('text-base font-bold', darkMode ? 'text-white' : 'text-slate-900')}>
              Progress Report
            </h1>
            <span className={cn('text-xs', darkMode ? 'text-slate-500' : 'text-slate-400')}>
              {format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d, yyyy')}
            </span>
          </div>
          <button
            onClick={handlePrint}
            disabled={printing}
            className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            {printing ? 'Preparing...' : 'Print / Export'}
          </button>
        </div>

        {/* Date Range Presets + Custom Inputs */}
        <div className="flex items-center gap-2 overflow-x-auto -mx-1 px-1 scrollbar-hide">
          {DATE_PRESETS.map(p => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              className={cn(
                'px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border',
                preset === p.key
                  ? 'bg-green-500 text-white border-green-500'
                  : darkMode
                    ? 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                    : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
              )}
            >
              {p.label}
            </button>
          ))}
          {preset === 'custom' && (
            <>
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                min="2025-02-01"
                max={customEnd}
                className={cn(
                  'px-2 py-0.5 rounded text-xs border ml-1',
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                )}
              />
              <span className={cn('text-xs', darkMode ? 'text-slate-500' : 'text-slate-400')}>to</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                min={customStart}
                max={format(new Date(), 'yyyy-MM-dd')}
                className={cn(
                  'px-2 py-0.5 rounded text-xs border',
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                )}
              />
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-4xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : report ? (
          <div className="space-y-6 print:space-y-4">
            {/* Print Header */}
            <div className="hidden print:block text-center mb-8">
              <h1 className="text-2xl font-bold text-black">AIP Diet Progress Report</h1>
              <p className="text-gray-600">
                {format(new Date(report.dateRange.start + 'T12:00:00'), 'MMMM d, yyyy')} -{' '}
                {format(new Date(report.dateRange.end + 'T12:00:00'), 'MMMM d, yyyy')}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Generated: {format(new Date(report.reportGenerated), 'MMMM d, yyyy h:mm a')}
              </p>
            </div>

            {/* ========== HERO SCORECARD ========== */}
            <div className={cn(
              'rounded-xl overflow-hidden print:break-inside-avoid',
              darkMode
                ? 'bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 border border-slate-700'
                : 'bg-gradient-to-br from-white via-slate-50 to-emerald-50 border border-slate-200'
            )}>
              <div className="flex items-center gap-6 p-5">
                {/* Adherence Ring */}
                <div className="flex-shrink-0">
                  <svg viewBox="0 0 120 120" className="w-28 h-28">
                    {/* Background ring */}
                    <circle cx="60" cy="60" r="50" fill="none" strokeWidth="10"
                      className={darkMode ? 'stroke-slate-700' : 'stroke-slate-200'} />
                    {/* Progress ring */}
                    <circle cx="60" cy="60" r="50" fill="none" strokeWidth="10"
                      strokeLinecap="round"
                      className={
                        report.summary.overallAdherenceRate >= 80 ? 'stroke-emerald-500'
                        : report.summary.overallAdherenceRate >= 60 ? 'stroke-amber-500'
                        : 'stroke-red-500'
                      }
                      strokeDasharray={`${(report.summary.overallAdherenceRate / 100) * 314.16} 314.16`}
                      transform="rotate(-90 60 60)"
                      style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' } as React.CSSProperties}
                    />
                    {/* Center text */}
                    <text x="60" y="58" textAnchor="middle" dominantBaseline="central" className={cn('fill-current', darkMode ? 'text-white' : 'text-slate-900')}
                      style={{ fontSize: '26px', fontWeight: 700 }}>
                      {report.summary.overallAdherenceRate}%
                    </text>
                    <text x="60" y="76" textAnchor="middle" dominantBaseline="central" className={cn('fill-current', darkMode ? 'text-slate-500' : 'text-slate-400')}
                      style={{ fontSize: '11px' }}>
                      adherence
                    </text>
                  </svg>
                </div>

                {/* Stats Grid */}
                <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <p className={cn('text-xs font-medium uppercase tracking-wide', darkMode ? 'text-slate-500' : 'text-slate-400')}>Days Tracked</p>
                    <p className={cn('text-xl font-bold', darkMode ? 'text-white' : 'text-slate-900')}>
                      {report.summary.totalDaysTracked}
                      <span className={cn('text-sm font-normal ml-1', darkMode ? 'text-slate-500' : 'text-slate-400')}>
                        of {Math.round((new Date(report.dateRange.end + 'T12:00:00').getTime() - new Date(report.dateRange.start + 'T12:00:00').getTime()) / 86400000) + 1}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className={cn('text-xs font-medium uppercase tracking-wide', darkMode ? 'text-slate-500' : 'text-slate-400')}>Meals Logged</p>
                    <p className={cn('text-xl font-bold', darkMode ? 'text-white' : 'text-slate-900')}>
                      {report.summary.totalMealsEaten}
                      <span className={cn('text-sm font-normal ml-1', darkMode ? 'text-slate-500' : 'text-slate-400')}>
                        / {report.summary.totalMealsPlanned}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className={cn('text-xs font-medium uppercase tracking-wide', darkMode ? 'text-slate-500' : 'text-slate-400')}>Protein Target</p>
                    <p className={cn('text-xl font-bold', darkMode ? 'text-white' : 'text-slate-900')}>
                      {report.summary.avgDailyProtein}g
                      <span className={cn('text-sm font-normal ml-1', darkMode ? 'text-slate-500' : 'text-slate-400')}>
                        / {report.targets.dailyProtein}g
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className={cn('text-xs font-medium uppercase tracking-wide', darkMode ? 'text-slate-500' : 'text-slate-400')}>Net Carbs</p>
                    <p className={cn('text-xl font-bold', darkMode ? 'text-white' : 'text-slate-900')}>
                      {report.summary.avgDailyNetCarbs}g
                      <span className={cn('text-sm font-normal ml-1', darkMode ? 'text-slate-500' : 'text-slate-400')}>
                        / {report.targets.dailyNetCarbs}g
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom status bar */}
              {report.insights.flags.length === 0 ? (
                <div className={cn(
                  'px-5 py-2 text-xs font-medium flex items-center gap-1.5',
                  darkMode ? 'bg-emerald-900/30 text-emerald-400 border-t border-slate-700' : 'bg-emerald-50 text-emerald-700 border-t border-emerald-200'
                )} style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' } as React.CSSProperties}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  All targets met — great compliance this period
                </div>
              ) : (
                <div className={cn(
                  'px-5 py-2 text-xs font-medium flex items-center gap-1.5',
                  darkMode ? 'bg-amber-900/20 text-amber-400 border-t border-slate-700' : 'bg-amber-50 text-amber-700 border-t border-amber-200'
                )} style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' } as React.CSSProperties}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {report.insights.flags.length} area{report.insights.flags.length !== 1 ? 's' : ''} to review — see details below
                </div>
              )}
            </div>

            {/* ========== SECTION 1: Detailed Metrics ========== */}

            {/* Key Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 print:grid-cols-3">
              {/* Adherence */}
              <div className={cardClass}>
                <p className={labelClass}>Adherence</p>
                <p className={cn(
                  'text-2xl font-bold',
                  report.summary.overallAdherenceRate >= 80
                    ? 'text-green-500'
                    : report.summary.overallAdherenceRate >= 60
                    ? 'text-yellow-500'
                    : 'text-red-500'
                )}>
                  {report.summary.overallAdherenceRate}%
                </p>
                <ProgressBar
                  percentage={report.summary.overallAdherenceRate}
                  type="target"
                />
                <p className={cn('text-xs mt-1', darkMode ? 'text-slate-500' : 'text-slate-400')}>
                  {report.summary.totalMealsEaten}/{report.summary.totalMealsPlanned} meals
                </p>
              </div>

              {/* Avg Calories */}
              <div className={cardClass}>
                <p className={labelClass}>Avg Calories</p>
                <p className={cn('text-2xl font-bold', getMacroStatusColor(
                  Math.round((report.summary.avgDailyCalories / report.targets.dailyCalories) * 100), 'target'
                ))}>
                  {report.summary.avgDailyCalories}
                </p>
                <ProgressBar
                  percentage={Math.round((report.summary.avgDailyCalories / report.targets.dailyCalories) * 100)}
                  type="target"
                />
                <p className={cn('text-xs mt-1', darkMode ? 'text-slate-500' : 'text-slate-400')}>
                  Target: {report.targets.dailyCalories}
                </p>
              </div>

              {/* Avg Protein */}
              <div className={cardClass}>
                <p className={labelClass}>Avg Protein</p>
                <p className={cn('text-2xl font-bold', getMacroStatusColor(
                  Math.round((report.summary.avgDailyProtein / report.targets.dailyProtein) * 100), 'target'
                ))}>
                  {report.summary.avgDailyProtein}g
                </p>
                <ProgressBar
                  percentage={Math.round((report.summary.avgDailyProtein / report.targets.dailyProtein) * 100)}
                  type="target"
                />
                <p className={cn('text-xs mt-1', darkMode ? 'text-slate-500' : 'text-slate-400')}>
                  Target: {report.targets.dailyProtein}g
                </p>
              </div>

              {/* Avg Net Carbs */}
              <div className={cardClass}>
                <p className={labelClass}>Avg Net Carbs</p>
                <p className={cn('text-2xl font-bold', getMacroStatusColor(
                  Math.round((report.summary.avgDailyNetCarbs / report.targets.dailyNetCarbs) * 100), 'limit'
                ))}>
                  {report.summary.avgDailyNetCarbs}g
                </p>
                <ProgressBar
                  percentage={Math.round((report.summary.avgDailyNetCarbs / report.targets.dailyNetCarbs) * 100)}
                  type="limit"
                />
                <p className={cn('text-xs mt-1', darkMode ? 'text-slate-500' : 'text-slate-400')}>
                  Limit: {report.targets.dailyNetCarbs}g
                </p>
              </div>

              {/* Avg Fat */}
              <div className={cardClass}>
                <p className={labelClass}>Avg Fat</p>
                <p className={valueClass}>{report.summary.avgDailyFat}g</p>
                <div className="h-2" />
                <p className={cn('text-xs mt-1', darkMode ? 'text-slate-500' : 'text-slate-400')}>
                  Daily average
                </p>
              </div>

              {/* Avg Fiber */}
              <div className={cardClass}>
                <p className={labelClass}>Avg Fiber</p>
                <p className={valueClass}>{report.summary.avgDailyFiber}g</p>
                <div className="h-2" />
                <p className={cn('text-xs mt-1', darkMode ? 'text-slate-500' : 'text-slate-400')}>
                  Daily average
                </p>
              </div>
            </div>

            {/* Flags / Concerns */}
            {report.insights.flags.length > 0 && (
              <div className={cn(
                cardClass,
                'border-l-4 !border-l-yellow-500'
              )}>
                <h2 className={cn('text-sm font-semibold mb-2', 'text-yellow-600 dark:text-yellow-400')}>
                  Flags & Concerns
                </h2>
                <ul className="space-y-1">
                  {report.insights.flags.map((flag, i) => (
                    <li key={i} className={mutedText}>
                      <span className="text-yellow-500 mr-2">!</span>
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Meal Stats Row */}
            <div className={cardClass}>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className={cn('text-2xl font-bold', darkMode ? 'text-white' : 'text-slate-900')}>
                    {report.summary.totalDaysTracked}
                  </p>
                  <p className={labelClass}>Days Tracked</p>
                </div>
                <div>
                  <p className={cn('text-2xl font-bold', darkMode ? 'text-white' : 'text-slate-900')}>
                    {report.summary.totalMealsPlanned}
                  </p>
                  <p className={labelClass}>Planned</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-500">{report.summary.totalMealsEaten}</p>
                  <p className={labelClass}>Eaten</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-400">{report.summary.totalMealsSkipped}</p>
                  <p className={labelClass}>Skipped</p>
                </div>
              </div>
            </div>

            {/* ========== SECTION 2: Weekly Trend Overview ========== */}
            <div className={cn(cardClass, 'print:break-before-page')}>
              <h2 className={headingClass}>Weekly Trends</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={cn('border-b', darkMode ? 'border-slate-700' : 'border-slate-200')}>
                      <th className={cn('text-left py-2 px-1.5', darkMode ? 'text-slate-400' : 'text-slate-600')}>Week</th>
                      <th className={cn('text-right py-2 px-1.5', darkMode ? 'text-slate-400' : 'text-slate-600')}>Adhere</th>
                      <th className={cn('text-right py-2 px-1.5', darkMode ? 'text-slate-400' : 'text-slate-600')}>Cal</th>
                      <th className={cn('text-right py-2 px-1.5', darkMode ? 'text-slate-400' : 'text-slate-600')}>Prot</th>
                      <th className={cn('text-right py-2 px-1.5', darkMode ? 'text-slate-400' : 'text-slate-600')}>NC</th>
                      <th className={cn('text-right py-2 px-1.5', darkMode ? 'text-slate-400' : 'text-slate-600')}>Fat</th>
                      <th className={cn('text-right py-2 px-1.5', darkMode ? 'text-slate-400' : 'text-slate-600')}>Fiber</th>
                      <th className={cn('text-right py-2 px-1.5', darkMode ? 'text-slate-400' : 'text-slate-600')}>Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.weeklyBreakdown.map((week, idx) => {
                      const trend = report.insights.weeklyTrends[idx]
                      const calPct = report.targets.dailyCalories > 0
                        ? Math.round((week.avgCalories / report.targets.dailyCalories) * 100) : 0
                      const protPct = report.targets.dailyProtein > 0
                        ? Math.round((week.avgProtein / report.targets.dailyProtein) * 100) : 0
                      const ncPct = report.targets.dailyNetCarbs > 0
                        ? Math.round((week.avgNetCarbs / report.targets.dailyNetCarbs) * 100) : 0
                      const noData = week.totalMealsPlanned === 0

                      return (
                        <tr
                          key={week.weekOf}
                          className={cn('border-b', darkMode ? 'border-slate-700/50' : 'border-slate-100')}
                        >
                          <td className={cn('py-2 px-1.5 whitespace-nowrap', darkMode ? 'text-slate-300' : 'text-slate-700')}>
                            {format(new Date(week.weekOf + 'T12:00:00'), 'M/d')} - {format(new Date(week.weekEnd + 'T12:00:00'), 'M/d')}
                          </td>
                          <td className="text-right py-2 px-1.5">
                            <span className={cn(
                              'font-medium',
                              noData ? 'text-slate-500' :
                              week.adherenceRate >= 80 ? 'text-green-500' :
                              week.adherenceRate >= 60 ? 'text-yellow-500' : 'text-red-500'
                            )}>
                              {noData ? '-' : `${week.adherenceRate}%`}
                            </span>
                            {!noData && trend && idx > 0 && (
                              <span className="text-xs ml-1">
                                <TrendArrow delta={trend.adherenceDelta} />
                              </span>
                            )}
                          </td>
                          <td className="text-right py-2 px-1.5">
                            <div>
                              <span className={cn('text-sm', darkMode ? 'text-slate-300' : 'text-slate-700')}>
                                {week.avgCalories || '-'}
                              </span>
                              {!noData && trend && idx > 0 && (
                                <span className="text-xs ml-1"><TrendArrow delta={trend.caloriesDelta} /></span>
                              )}
                            </div>
                            {!noData && <ProgressBar percentage={calPct} type="target" small />}
                          </td>
                          <td className="text-right py-2 px-1.5">
                            <div>
                              <span className={cn('text-sm', darkMode ? 'text-slate-300' : 'text-slate-700')}>
                                {week.avgProtein ? `${week.avgProtein}g` : '-'}
                              </span>
                              {!noData && trend && idx > 0 && (
                                <span className="text-xs ml-1"><TrendArrow delta={trend.proteinDelta} /></span>
                              )}
                            </div>
                            {!noData && <ProgressBar percentage={protPct} type="target" small />}
                          </td>
                          <td className="text-right py-2 px-1.5">
                            <div>
                              <span className={cn('text-sm', darkMode ? 'text-slate-300' : 'text-slate-700')}>
                                {week.avgNetCarbs ? `${week.avgNetCarbs}g` : '-'}
                              </span>
                              {!noData && trend && idx > 0 && (
                                <span className="text-xs ml-1"><TrendArrowCarbs delta={trend.netCarbsDelta} /></span>
                              )}
                            </div>
                            {!noData && <ProgressBar percentage={ncPct} type="limit" small />}
                          </td>
                          <td className={cn('text-right py-2 px-1.5 text-sm', darkMode ? 'text-slate-300' : 'text-slate-700')}>
                            {week.avgFat ? `${week.avgFat}g` : '-'}
                          </td>
                          <td className={cn('text-right py-2 px-1.5 text-sm', darkMode ? 'text-slate-300' : 'text-slate-700')}>
                            {week.avgFiber ? `${week.avgFiber}g` : '-'}
                          </td>
                          <td className={cn('text-right py-2 px-1.5 text-sm', darkMode ? 'text-slate-300' : 'text-slate-700')}>
                            {week.daysTracked}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ========== SECTION 3: Detailed Weekly Breakdown ========== */}
            <div className="print:break-before-page">
              <h2 className={cn('text-sm font-semibold mb-3', darkMode ? 'text-slate-300' : 'text-slate-700')}>
                Detailed Breakdown
              </h2>
              <div className="space-y-3">
                {report.weeklyBreakdown.map((week) => {
                  const isExpanded = expandedWeeks[week.weekOf] || false
                  const noData = week.totalMealsPlanned === 0

                  return (
                    <div key={week.weekOf} className={cardClass}>
                      {/* Week Header (clickable) */}
                      <button
                        onClick={() => toggleWeek(week.weekOf)}
                        className="w-full flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-2">
                          <svg
                            className={cn(
                              'w-4 h-4 transition-transform',
                              darkMode ? 'text-slate-400' : 'text-slate-500',
                              isExpanded && 'rotate-90'
                            )}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span className={cn('font-medium text-sm', darkMode ? 'text-white' : 'text-slate-900')}>
                            {format(new Date(week.weekOf + 'T12:00:00'), 'MMM d')} - {format(new Date(week.weekEnd + 'T12:00:00'), 'MMM d')}
                          </span>
                        </div>
                        {!noData && (
                          <div className="flex items-center gap-3 text-xs">
                            <span className={cn(
                              'font-medium',
                              week.adherenceRate >= 80 ? 'text-green-500' :
                              week.adherenceRate >= 60 ? 'text-yellow-500' : 'text-red-500'
                            )}>
                              {week.adherenceRate}%
                            </span>
                            <span className={cn(darkMode ? 'text-slate-400' : 'text-slate-500')}>
                              {week.avgCalories} cal
                            </span>
                            <span className={cn(darkMode ? 'text-slate-400' : 'text-slate-500')}>
                              {week.avgProtein}g prot
                            </span>
                            <span className={cn(darkMode ? 'text-slate-400' : 'text-slate-500')}>
                              {week.daysTracked}d
                            </span>
                          </div>
                        )}
                        {noData && (
                          <span className={cn('text-xs', darkMode ? 'text-slate-600' : 'text-slate-400')}>No data</span>
                        )}
                      </button>

                      {/* Expanded: Day-by-day table */}
                      {isExpanded && (
                        <div className="mt-3 overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className={cn('border-b', darkMode ? 'border-slate-700' : 'border-slate-200')}>
                                <th className={cn('text-left py-1.5 px-1', darkMode ? 'text-slate-500' : 'text-slate-500')}>Date</th>
                                <th className={cn('text-right py-1.5 px-1', darkMode ? 'text-slate-500' : 'text-slate-500')}>Cal</th>
                                <th className={cn('text-right py-1.5 px-1', darkMode ? 'text-slate-500' : 'text-slate-500')}>Prot</th>
                                <th className={cn('text-right py-1.5 px-1', darkMode ? 'text-slate-500' : 'text-slate-500')}>NC</th>
                                <th className={cn('text-right py-1.5 px-1', darkMode ? 'text-slate-500' : 'text-slate-500')}>Fat</th>
                                <th className={cn('text-right py-1.5 px-1', darkMode ? 'text-slate-500' : 'text-slate-500')}>Fiber</th>
                                <th className={cn('text-right py-1.5 px-1', darkMode ? 'text-slate-500' : 'text-slate-500')}>Meals</th>
                                <th className={cn('text-center py-1.5 px-1', darkMode ? 'text-slate-500' : 'text-slate-500')}>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {week.days.map((day) => {
                                const isDayExpanded = expandedDays[day.date] || false
                                const hasData = day.mealsPlanned > 0
                                const allMet = day.calorieTargetMet && day.proteinTargetMet && day.carbsUnderLimit

                                return (
                                  <Fragment key={day.date}>
                                    <tr
                                      className={cn(
                                        'border-b cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30',
                                        darkMode ? 'border-slate-700/30' : 'border-slate-100'
                                      )}
                                      onClick={() => hasData && toggleDay(day.date)}
                                    >
                                      <td className={cn('py-1.5 px-1', darkMode ? 'text-slate-300' : 'text-slate-700')}>
                                        <div className="flex items-center gap-1">
                                          {hasData && (
                                            <svg
                                              className={cn('w-3 h-3 transition-transform', isDayExpanded && 'rotate-90')}
                                              fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                            >
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                          )}
                                          <span>{day.dayOfWeek.slice(0, 3)} {format(new Date(day.date + 'T12:00:00'), 'M/d')}</span>
                                        </div>
                                      </td>
                                      <td className={cn('text-right py-1.5 px-1', darkMode ? 'text-slate-300' : 'text-slate-700')}>
                                        {hasData ? day.totalCalories : '-'}
                                      </td>
                                      <td className={cn('text-right py-1.5 px-1', darkMode ? 'text-slate-300' : 'text-slate-700')}>
                                        {hasData ? `${day.totalProtein}g` : '-'}
                                      </td>
                                      <td className={cn('text-right py-1.5 px-1', darkMode ? 'text-slate-300' : 'text-slate-700')}>
                                        {hasData ? `${day.totalNetCarbs}g` : '-'}
                                      </td>
                                      <td className={cn('text-right py-1.5 px-1', darkMode ? 'text-slate-300' : 'text-slate-700')}>
                                        {hasData ? `${day.totalFat}g` : '-'}
                                      </td>
                                      <td className={cn('text-right py-1.5 px-1', darkMode ? 'text-slate-300' : 'text-slate-700')}>
                                        {hasData ? `${day.totalFiber}g` : '-'}
                                      </td>
                                      <td className={cn('text-right py-1.5 px-1', darkMode ? 'text-slate-300' : 'text-slate-700')}>
                                        {hasData ? `${day.mealsEaten}/${day.mealsPlanned}` : '-'}
                                      </td>
                                      <td className="text-center py-1.5 px-1">
                                        <div className="flex items-center justify-center gap-1">
                                          {hasData && <StatusDot met={allMet} />}
                                        </div>
                                      </td>
                                    </tr>

                                    {/* Expanded meal cards */}
                                    {isDayExpanded && (
                                      <tr>
                                        <td colSpan={8} className="p-0">
                                          <div className={cn('pl-6 pr-2 py-1.5 space-y-1.5', darkMode ? 'bg-slate-800/50' : 'bg-slate-50/50')}>
                                            {day.meals.map((meal, mIdx) => (
                                              <div
                                                key={`${day.date}-${mIdx}`}
                                                className={cn(
                                                  'rounded-lg px-3 py-2 border',
                                                  darkMode ? 'bg-slate-800 border-slate-700/50' : 'bg-white border-slate-200'
                                                )}
                                              >
                                                {/* Line 1: meal type + name + leftover badge */}
                                                <div className="flex items-start gap-1.5 flex-wrap">
                                                  <span className={cn('font-semibold text-xs shrink-0', darkMode ? 'text-slate-300' : 'text-slate-600')}>
                                                    {MEAL_TYPE_LABELS[meal.mealType] || meal.mealType}
                                                  </span>
                                                  <span className={cn('text-xs', darkMode ? 'text-slate-400' : 'text-slate-700')}>
                                                    {meal.mealName}
                                                  </span>
                                                  {meal.isLeftover && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 shrink-0">
                                                      Leftover
                                                    </span>
                                                  )}
                                                </div>
                                                {/* Line 2: macro pills + status */}
                                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                  <span className={cn('text-[11px] px-1.5 py-0.5 rounded', darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600')}>
                                                    {meal.calories} cal
                                                  </span>
                                                  <span className={cn('text-[11px] px-1.5 py-0.5 rounded', darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600')}>
                                                    {meal.protein}g prot
                                                  </span>
                                                  <span className={cn('text-[11px] px-1.5 py-0.5 rounded', darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600')}>
                                                    {meal.netCarbs}g NC
                                                  </span>
                                                  <span className={cn('text-[11px] px-1.5 py-0.5 rounded', darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600')}>
                                                    {meal.fat}g fat
                                                  </span>
                                                  <span className={cn('text-[11px] px-1.5 py-0.5 rounded', darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600')}>
                                                    {meal.fiber}g fiber
                                                  </span>
                                                  <span className={cn(
                                                    'text-[11px] px-1.5 py-0.5 rounded font-medium ml-auto',
                                                    meal.eaten
                                                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                                      : meal.skipped
                                                        ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                                                  )}>
                                                    {meal.eaten ? 'Eaten' : meal.skipped ? 'Skipped' : 'Planned'}
                                                  </span>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </Fragment>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ========== SECTION 4: Most Common Meals + Protocol Details ========== */}
            <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-4 print:break-before-page')}>
              {/* Most Common Meals */}
              {report.insights.mostCommonMeals.length > 0 && (
                <div className={cardClass}>
                  <h2 className={headingClass}>Most Common Meals</h2>
                  <div className="space-y-2">
                    {report.insights.mostCommonMeals.map((meal, i) => (
                      <div key={meal.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn('text-xs font-medium w-5 text-center', darkMode ? 'text-slate-500' : 'text-slate-400')}>
                            {i + 1}
                          </span>
                          <span className={cn('text-sm truncate max-w-[200px]', darkMode ? 'text-slate-300' : 'text-slate-700')}>
                            {meal.name}
                          </span>
                        </div>
                        <span className={cn('text-xs font-medium', darkMode ? 'text-slate-500' : 'text-slate-400')}>
                          {meal.count}x
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Protocol Details */}
              <div className={cardClass}>
                <h2 className={headingClass}>Protocol Details</h2>
                <ul className={cn('text-sm space-y-2', darkMode ? 'text-slate-400' : 'text-slate-600')}>
                  <li>
                    <span className="font-medium">Phase:</span> AIP {report.protocol.phase.replace('_', ' ')}
                  </li>
                  <li>
                    <span className="font-medium">Eating Window:</span> {report.protocol.eatingWindow}
                  </li>
                  {report.protocol.allowLeftovers && (
                    <li>
                      <span className="font-medium">Leftovers:</span> Within {report.protocol.maxLeftoverHours} hours (tyramine safety)
                    </li>
                  )}
                  {report.protocol.includeSmoothie && (
                    <li>
                      <span className="font-medium">Daily smoothie:</span> AIP berry protein smoothie
                    </li>
                  )}
                  {report.protocol.includeMorningCoffee && (
                    <li>
                      <span className="font-medium">Morning coffee:</span> MCT oil + mushroom blend (before eating window)
                    </li>
                  )}
                  {Object.entries(report.protocol.restrictionsByType).map(([type, items]) => (
                    <li key={type}>
                      <span className="font-medium">{restrictionLabel(type)}:</span>{' '}
                      {items.map(i => i.foodName).join(', ')}
                    </li>
                  ))}
                  {report.protocol.healthGoals.length > 0 && (
                    <li>
                      <span className="font-medium">Goals:</span>{' '}
                      {report.protocol.healthGoals.join(', ')}
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className={cn('text-center py-12', darkMode ? 'text-slate-400' : 'text-slate-600')}>
            No data available. Start tracking your meals to generate a report.
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:border {
            border: 1px solid #e5e7eb !important;
          }
          .print\\:border-gray-300 {
            border-color: #d1d5db !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:break-before-page {
            break-before: page !important;
          }
          .print\\:grid-cols-3 {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
          /* Force dark mode overrides for print */
          .dark\\:bg-slate-800,
          .dark\\:bg-slate-900,
          .dark\\:bg-slate-700 {
            background: white !important;
          }
          .dark\\:text-white,
          .dark\\:text-slate-300,
          .dark\\:text-slate-400 {
            color: #1e293b !important;
          }
          .dark\\:text-slate-500 {
            color: #64748b !important;
          }
          .dark\\:border-slate-700,
          .dark\\:border-slate-800 {
            border-color: #e2e8f0 !important;
          }
          /* Progress bar colors print */
          .bg-green-500, .bg-yellow-500, .bg-red-500, .bg-slate-400 {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .bg-green-500 { background-color: #22c55e !important; }
          .bg-yellow-500 { background-color: #eab308 !important; }
          .bg-red-500 { background-color: #ef4444 !important; }
          /* Status dots */
          span.bg-green-500, span.bg-yellow-500 {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  )
}

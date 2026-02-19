'use client'

import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from 'date-fns'
import { ChefHat, Database, BarChart3, Home, ChevronLeft, ChevronRight, Settings, ArrowLeft, X, Clock, Users, Search, Coffee, CupSoda, Salad, Drumstick, UtensilsCrossed, Apple, LeafyGreen, Zap, Trash2 } from 'lucide-react'
import type { LucideProps } from 'lucide-react'

type IconComponent = React.ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>>
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import { DailyMacroProgress } from '@/components/aip-diet'
import { AIPWeekGrid } from '@/components/aip-diet/AIPWeekGrid'

import { STANDARD_AIP_MEALS } from '@/lib/macro-calculator'
import type { AIPQuestionnaire, AIPMealEntry, MealType } from '@prisma/client'

const MEAL_TYPES: MealType[] = [
  'MORNING_COFFEE',
  'SMOOTHIE',
  'LUNCH',
  'AFTERNOON_SNACK',
  'DINNER',
  'EVENING_SNACK',
  'EXTRA_SNACKS',
]

// Extended type that includes linked recipe
interface MealEntryWithRecipe extends AIPMealEntry {
  recipe?: {
    id: string
    name: string
    calories: number | null
    protein: number | null
    carbs: number | null
    fiber: number | null
    fat: number | null
    netCarbs: number | null
    servings: number | null
    ingredients?: unknown[]
    instructions?: string
  } | null
}

interface AIPDailyLog {
  id: string
  date: string
  meals: MealEntryWithRecipe[]
}

interface AIPWeekData {
  weekStart: string
  dailyLogs: AIPDailyLog[]
  dailyMacros: Record<string, {
    calories: number
    protein: number
    carbs: number
    fiber: number
    netCarbs: number
    fat: number
  }>
}

interface Ingredient {
  item: string
  quantity?: string
  unit?: string
}

interface Recipe {
  id: string
  name: string
  calories: number | null
  protein: number | null
  carbs: number | null
  fiber: number | null
  fat: number | null
  netCarbs: number | null
  isAIPCompliant: boolean
  ingredients?: Ingredient[]
  instructions?: string
  servings?: number | null
}

export default function AIPDietPage() {
  const { darkMode } = useTheme()
  const queryClient = useQueryClient()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showMealModal, setShowMealModal] = useState(false)
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null)
  const [selectedMealDate, setSelectedMealDate] = useState<Date | null>(null)
  const [mealSearchQuery, setMealSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week')

  // Default to day view on mobile
  useEffect(() => {
    if (window.innerWidth < 640) {
      setViewMode('day')
    }
  }, [])
  const [viewingMeal, setViewingMeal] = useState<MealEntryWithRecipe | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // Auto-reset inline delete confirm after 3 seconds
  useEffect(() => {
    if (confirmDeleteId) {
      const timer = setTimeout(() => setConfirmDeleteId(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [confirmDeleteId])

  // Fetch questionnaire
  const { data: questionnaire, isLoading: loadingQuestionnaire } =
    useQuery<AIPQuestionnaire | null>({
      queryKey: ['aipQuestionnaire'],
      queryFn: async () => {
        const res = await fetch('/api/aip-diet/questionnaire')
        if (!res.ok) return null
        return res.json()
      },
    })

  // Fetch AIP recipes
  const { data: aipRecipes } = useQuery<Recipe[]>({
    queryKey: ['aipRecipes'],
    queryFn: async () => {
      const res = await fetch('/api/recipes?tag=aip')
      if (!res.ok) return []
      const data = await res.json()
      return data.recipes || []
    },
  })

  // Fetch AIP meals for current week
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 })
  const { data: aipWeekData } = useQuery<AIPWeekData | null>({
    queryKey: ['aipMeals', format(weekStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      const res = await fetch(
        `/api/aip-diet/meals?weekOf=${format(weekStart, 'yyyy-MM-dd')}`
      )
      if (!res.ok) return null
      return res.json()
    },
  })

  // Add meal mutation
  const addMealMutation = useMutation({
    mutationFn: async (data: {
      date: string
      mealType: MealType
      mealName: string
      calories?: number
      protein?: number
      carbs?: number
      fiber?: number
      fat?: number
      netCarbs?: number
    }) => {
      const res = await fetch('/api/aip-diet/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to add meal')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aipMeals'] })
      setShowMealModal(false)
      setSelectedMealType(null)
      setSelectedMealDate(null)
    },
  })

  // Track meal mutation
  const trackMealMutation = useMutation({
    mutationFn: async (data: { entryId: string; eaten?: boolean; skipped?: boolean; actualServings?: number }) => {
      const res = await fetch('/api/aip-diet/meals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to track meal')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aipMeals'] })
    },
  })

  // Delete meal mutation
  const deleteMealMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const res = await fetch(`/api/aip-diet/meals?entryId=${entryId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete meal')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aipMeals'] })
      setViewingMeal(null)
    },
  })

  // Handle meal click from grid
  const handleMealClick = (date: Date, mealType: MealType, meal: AIPMealEntry | null) => {
    if (!meal) {
      setSelectedMealDate(date)
      setSelectedMealType(mealType)
      setShowMealModal(true)
    }
  }

  // Handle quick add from recipe
  const handleQuickAddFromRecipe = (recipe: Recipe) => {
    if (!selectedMealDate || !selectedMealType) return
    addMealMutation.mutate({
      date: format(selectedMealDate, 'yyyy-MM-dd'),
      mealType: selectedMealType,
      mealName: recipe.name,
      calories: recipe.calories || undefined,
      protein: recipe.protein || undefined,
      carbs: recipe.carbs || undefined,
      fiber: recipe.fiber || undefined,
      fat: recipe.fat || undefined,
      netCarbs: recipe.netCarbs || undefined,
    })
  }

  // Week navigation
  const goToPreviousWeek = () => setSelectedDate(subWeeks(selectedDate, 1))
  const goToNextWeek = () => setSelectedDate(addWeeks(selectedDate, 1))
  const goToToday = () => setSelectedDate(new Date())

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Filter meal types based on questionnaire settings
  const activeMealTypes = MEAL_TYPES.filter((t) => {
    if (t === 'MORNING_COFFEE' && questionnaire && !questionnaire.includeMorningCoffee) return false
    if (t === 'SMOOTHIE' && questionnaire && !questionnaire.includeSmoothie) return false
    if (t === 'EVENING_SNACK' && questionnaire && !questionnaire.includeSnack) return false
    return true
  })

  // Get meals for selected date (for day view)
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')
  const dailyLogForDate = aipWeekData?.dailyLogs?.find(
    (log) => log.date.split('T')[0] === selectedDateStr
  )
  const mealsForDate = dailyLogForDate?.meals || []

  // Calculate week summary - use recipe macros when available
  const weekTotals = aipWeekData?.dailyLogs?.reduce(
    (acc, log) => {
      const dayTotals = log.meals.reduce(
        (dayAcc, meal) => {
          const s = meal.actualServings ?? meal.servings ?? 1
          return {
            calories: dayAcc.calories + (meal.recipe?.calories ?? meal.calories ?? 0) * s,
            protein: dayAcc.protein + (meal.recipe?.protein ?? meal.protein ?? 0) * s,
            netCarbs: dayAcc.netCarbs + (meal.recipe?.netCarbs ?? meal.netCarbs ?? 0) * s,
            mealsEaten: dayAcc.mealsEaten + (meal.eaten ? 1 : 0),
            mealsTotal: dayAcc.mealsTotal + 1,
          }
        },
        { calories: 0, protein: 0, netCarbs: 0, mealsEaten: 0, mealsTotal: 0 }
      )
      return {
        calories: acc.calories + dayTotals.calories,
        protein: acc.protein + dayTotals.protein,
        netCarbs: acc.netCarbs + dayTotals.netCarbs,
        mealsEaten: acc.mealsEaten + dayTotals.mealsEaten,
        mealsTotal: acc.mealsTotal + dayTotals.mealsTotal,
        daysWithData: acc.daysWithData + (log.meals.length > 0 ? 1 : 0),
      }
    },
    { calories: 0, protein: 0, netCarbs: 0, mealsEaten: 0, mealsTotal: 0, daysWithData: 0 }
  ) || { calories: 0, protein: 0, netCarbs: 0, mealsEaten: 0, mealsTotal: 0, daysWithData: 0 }

  if (loadingQuestionnaire) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center', darkMode ? 'bg-slate-900' : 'bg-slate-50')}>
        <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!questionnaire) {
    return (
      <div className={cn('min-h-screen p-4', darkMode ? 'bg-slate-900' : 'bg-slate-50')}>
        <div className="max-w-md mx-auto py-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <Salad className="w-10 h-10 text-green-500" />
          </div>
          <h1 className={cn('text-2xl font-bold mb-4', darkMode ? 'text-white' : 'text-slate-900')}>
            Welcome to AIP Diet
          </h1>
          <p className={cn('text-sm mb-8', darkMode ? 'text-slate-400' : 'text-slate-600')}>
            Let&apos;s set up your personalized AIP meal plan with custom macro targets.
          </p>
          <Link
            href="/aip-diet/onboarding"
            className="inline-block px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600"
          >
            Get Started
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('h-screen flex flex-col', darkMode ? 'bg-slate-900' : 'bg-slate-50')}>
      {/* Compact Header with Stats */}
      <div className={cn(
        'flex-shrink-0 px-3 py-2 border-b',
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      )}>
        {/* Top row: Back + Title + View toggle + Settings */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className={cn('p-2 rounded-lg transition-colors touch-manipulation', darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className={cn('text-lg font-bold', darkMode ? 'text-white' : 'text-slate-900')}>
              AIP Diet
            </h1>
          </div>

          <div className="flex gap-1 items-center">
            <div className={cn('flex rounded-lg p-0.5', darkMode ? 'bg-slate-800' : 'bg-slate-100')}>
              <button
                onClick={() => setViewMode('week')}
                className={cn(
                  'px-2.5 py-1.5 text-xs rounded touch-manipulation',
                  viewMode === 'week'
                    ? 'bg-green-500 text-white'
                    : darkMode ? 'text-slate-400' : 'text-slate-600'
                )}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={cn(
                  'px-2.5 py-1.5 text-xs rounded touch-manipulation',
                  viewMode === 'day'
                    ? 'bg-green-500 text-white'
                    : darkMode ? 'text-slate-400' : 'text-slate-600'
                )}
              >
                Day
              </button>
            </div>
            <Link
              href="/aip-diet/onboarding"
              className={cn('p-2 rounded-lg transition-colors touch-manipulation', darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600')}
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Week Stats - grid for mobile, flex for desktop */}
        <div className="grid grid-cols-4 gap-2 mt-2 sm:flex sm:items-center sm:justify-center sm:gap-4">
          <div className={cn('text-center px-2 py-1 rounded-lg', darkMode ? 'bg-slate-800/50' : 'bg-slate-50')}>
            <span className={cn('text-base sm:text-lg font-bold', darkMode ? 'text-green-400' : 'text-green-600')}>
              {weekTotals.daysWithData > 0 ? Math.round(weekTotals.calories / weekTotals.daysWithData) : 0}
            </span>
            <span className={cn('text-[10px] ml-1', darkMode ? 'text-slate-500' : 'text-slate-500')}>cal</span>
          </div>
          <div className={cn('text-center px-2 py-1 rounded-lg', darkMode ? 'bg-slate-800/50' : 'bg-slate-50')}>
            <span className={cn('text-base sm:text-lg font-bold', darkMode ? 'text-blue-400' : 'text-blue-600')}>
              {weekTotals.daysWithData > 0 ? Math.round(weekTotals.protein / weekTotals.daysWithData) : 0}g
            </span>
            <span className={cn('text-[10px] ml-1', darkMode ? 'text-slate-500' : 'text-slate-500')}>prot</span>
          </div>
          <div className={cn('text-center px-2 py-1 rounded-lg', darkMode ? 'bg-slate-800/50' : 'bg-slate-50')}>
            <span className={cn('text-base sm:text-lg font-bold', darkMode ? 'text-orange-400' : 'text-orange-600')}>
              {weekTotals.daysWithData > 0 ? Math.round(weekTotals.netCarbs / weekTotals.daysWithData) : 0}g
            </span>
            <span className={cn('text-[10px] ml-1', darkMode ? 'text-slate-500' : 'text-slate-500')}>carb</span>
          </div>
          <div className={cn('text-center px-2 py-1 rounded-lg', darkMode ? 'bg-slate-800/50' : 'bg-slate-50')}>
            <span className={cn('text-base sm:text-lg font-bold', darkMode ? 'text-purple-400' : 'text-purple-600')}>
              {weekTotals.mealsTotal > 0 ? Math.round((weekTotals.mealsEaten / weekTotals.mealsTotal) * 100) : 0}%
            </span>
            <span className={cn('text-[10px] ml-1', darkMode ? 'text-slate-500' : 'text-slate-500')}>done</span>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mt-2">
          <button onClick={goToPreviousWeek} className={cn('p-2 rounded-lg transition-colors touch-manipulation', darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600')}>
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className={cn('text-sm font-medium', darkMode ? 'text-slate-300' : 'text-slate-700')}>
              {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </span>
            {!isSameDay(startOfWeek(new Date(), { weekStartsOn: 0 }), weekStart) && (
              <button
                onClick={goToToday}
                className={cn('px-2 py-0.5 text-xs rounded touch-manipulation', darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700')}
              >
                Today
              </button>
            )}
          </div>

          <button onClick={goToNextWeek} className={cn('p-2 rounded-lg transition-colors touch-manipulation', darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600')}>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day selector for day view */}
        {viewMode === 'day' && (
          <div className="flex gap-1 mt-2 overflow-x-auto pb-1">
            {weekDays.map((day) => {
              const isSelected = isSameDay(day, selectedDate)
              const isDayToday = isSameDay(day, new Date())
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    'flex-1 min-w-[44px] py-2 rounded text-center transition-colors touch-manipulation',
                    isSelected
                      ? 'bg-green-500 text-white'
                      : isDayToday
                      ? darkMode ? 'bg-slate-800 text-green-400' : 'bg-green-100 text-green-700'
                      : darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'
                  )}
                >
                  <p className="text-[10px] font-medium">{format(day, 'EEE')}</p>
                  <p className="text-sm font-bold">{format(day, 'd')}</p>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Content - fills remaining space */}
      <div className="flex-1 p-2 overflow-auto pb-14">
        {viewMode === 'week' ? (
          /* Week Grid View - horizontally scrollable on mobile */
          <div className={cn('p-2 rounded-lg overflow-x-auto -mx-2 sm:mx-0', darkMode ? 'bg-slate-800' : 'bg-white border border-slate-200')}>
            <div className="min-w-[800px] sm:min-w-0">
            <AIPWeekGrid
              weekDays={weekDays}
              dailyLogs={aipWeekData?.dailyLogs || []}
              mealTypes={activeMealTypes}
              darkMode={darkMode}
              onMealClick={handleMealClick}
              onViewMeal={(meal) => setViewingMeal(meal)}
              onMarkEaten={(meal, eaten) => trackMealMutation.mutate({ entryId: meal.id, eaten })}
              onMarkSkipped={(meal, skipped) => trackMealMutation.mutate({ entryId: meal.id, skipped })}
            />
            </div>
          </div>
        ) : (
          /* Day View */
          <>
            <DailyMacroProgress
              meals={mealsForDate}
              targets={{
                calories: questionnaire.dailyCalories,
                protein: questionnaire.dailyProtein,
                netCarbs: questionnaire.dailyNetCarbs,
              }}
              darkMode={darkMode}
            />

            <div className="space-y-2">
              {activeMealTypes.map((mealType) => {
                const config = {
                  MORNING_COFFEE: { label: 'Morning Coffee', icon: Coffee, color: 'bg-amber-500' },
                  SMOOTHIE: { label: 'Smoothie', icon: CupSoda, color: 'bg-purple-500' },
                  LUNCH: { label: 'Lunch', icon: Salad, color: 'bg-green-500' },
                  AFTERNOON_SNACK: { label: 'Afternoon Snack', icon: Drumstick, color: 'bg-blue-500' },
                  DINNER: { label: 'Dinner', icon: UtensilsCrossed, color: 'bg-orange-500' },
                  EVENING_SNACK: { label: 'Evening Snack', icon: Apple, color: 'bg-pink-500' },
                  EXTRA_SNACKS: { label: 'Extra Snacks', icon: LeafyGreen, color: 'bg-lime-500' },
                }[mealType]

                // Helper to render a single meal card (shared by regular meals and extra snacks)
                const renderMealCard = (meal: MealEntryWithRecipe, showLabel: boolean) => {
                  const isConfirming = confirmDeleteId === meal.id
                  return (
                    <div
                      key={meal.id}
                      onClick={() => setViewingMeal(meal)}
                      className={cn(
                        'p-3 rounded-lg border cursor-pointer active:scale-[0.98] transition-all',
                        meal.eaten
                          ? darkMode ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-300'
                          : meal.skipped
                          ? darkMode ? 'bg-slate-800/50 border-slate-700 opacity-60' : 'bg-slate-100 border-slate-300 opacity-60'
                          : darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {showLabel && (
                            <span className={cn('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0', config.color)}>
                              {config && <config.icon className="w-3.5 h-3.5 text-white" />}
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            {showLabel && (
                              <p className={cn('text-sm font-medium', darkMode ? 'text-slate-200' : 'text-slate-800')}>
                                {config.label}
                              </p>
                            )}
                            <div className="flex items-center gap-1">
                              <p className={cn('text-xs truncate', darkMode ? 'text-slate-400' : 'text-slate-500')}>
                                {meal.mealName}
                              </p>
                              <ChevronRight className={cn('w-3 h-3 flex-shrink-0', darkMode ? 'text-slate-600' : 'text-slate-400')} />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className={cn('text-xs', darkMode ? 'text-slate-500' : 'text-slate-400')}>
                            {Math.round((meal.recipe?.calories ?? meal.calories ?? 0) * (meal.actualServings ?? meal.servings ?? 1))} cal | {Math.round((meal.recipe?.protein ?? meal.protein ?? 0) * (meal.actualServings ?? meal.servings ?? 1))}p
                          </span>
                          {!meal.eaten && !meal.skipped && (
                            <button
                              onClick={(e) => { e.stopPropagation(); trackMealMutation.mutate({ entryId: meal.id, eaten: true }) }}
                              className="px-2.5 py-1.5 text-xs bg-green-500 text-white rounded touch-manipulation"
                            >
                              ✓
                            </button>
                          )}
                          {meal.eaten && (
                            <span className="px-2.5 py-1.5 text-xs bg-green-500/20 text-green-500 rounded">Done</span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (isConfirming) {
                                deleteMealMutation.mutate(meal.id)
                                setConfirmDeleteId(null)
                              } else {
                                setConfirmDeleteId(meal.id)
                              }
                            }}
                            className={cn(
                              'p-1.5 rounded transition-colors touch-manipulation',
                              isConfirming
                                ? 'bg-red-500 text-white'
                                : darkMode ? 'text-slate-600 hover:text-red-400 hover:bg-slate-700' : 'text-slate-400 hover:text-red-500 hover:bg-slate-100'
                            )}
                            title={isConfirming ? 'Tap again to confirm' : 'Remove meal'}
                          >
                            {isConfirming ? <X className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                }

                // EXTRA_SNACKS: show all snacks individually + add button
                if (mealType === 'EXTRA_SNACKS') {
                  const extraSnacks = mealsForDate.filter((m) => m.mealType === 'EXTRA_SNACKS')
                  return (
                    <div key={mealType} className="space-y-2">
                      {/* Section header */}
                      <div className="flex items-center gap-2 pt-1">
                        <span className={cn('w-6 h-6 rounded-full flex items-center justify-center', config.color)}>
                          {config && <config.icon className="w-3.5 h-3.5 text-white" />}
                        </span>
                        <p className={cn('text-sm font-medium', darkMode ? 'text-slate-200' : 'text-slate-800')}>
                          {config.label}
                        </p>
                      </div>

                      {/* Individual snack cards */}
                      {extraSnacks.map((snack) => renderMealCard(snack, false))}

                      {/* Add extra snack button */}
                      <button
                        onClick={() => {
                          setSelectedMealDate(selectedDate)
                          setSelectedMealType('EXTRA_SNACKS')
                          setShowMealModal(true)
                        }}
                        className={cn(
                          'w-full p-3 rounded-lg border border-dashed text-xs touch-manipulation transition-colors',
                          darkMode ? 'border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-400' : 'border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-600'
                        )}
                      >
                        + Add Extra Snack
                      </button>
                    </div>
                  )
                }

                // Regular meal types
                const meal = mealsForDate.find((m) => m.mealType === mealType)

                if (meal) {
                  return renderMealCard(meal, true)
                }

                // Empty state - no meal assigned yet
                return (
                  <div
                    key={mealType}
                    className={cn(
                      'p-3 rounded-lg border',
                      darkMode ? 'bg-slate-800/50 border-dashed border-slate-700' : 'bg-slate-50 border-dashed border-slate-300'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn('w-6 h-6 rounded-full flex items-center justify-center', config.color)}>
                          {config && <config.icon className="w-3.5 h-3.5 text-white" />}
                        </span>
                        <p className={cn('text-sm font-medium', darkMode ? 'text-slate-200' : 'text-slate-800')}>
                          {config.label}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedMealDate(selectedDate)
                          setSelectedMealType(mealType)
                          setShowMealModal(true)
                        }}
                        className={cn('px-4 py-1.5 text-xs rounded touch-manipulation', darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700')}
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Fixed Bottom Navigation */}
      <div className={cn(
        'fixed bottom-0 left-0 right-0 flex justify-around sm:justify-center items-center sm:gap-2 py-2 sm:py-3 px-2 sm:px-4 border-t',
        darkMode ? 'bg-slate-900/95 border-slate-800 backdrop-blur-sm' : 'bg-white/95 border-slate-200 backdrop-blur-sm'
      )}>
        <Link
          href="/"
          className={cn(
            'flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors touch-manipulation',
            darkMode
              ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
          )}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] sm:text-sm font-medium">Home</span>
        </Link>
        <Link
          href="/recipes?tag=aip"
          className={cn(
            'flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors touch-manipulation',
            darkMode
              ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
          )}
        >
          <ChefHat className="w-5 h-5" />
          <span className="text-[10px] sm:text-sm font-medium">Recipes</span>
        </Link>
        <Link
          href="/aip-diet/foods"
          className={cn(
            'flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors touch-manipulation',
            darkMode
              ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
          )}
        >
          <Database className="w-5 h-5" />
          <span className="text-[10px] sm:text-sm font-medium">Foods</span>
        </Link>
        <Link
          href="/aip-diet/report"
          className={cn(
            'flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors touch-manipulation',
            darkMode
              ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
          )}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] sm:text-sm font-medium">Report</span>
        </Link>
      </div>

      {/* Add Meal Modal */}
      {showMealModal && selectedMealType && selectedMealDate && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 md:p-8"
          onClick={() => {
            setShowMealModal(false)
            setSelectedMealType(null)
            setSelectedMealDate(null)
            setMealSearchQuery('')
          }}
        >
          <div className={cn('absolute inset-0', darkMode ? 'bg-black/80' : 'bg-black/60')} />
          <div
            className={cn('relative w-full sm:max-w-lg max-h-[85vh] sm:max-h-[80vh] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl', darkMode ? 'bg-slate-800' : 'bg-white')}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle for mobile */}
            <div className="flex justify-center pt-2 sm:hidden">
              <div className={cn('w-10 h-1 rounded-full', darkMode ? 'bg-slate-600' : 'bg-slate-300')} />
            </div>
            <div className="flex justify-between items-center p-4 border-b border-slate-700">
              <div>
                <h3 className={cn('text-lg font-bold', darkMode ? 'text-white' : 'text-slate-900')}>
                  Add {selectedMealType.replace(/_/g, ' ').toLowerCase()}
                </h3>
                <p className={cn('text-xs', darkMode ? 'text-slate-500' : 'text-slate-500')}>
                  {format(selectedMealDate, 'EEEE, MMMM d')}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowMealModal(false)
                  setSelectedMealType(null)
                  setSelectedMealDate(null)
                  setMealSearchQuery('')
                }}
                className={cn(
                  'p-2 rounded-full transition-colors',
                  darkMode
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search input */}
            <div className="px-4 pt-3">
              <div className={cn('relative rounded-lg', darkMode ? 'bg-slate-700' : 'bg-slate-100')}>
                <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4', darkMode ? 'text-slate-400' : 'text-slate-500')} />
                <input
                  type="text"
                  placeholder="Search recipes..."
                  value={mealSearchQuery}
                  onChange={(e) => setMealSearchQuery(e.target.value)}
                  autoFocus
                  className={cn(
                    'w-full pl-10 pr-4 py-2.5 rounded-lg text-sm bg-transparent outline-none',
                    darkMode ? 'text-white placeholder-slate-400' : 'text-slate-900 placeholder-slate-500'
                  )}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Standard meal quick add - uses actual recipe data (hide when searching) */}
              {!mealSearchQuery && (() => {
                // Find matching recipe for this meal type's standard meal
                const standardMealName = STANDARD_AIP_MEALS[selectedMealType]?.name
                const matchingRecipe = standardMealName
                  ? aipRecipes?.find(r => r.name.toLowerCase().includes(standardMealName.toLowerCase().replace('aip ', '')))
                  : null
                const displayRecipe = matchingRecipe || (STANDARD_AIP_MEALS[selectedMealType] ? {
                  name: STANDARD_AIP_MEALS[selectedMealType].name,
                  calories: STANDARD_AIP_MEALS[selectedMealType].calories,
                  protein: STANDARD_AIP_MEALS[selectedMealType].protein,
                  netCarbs: STANDARD_AIP_MEALS[selectedMealType].netCarbs,
                } : null)

                return displayRecipe && (
                  <button
                    onClick={() => {
                      if (!selectedMealDate || !selectedMealType) return
                      addMealMutation.mutate({
                        date: format(selectedMealDate, 'yyyy-MM-dd'),
                        mealType: selectedMealType,
                        mealName: matchingRecipe?.name || STANDARD_AIP_MEALS[selectedMealType]?.name || '',
                      })
                    }}
                    disabled={addMealMutation.isPending}
                    className={cn(
                      'w-full p-3 rounded-lg text-left transition-colors',
                      darkMode
                        ? 'bg-green-900/30 hover:bg-green-900/50 border border-green-700'
                        : 'bg-green-50 hover:bg-green-100 border border-green-200'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      <div className="flex-1">
                        <p className={cn('font-medium text-sm', darkMode ? 'text-green-300' : 'text-green-700')}>
                          {displayRecipe.name}
                        </p>
                        <p className={cn('text-xs', darkMode ? 'text-green-400/70' : 'text-green-600')}>
                          {Math.round(displayRecipe.calories || 0)} cal • {Math.round(displayRecipe.protein || 0)}g P • {Math.round(displayRecipe.netCarbs || 0)}g NC
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })()}

              {/* AIP Recipes */}
              {aipRecipes && aipRecipes.length > 0 && (() => {
                const searchLower = mealSearchQuery.toLowerCase().trim()
                const filteredRecipes = aipRecipes.filter((r) => {
                  const name = r.name.toLowerCase()
                  // If searching, match against search query across all recipes
                  if (searchLower) {
                    return name.includes(searchLower)
                  }
                  // Default filtering by meal type when not searching
                  if (selectedMealType === 'MORNING_COFFEE') return name.includes('coffee')
                  if (selectedMealType === 'SMOOTHIE') return name.includes('smoothie')
                  if (selectedMealType === 'AFTERNOON_SNACK' || selectedMealType === 'EVENING_SNACK') {
                    return name.includes('broth') || name.includes('collagen') || name.includes('apple') || name.includes('snack')
                  }
                  if (selectedMealType === 'EXTRA_SNACKS') {
                    // Show all recipes for extra snacks -- any food can be a snack
                    return true
                  }
                  // Lunch/Dinner: show protein-based meals and pizza
                  return name.includes('chicken') || name.includes('beef') || name.includes('turkey') || name.includes('pork') || name.includes('pizza')
                })

                return filteredRecipes.length > 0 ? (
                  <>
                    <p className={cn('text-xs font-medium', darkMode ? 'text-slate-400' : 'text-slate-600')}>
                      {searchLower ? `Results for "${mealSearchQuery}"` : 'From AIP Recipes'}
                    </p>
                    {filteredRecipes.map((recipe) => (
                      <button
                        key={recipe.id}
                        onClick={() => handleQuickAddFromRecipe(recipe)}
                        disabled={addMealMutation.isPending}
                        className={cn(
                          'w-full p-3 rounded-lg text-left transition-colors',
                          darkMode
                            ? 'bg-slate-700 hover:bg-slate-600'
                            : 'bg-slate-100 hover:bg-slate-200'
                        )}
                      >
                        <p className={cn('font-medium text-sm', darkMode ? 'text-slate-200' : 'text-slate-800')}>
                          {recipe.name.replace(/^AIP\s+/i, '')}
                        </p>
                        {recipe.calories && (
                          <p className={cn('text-xs', darkMode ? 'text-slate-400' : 'text-slate-500')}>
                            {Math.round(recipe.calories)} cal • {Math.round(recipe.protein || 0)}g P • {Math.round(recipe.netCarbs || 0)}g NC
                          </p>
                        )}
                      </button>
                    ))}
                  </>
                ) : searchLower ? (
                  <p className={cn('text-sm text-center py-4', darkMode ? 'text-slate-500' : 'text-slate-400')}>
                    No recipes matching &ldquo;{mealSearchQuery}&rdquo;
                  </p>
                ) : null
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Meal Detail Popup */}
      {viewingMeal && (
        <MealDetailPopup
          meal={viewingMeal}
          recipes={aipRecipes || []}
          darkMode={darkMode}
          onClose={() => setViewingMeal(null)}
          onMarkEaten={(eaten) => {
            trackMealMutation.mutate({ entryId: viewingMeal.id, eaten })
            if (eaten) setViewingMeal(null)
          }}
          onMarkSkipped={(skipped) => {
            trackMealMutation.mutate({ entryId: viewingMeal.id, skipped })
            if (skipped) setViewingMeal(null)
          }}
          onDelete={() => deleteMealMutation.mutate(viewingMeal.id)}
          onUpdateServings={(servings) => trackMealMutation.mutate({ entryId: viewingMeal.id, actualServings: servings })}
        />
      )}
    </div>
  )
}

// Helper function to scale ingredient quantities
function scaleIngredient(ingredient: Ingredient, multiplier: number): Ingredient {
  if (!ingredient.quantity || multiplier === 1) return ingredient

  // Try to parse the quantity as a number
  const numericMatch = ingredient.quantity.match(/^([\d.\/]+)(.*)$/)
  if (!numericMatch) return ingredient

  let numericPart = numericMatch[1]
  const textPart = numericMatch[2] || ''

  // Handle fractions like "1/2", "1/4"
  let value: number
  if (numericPart.includes('/')) {
    const [numerator, denominator] = numericPart.split('/')
    value = parseFloat(numerator) / parseFloat(denominator)
  } else {
    value = parseFloat(numericPart)
  }

  if (isNaN(value)) return ingredient

  // Scale the value
  const scaledValue = value * multiplier

  // Format the result - keep fractions reasonable, otherwise use decimals
  let formattedValue: string
  if (scaledValue === Math.floor(scaledValue)) {
    formattedValue = scaledValue.toString()
  } else if (Math.abs(scaledValue - 0.25) < 0.01) {
    formattedValue = '1/4'
  } else if (Math.abs(scaledValue - 0.5) < 0.01) {
    formattedValue = '1/2'
  } else if (Math.abs(scaledValue - 0.75) < 0.01) {
    formattedValue = '3/4'
  } else if (Math.abs(scaledValue - 0.33) < 0.01) {
    formattedValue = '1/3'
  } else if (Math.abs(scaledValue - 0.67) < 0.01) {
    formattedValue = '2/3'
  } else {
    // Round to 1 decimal place for cleaner display
    formattedValue = (Math.round(scaledValue * 10) / 10).toString()
  }

  return {
    ...ingredient,
    quantity: formattedValue + textPart,
  }
}

// Meal detail popup component - matches display page RecipePopup style
function MealDetailPopup({
  meal,
  recipes,
  darkMode,
  onClose,
  onMarkEaten,
  onMarkSkipped,
  onDelete,
  onUpdateServings,
}: {
  meal: MealEntryWithRecipe
  recipes: Recipe[]
  darkMode: boolean
  onClose: () => void
  onMarkEaten: (eaten: boolean) => void
  onMarkSkipped: (skipped: boolean) => void
  onDelete: () => void
  onUpdateServings: (servings: number) => void
}) {
  const [servingMultiplier, setServingMultiplier] = useState(meal.actualServings ?? meal.servings ?? 1)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const savedServings = meal.actualServings ?? meal.servings ?? 1
  const hasUnsavedServings = servingMultiplier !== savedServings

  const MEAL_TYPE_CONFIG: Record<MealType, { label: string; icon: IconComponent; gradient: string; gradientDark: string }> = {
    MORNING_COFFEE: { label: 'Morning Coffee', icon: Coffee, gradient: 'from-amber-500 to-yellow-500', gradientDark: 'from-amber-900 to-yellow-900' },
    SMOOTHIE: { label: 'Smoothie', icon: CupSoda, gradient: 'from-purple-500 to-pink-500', gradientDark: 'from-purple-900 to-pink-900' },
    LUNCH: { label: 'Lunch', icon: Salad, gradient: 'from-green-500 to-emerald-500', gradientDark: 'from-green-900 to-emerald-900' },
    AFTERNOON_SNACK: { label: 'Afternoon Snack', icon: Drumstick, gradient: 'from-blue-500 to-cyan-500', gradientDark: 'from-blue-900 to-cyan-900' },
    DINNER: { label: 'Dinner', icon: UtensilsCrossed, gradient: 'from-orange-500 to-red-500', gradientDark: 'from-orange-900 to-red-900' },
    EVENING_SNACK: { label: 'Evening Snack', icon: Apple, gradient: 'from-pink-500 to-rose-500', gradientDark: 'from-pink-900 to-rose-900' },
    EXTRA_SNACKS: { label: 'Extra Snacks', icon: LeafyGreen, gradient: 'from-lime-500 to-green-500', gradientDark: 'from-lime-900 to-green-900' },
  }

  const config = MEAL_TYPE_CONFIG[meal.mealType]
  const isEaten = meal.eaten
  const isSkipped = meal.skipped

  // Use linked recipe if available, otherwise fall back to searching by name
  const linkedRecipe = meal.recipe
  const cleanMealName = meal.mealName.replace(/^Leftover:\s*/i, '').toLowerCase().trim()
  const matchingRecipe = linkedRecipe || recipes.find(r =>
    r.name.toLowerCase().trim() === cleanMealName ||
    r.name.toLowerCase().trim() === meal.mealName.toLowerCase().trim()
  )

  const hasIngredients = matchingRecipe?.ingredients && (matchingRecipe.ingredients as Ingredient[]).length > 0
  const hasInstructions = matchingRecipe?.instructions && matchingRecipe.instructions !== 'See image for recipe'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 md:p-8"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className={cn(
        'absolute inset-0 transition-colors',
        darkMode ? 'bg-black/80' : 'bg-black/60'
      )} />

      {/* Modal - bottom sheet on mobile, centered on desktop */}
      <div
        className={cn(
          'relative w-full sm:max-w-4xl max-h-[92vh] sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col',
          darkMode ? 'bg-slate-800' : 'bg-white'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle for mobile */}
        <div className="flex justify-center pt-2 sm:hidden">
          <div className={cn('w-10 h-1 rounded-full', darkMode ? 'bg-slate-600' : 'bg-slate-300')} />
        </div>
        {/* Close button - large for touchscreen */}
        <button
          onClick={onClose}
          className={cn(
            'absolute top-4 right-4 z-10 p-3 rounded-full transition-colors touch-manipulation',
            darkMode
              ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          )}
        >
          <X className="w-8 h-8" />
        </button>

        {/* Header - larger like display page */}
        <div className={cn(
          'px-6 py-6 md:px-8 md:py-8 bg-gradient-to-r',
          darkMode ? config.gradientDark : config.gradient
        )}>
          <div className="flex items-center gap-3 mb-2">
            <config.icon className="w-8 h-8 md:w-10 md:h-10 text-white/90" />
            <span className="text-white/80 text-sm md:text-base font-medium">{config.label}</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-white pr-16">
            {meal.mealName.replace(/^AIP\s+/i, '')}
          </h2>
          {/* Time/servings info like display page */}
          <div className="flex flex-wrap items-center gap-4 mt-3 text-white/80">
            {meal.scheduledTime && (
              <span className="flex items-center gap-2 text-base md:text-lg">
                <Clock className="w-5 h-5 md:w-6 md:h-6" />
                {meal.scheduledTime}
              </span>
            )}
            {/* Serving size adjuster with +/- controls */}
            <div className="flex items-center gap-2 text-base md:text-lg">
              <Users className="w-5 h-5 md:w-6 md:h-6" />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (servingMultiplier > 1) setServingMultiplier(servingMultiplier - 1)
                }}
                disabled={servingMultiplier <= 1}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors touch-manipulation',
                  servingMultiplier <= 1
                    ? 'bg-white/10 text-white/30 cursor-not-allowed'
                    : 'bg-white/20 text-white hover:bg-white/30'
                )}
              >
                −
              </button>
              <span className="min-w-[80px] text-center font-medium">
                {servingMultiplier} serving{servingMultiplier !== 1 ? 's' : ''}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (servingMultiplier < 10) setServingMultiplier(servingMultiplier + 1)
                }}
                disabled={servingMultiplier >= 10}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors touch-manipulation',
                  servingMultiplier >= 10
                    ? 'bg-white/10 text-white/30 cursor-not-allowed'
                    : 'bg-white/20 text-white hover:bg-white/30'
                )}
              >
                +
              </button>
              {hasUnsavedServings && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onUpdateServings(servingMultiplier)
                  }}
                  className="px-3 py-1 rounded-full text-sm font-semibold bg-white/30 text-white hover:bg-white/40 transition-colors touch-manipulation"
                >
                  Save
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {/* Status badges */}
          {(isEaten || isSkipped || meal.isLeftover) && (
            <div className="flex gap-2 mb-6">
              {isEaten && (
                <span className="px-4 py-2 rounded-full text-base font-medium bg-green-500/20 text-green-500">
                  ✓ Eaten
                </span>
              )}
              {isSkipped && (
                <span className={cn(
                  'px-4 py-2 rounded-full text-base font-medium',
                  darkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'
                )}>
                  Skipped
                </span>
              )}
              {meal.isLeftover && (
                <span className="px-4 py-2 rounded-full text-base font-medium bg-yellow-500/20 text-yellow-500">
                  ↺ Leftover
                </span>
              )}
            </div>
          )}

          {/* Two column layout like display page */}
          <div className={cn(
            'grid gap-8',
            (hasIngredients || hasInstructions) ? 'md:grid-cols-2' : ''
          )}>
            {/* Left column: Macros + Ingredients */}
            <div>
              {/* Macros Grid - use recipe macros when available, scaled by servings */}
              <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
                <div className={cn(
                  'p-3 md:p-4 rounded-xl text-center',
                  darkMode ? 'bg-slate-700' : 'bg-slate-100'
                )}>
                  <p className={cn('text-xl md:text-2xl font-bold', darkMode ? 'text-green-400' : 'text-green-600')}>
                    {Math.round((matchingRecipe?.calories ?? meal.calories ?? 0) * servingMultiplier)}
                  </p>
                  <p className={cn('text-xs md:text-sm', darkMode ? 'text-slate-400' : 'text-slate-500')}>Calories</p>
                </div>
                <div className={cn(
                  'p-3 md:p-4 rounded-xl text-center',
                  darkMode ? 'bg-slate-700' : 'bg-slate-100'
                )}>
                  <p className={cn('text-xl md:text-2xl font-bold', darkMode ? 'text-blue-400' : 'text-blue-600')}>
                    {Math.round((matchingRecipe?.protein ?? meal.protein ?? 0) * servingMultiplier)}g
                  </p>
                  <p className={cn('text-xs md:text-sm', darkMode ? 'text-slate-400' : 'text-slate-500')}>Protein</p>
                </div>
                <div className={cn(
                  'p-3 md:p-4 rounded-xl text-center',
                  darkMode ? 'bg-slate-700' : 'bg-slate-100'
                )}>
                  <p className={cn('text-xl md:text-2xl font-bold', darkMode ? 'text-orange-400' : 'text-orange-600')}>
                    {Math.round((matchingRecipe?.netCarbs ?? meal.netCarbs ?? 0) * servingMultiplier)}g
                  </p>
                  <p className={cn('text-xs md:text-sm', darkMode ? 'text-slate-400' : 'text-slate-500')}>Net Carbs</p>
                </div>
              </div>

              {/* Additional Macros - use recipe macros when available, scaled by servings */}
              <div className={cn(
                'flex justify-center gap-6 py-3 mb-6 rounded-lg',
                darkMode ? 'bg-slate-700/50' : 'bg-slate-50'
              )}>
                <div className="text-center">
                  <span className={cn('text-base font-medium', darkMode ? 'text-slate-300' : 'text-slate-700')}>
                    {Math.round((matchingRecipe?.fat ?? meal.fat ?? 0) * servingMultiplier)}g
                  </span>
                  <span className={cn('text-sm ml-1', darkMode ? 'text-slate-500' : 'text-slate-400')}>Fat</span>
                </div>
                <div className="text-center">
                  <span className={cn('text-base font-medium', darkMode ? 'text-slate-300' : 'text-slate-700')}>
                    {Math.round((matchingRecipe?.carbs ?? meal.carbs ?? 0) * servingMultiplier)}g
                  </span>
                  <span className={cn('text-sm ml-1', darkMode ? 'text-slate-500' : 'text-slate-400')}>Carbs</span>
                </div>
                <div className="text-center">
                  <span className={cn('text-base font-medium', darkMode ? 'text-slate-300' : 'text-slate-700')}>
                    {Math.round((matchingRecipe?.fiber ?? meal.fiber ?? 0) * servingMultiplier)}g
                  </span>
                  <span className={cn('text-sm ml-1', darkMode ? 'text-slate-500' : 'text-slate-400')}>Fiber</span>
                </div>
              </div>

              {/* Ingredients */}
              {hasIngredients && (
                <section>
                  <h3 className={cn(
                    'text-xl md:text-2xl font-bold mb-4',
                    darkMode ? 'text-slate-100' : 'text-slate-800'
                  )}>
                    Ingredients
                    {servingMultiplier !== 1 && (
                      <span className={cn(
                        'ml-3 text-sm font-normal',
                        darkMode ? 'text-green-400' : 'text-green-600'
                      )}>
                        (scaled for {servingMultiplier} servings)
                      </span>
                    )}
                  </h3>
                  <ul className="space-y-3">
                    {(matchingRecipe?.ingredients as Ingredient[] | undefined)?.map((ing, i) => {
                      const scaledIng = scaleIngredient(ing, servingMultiplier)
                      return (
                        <li
                          key={i}
                          className={cn(
                            'flex items-start gap-3 text-base md:text-lg',
                            darkMode ? 'text-slate-300' : 'text-slate-700'
                          )}
                        >
                          <span className="w-2 h-2 mt-2.5 rounded-full bg-green-500 flex-shrink-0" />
                          <span>
                            {scaledIng.quantity && <span className="font-semibold">{scaledIng.quantity} </span>}
                            {scaledIng.unit && <span>{scaledIng.unit} </span>}
                            {scaledIng.item}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )}
            </div>

            {/* Right column: Instructions */}
            {hasInstructions && (
              <section>
                <h3 className={cn(
                  'text-xl md:text-2xl font-bold mb-4',
                  darkMode ? 'text-slate-100' : 'text-slate-800'
                )}>
                  Instructions
                </h3>
                <div className={cn(
                  'space-y-4 text-base md:text-lg leading-relaxed',
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                )}>
                  {matchingRecipe?.instructions?.split('\n\n').map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Action buttons - larger for touchscreen */}
          <div className={cn(
            'flex gap-4 mt-8 pt-6 border-t',
            darkMode ? 'border-slate-700' : 'border-slate-200'
          )}>
            {!isEaten && !isSkipped ? (
              <>
                <button
                  onClick={() => onMarkEaten(true)}
                  className="flex-1 py-4 rounded-xl text-lg font-semibold bg-green-500 text-white hover:bg-green-600 transition-colors touch-manipulation"
                >
                  ✓ Mark as Eaten
                </button>
                <button
                  onClick={() => onMarkSkipped(true)}
                  className={cn(
                    'px-8 py-4 rounded-xl text-lg font-medium transition-colors touch-manipulation',
                    darkMode
                      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  )}
                >
                  Skip
                </button>
              </>
            ) : isEaten ? (
              <button
                onClick={() => onMarkEaten(false)}
                className={cn(
                  'flex-1 py-4 rounded-xl text-lg font-medium transition-colors touch-manipulation',
                  darkMode
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                )}
              >
                Undo Eaten
              </button>
            ) : (
              <button
                onClick={() => onMarkSkipped(false)}
                className={cn(
                  'flex-1 py-4 rounded-xl text-lg font-medium transition-colors touch-manipulation',
                  darkMode
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                )}
              >
                Undo Skip
              </button>
            )}
          </div>

          {/* Delete button - two-click confirm */}
          <div className="mt-4">
            <button
              onClick={() => {
                if (confirmDelete) {
                  onDelete()
                } else {
                  setConfirmDelete(true)
                }
              }}
              className={cn(
                'w-full py-3 rounded-xl text-base font-medium transition-colors touch-manipulation',
                confirmDelete
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
              )}
            >
              {confirmDelete ? 'Confirm Remove?' : 'Remove Meal'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

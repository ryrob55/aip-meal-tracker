'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles,
  ShoppingCart,
  Check,
  X,
  Loader2,
  Users,
  Filter,
} from 'lucide-react'
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addWeeks,
  subWeeks,
  isSameDay,
} from 'date-fns'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useTheme } from '@/contexts/ThemeContext'
import type { Recipe, MealPlan, GroceryList, GroceryItem } from '@/lib/types'

interface AISuggestion {
  suggestions: string[]
  source: 'ai' | 'random'
}

export default function MealsPage() {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [selectingDay, setSelectingDay] = useState<Date | null>(null)
  const [showGroceryList, setShowGroceryList] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion | null>(null)
  const [editingServingsId, setEditingServingsId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { darkMode } = useTheme()

  const weekStart = startOfWeek(currentWeek)
  const weekEnd = endOfWeek(currentWeek)
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  // Fetch meal plan for current week
  const { data: mealPlan, isLoading } = useQuery<MealPlan>({
    queryKey: ['mealPlan', format(weekStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      const res = await fetch(`/api/meals?weekOf=${format(weekStart, 'yyyy-MM-dd')}`)
      return res.json()
    },
  })

  // Fetch all recipes
  const { data: recipes = [] } = useQuery<Recipe[]>({
    queryKey: ['recipes'],
    queryFn: async () => {
      const res = await fetch('/api/recipes')
      const data = await res.json()
      return data.recipes || []
    },
  })

  // Add meal to plan
  const addMealMutation = useMutation({
    mutationFn: async ({ recipeId, date, servings }: { recipeId: string; date: Date; servings: number }) => {
      const res = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealPlanId: mealPlan?.id,
          recipeId,
          date: format(date, 'yyyy-MM-dd'),
          servings,
        }),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlan'] })
      setSelectingDay(null)
    },
  })

  // Remove meal from plan
  const removeMealMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await fetch(`/api/meals?itemId=${itemId}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlan'] })
    },
  })

  // Update meal servings
  const updateServingsMutation = useMutation({
    mutationFn: async ({ itemId, servings }: { itemId: string; servings: number }) => {
      const res = await fetch('/api/meals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, servings }),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlan'] })
      setEditingServingsId(null)
    },
  })

  // Generate grocery list
  const generateGroceryMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/grocery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealPlanId: mealPlan?.id }),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlan'] })
      setShowGroceryList(true)
    },
  })

  // Get AI suggestions
  const suggestMealsMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/meals/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekOf: format(weekStart, 'yyyy-MM-dd') }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to get suggestions')
      }
      return res.json() as Promise<AISuggestion>
    },
    onSuccess: (data) => {
      setAiSuggestions(data)
      setShowSuggestions(true)
    },
  })

  // Apply AI suggestions
  const applySuggestionsMutation = useMutation({
    mutationFn: async (suggestions: string[]) => {
      const res = await fetch('/api/meals/suggest', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekOf: format(weekStart, 'yyyy-MM-dd'),
          suggestions,
        }),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlan'] })
      setShowSuggestions(false)
      setAiSuggestions(null)
    },
  })

  const getMealForDay = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd')
    return mealPlan?.items.find((item) => {
      // Compare date strings to avoid timezone issues
      // item.date comes as ISO string like "2025-01-14T00:00:00.000Z"
      const itemDateStr = typeof item.date === 'string'
        ? item.date.slice(0, 10)
        : format(new Date(item.date), 'yyyy-MM-dd')
      return dayStr === itemDateStr
    })
  }

  return (
    <main className={cn(
      "min-h-screen p-3 sm:p-6",
      darkMode ? "bg-slate-900" : "bg-slate-50"
    )}>
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/"
              className={cn(
                "p-2 rounded-lg transition-colors",
                darkMode ? "hover:bg-slate-700" : "hover:bg-slate-200"
              )}
            >
              <ArrowLeft className={cn("w-5 h-5", darkMode ? "text-slate-400" : "text-slate-600")} />
            </Link>
            <h1 className={cn("text-xl sm:text-2xl font-bold", darkMode ? "text-slate-100" : "text-slate-800")}>Meal Planning</h1>
          </div>
          <div className="flex gap-2 self-end sm:self-auto">
            <Button
              onClick={() => suggestMealsMutation.mutate()}
              disabled={suggestMealsMutation.isPending}
              className="bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {suggestMealsMutation.isPending ? (
                <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 sm:mr-2" />
              )}
              <span className="hidden sm:inline">{suggestMealsMutation.isPending ? 'Thinking...' : 'AI Suggest'}</span>
            </Button>
            <Link href="/recipes">
              <Button variant="secondary">
                <span className="hidden sm:inline">Manage Recipes</span>
                <span className="sm:hidden">Recipes</span>
              </Button>
            </Link>
          </div>
        </header>

        {/* Week navigation */}
        <div className={cn(
          "flex items-center justify-between mb-4 sm:mb-6 rounded-xl border p-3 sm:p-4",
          darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
        )}>
          <button
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            className={cn(
              "p-2 rounded-lg transition-colors touch-manipulation",
              darkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"
            )}
          >
            <ChevronLeft className={cn("w-5 h-5", darkMode ? "text-slate-400" : "text-slate-600")} />
          </button>
          <div className="text-center">
            <h2 className={cn("font-semibold text-sm sm:text-base", darkMode ? "text-slate-100" : "text-slate-800")}>
              <span className="hidden sm:inline">Week of {format(weekStart, 'MMMM d')} - {format(weekEnd, 'd, yyyy')}</span>
              <span className="sm:hidden">{format(weekStart, 'MMM d')} - {format(weekEnd, 'd, yyyy')}</span>
            </h2>
          </div>
          <button
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            className={cn(
              "p-2 rounded-lg transition-colors touch-manipulation",
              darkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"
            )}
          >
            <ChevronRight className={cn("w-5 h-5", darkMode ? "text-slate-400" : "text-slate-600")} />
          </button>
        </div>

        {/* Meal plan grid */}
        <div className={cn(
          "rounded-xl shadow-xs border p-3 sm:p-6 mb-4 sm:mb-6",
          darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
        )}>
          {isLoading ? (
            <div className={cn("text-center py-12", darkMode ? "text-slate-400" : "text-slate-500")}>Loading...</div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {weekDays.map((day) => {
                const meal = getMealForDay(day)
                const isToday = isSameDay(day, new Date())

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'p-3 sm:p-4 rounded-lg border',
                      isToday
                        ? darkMode ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200'
                        : darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'
                    )}
                  >
                    {/* Mobile: stacked layout */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                      <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-4">
                        <div className="sm:w-24">
                          <span
                            className={cn(
                              'font-medium text-sm sm:text-base',
                              isToday
                                ? darkMode ? 'text-blue-400' : 'text-blue-700'
                                : darkMode ? 'text-slate-200' : 'text-slate-700'
                            )}
                          >
                            {format(day, 'EEEE')}
                          </span>
                          <span className={cn("text-xs sm:text-sm block", darkMode ? "text-slate-500" : "text-slate-400")}>
                            {format(day, 'MMM d')}
                          </span>
                        </div>
                        {/* Mobile actions - show on same row as day */}
                        <div className="flex sm:hidden items-center gap-2">
                          {meal ? (
                            <button
                              onClick={() => removeMealMutation.mutate(meal.id)}
                              className={cn(
                                "p-2 text-red-500 rounded-lg transition-colors touch-manipulation",
                                darkMode ? "hover:bg-red-900/30" : "hover:bg-red-50"
                              )}
                            >
                              <X className="w-5 h-5" />
                            </button>
                          ) : null}
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setSelectingDay(day)}
                            className="touch-manipulation"
                          >
                            {meal ? 'Change' : 'Select'}
                          </Button>
                        </div>
                      </div>

                      {/* Meal info */}
                      <div className="flex-1">
                        {meal ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/recipes/${meal.recipe.id}`}
                              className={cn(
                                'font-medium hover:underline transition-colors text-sm sm:text-base',
                                meal.recipe.isDraft
                                  ? 'text-amber-700 hover:text-amber-800'
                                  : darkMode ? 'text-slate-200 hover:text-amber-400' : 'text-slate-700 hover:text-amber-600'
                              )}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {meal.recipe.name}
                            </Link>
                            {/* Editable servings badge */}
                            {editingServingsId === meal.id ? (
                              <div className="flex items-center gap-1">
                                <select
                                  autoFocus
                                  defaultValue={meal.servings || 1}
                                  onChange={(e) => {
                                    updateServingsMutation.mutate({
                                      itemId: meal.id,
                                      servings: parseInt(e.target.value),
                                    })
                                  }}
                                  onBlur={() => setEditingServingsId(null)}
                                  className={cn(
                                    "text-xs px-2 py-0.5 rounded-full border-none outline-hidden cursor-pointer",
                                    darkMode ? "bg-slate-600 text-slate-200" : "bg-slate-200 text-slate-700"
                                  )}
                                >
                                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                                    <option key={n} value={n}>
                                      {n} serving{n > 1 ? 's' : ''}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingServingsId(meal.id)
                                }}
                                className={cn(
                                  "text-xs px-2 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1 transition-colors",
                                  darkMode
                                    ? "bg-slate-600 text-slate-300 hover:bg-slate-500"
                                    : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                                )}
                                title="Click to edit servings"
                              >
                                <Users className="w-3 h-3" />
                                {meal.servings || 1}
                              </button>
                            )}
                            {meal.recipe.isDraft && (
                              <span className="text-xs px-2 py-0.5 bg-amber-200 text-amber-700 rounded-full whitespace-nowrap">
                                Needs Recipe
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className={cn("italic text-sm", darkMode ? "text-slate-500" : "text-slate-400")}>
                            No dinner planned
                          </span>
                        )}
                      </div>

                      {/* Desktop actions */}
                      <div className="hidden sm:flex items-center gap-2">
                        {meal ? (
                          <button
                            onClick={() => removeMealMutation.mutate(meal.id)}
                            className={cn(
                              "p-2 text-red-500 rounded-lg transition-colors",
                              darkMode ? "hover:bg-red-900/30" : "hover:bg-red-50"
                            )}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        ) : null}
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectingDay(day)}
                        >
                          {meal ? 'Change' : 'Select Recipe'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Action buttons */}
          {mealPlan && mealPlan.items.length > 0 && (
            <div className={cn(
              "mt-4 sm:mt-6 pt-4 sm:pt-6 border-t flex flex-col sm:flex-row gap-3 sm:justify-between",
              darkMode ? "border-slate-700" : "border-slate-200"
            )}>
              {mealPlan.groceryList ? (
                // Grocery list exists - just view it
                <Button
                  variant="secondary"
                  onClick={() => setShowGroceryList(true)}
                  className="w-full sm:w-auto"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  View Grocery List
                </Button>
              ) : (
                // No grocery list yet - generate one
                <Button
                  variant="secondary"
                  onClick={() => generateGroceryMutation.mutate()}
                  disabled={generateGroceryMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {generateGroceryMutation.isPending
                    ? 'Generating...'
                    : 'Generate Grocery List'}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Recipe selection modal */}
        {selectingDay && (
          <RecipeSelectionModal
            day={selectingDay}
            recipes={recipes}
            onSelect={(recipeId, servings) =>
              addMealMutation.mutate({ recipeId, date: selectingDay, servings })
            }
            onClose={() => setSelectingDay(null)}
          />
        )}

        {/* Grocery list modal */}
        {showGroceryList && mealPlan?.groceryList && (
          <GroceryListModal
            groceryList={mealPlan.groceryList}
            onClose={() => setShowGroceryList(false)}
            onRegenerate={() => generateGroceryMutation.mutate()}
            isRegenerating={generateGroceryMutation.isPending}
          />
        )}

        {/* AI suggestions modal */}
        {showSuggestions && aiSuggestions && (
          <AISuggestionsModal
            suggestions={aiSuggestions}
            weekDays={weekDays}
            onApply={(suggestions) => applySuggestionsMutation.mutate(suggestions)}
            onClose={() => {
              setShowSuggestions(false)
              setAiSuggestions(null)
            }}
            isApplying={applySuggestionsMutation.isPending}
          />
        )}
      </div>
    </main>
  )
}

function RecipeSelectionModal({
  day,
  recipes,
  onSelect,
  onClose,
}: {
  day: Date
  recipes: Recipe[]
  onSelect: (recipeId: string, servings: number) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showAllTags, setShowAllTags] = useState(false)
  const [servings, setServings] = useState(4) // Default to 4 servings for family
  const [isCreating, setIsCreating] = useState(false)
  const [generateDetails, setGenerateDetails] = useState(true)
  const queryClient = useQueryClient()
  const { darkMode } = useTheme()

  // Collect all unique tags sorted alphabetically, with counts
  const allTags = useMemo(() => {
    const tagCounts: Record<string, number> = {}
    recipes.forEach(r => r.tags.forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1 }))
    return Object.entries(tagCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([tag, count]) => ({ tag, count }))
  }, [recipes])

  // Top tags shown by default (most used)
  const topTags = useMemo(() => {
    return [...allTags].sort((a, b) => b.count - a.count).slice(0, 10)
      .sort((a, b) => a.tag.localeCompare(b.tag))
  }, [allTags])

  const visibleTags = showAllTags ? allTags : topTags

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const filteredRecipes = recipes.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase())
    const matchesTags = selectedTags.length === 0 || selectedTags.every(t => r.tags.includes(t))
    return matchesSearch && matchesTags
  })

  // Check if search term exactly matches any recipe
  const exactMatch = recipes.some(
    (r) => r.name.toLowerCase() === search.toLowerCase()
  )

  const handleCreateNew = async () => {
    if (!search.trim()) return

    setIsCreating(true)
    try {
      const res = await fetch('/api/recipes/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: search.trim(),
          generateDetails,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to create recipe')
      }

      const newRecipe = await res.json()

      // Invalidate recipes cache and select the new recipe
      await queryClient.invalidateQueries({ queryKey: ['recipes'] })
      onSelect(newRecipe.id, servings)
    } catch (error) {
      console.error('Failed to create recipe:', error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center sm:p-4 z-50"
      onClick={onClose}
    >
      <div
        className={cn(
          "rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col shadow-2xl",
          darkMode ? "bg-slate-800" : "bg-white"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={cn(
          "px-5 pt-5 pb-4",
          darkMode ? "border-slate-700" : "border-slate-200"
        )}>
          <div className="flex items-center justify-between mb-3">
            <h2 className={cn(
              "text-lg font-bold",
              darkMode ? "text-slate-100" : "text-slate-800"
            )}>
              {format(day, 'EEEE, MMM d')}
            </h2>
            <button
              onClick={onClose}
              className={cn(
                "p-2 rounded-lg transition-colors touch-manipulation",
                darkMode ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-500"
              )}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search + servings row */}
          <div className="flex gap-3 items-center">
            <input
              type="text"
              placeholder="Search recipes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                "flex-1 px-3 py-2 border rounded-lg text-sm",
                darkMode
                  ? "bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400"
                  : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400"
              )}
              autoFocus
            />
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-1.5 rounded-lg border",
              darkMode ? "border-slate-600" : "border-slate-200"
            )}>
              <Users className={cn("w-3.5 h-3.5", darkMode ? "text-slate-400" : "text-slate-500")} />
              <button
                onClick={() => setServings(Math.max(1, servings - 1))}
                className={cn(
                  "w-6 h-6 flex items-center justify-center rounded-sm text-sm font-bold touch-manipulation",
                  darkMode
                    ? "hover:bg-slate-600 text-slate-300"
                    : "hover:bg-slate-100 text-slate-600"
                )}
              >
                -
              </button>
              <span className={cn(
                "w-5 text-center text-sm font-semibold",
                darkMode ? "text-slate-100" : "text-slate-800"
              )}>
                {servings}
              </span>
              <button
                onClick={() => setServings(servings + 1)}
                className={cn(
                  "w-6 h-6 flex items-center justify-center rounded-sm text-sm font-bold touch-manipulation",
                  darkMode
                    ? "hover:bg-slate-600 text-slate-300"
                    : "hover:bg-slate-100 text-slate-600"
                )}
              >
                +
              </button>
            </div>
          </div>

          {/* Tag filters */}
          <div className="mt-3">
            {/* Selected tags shown as removable chips */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className="text-xs px-2.5 py-1 rounded-full bg-blue-500 text-white flex items-center gap-1 touch-manipulation"
                  >
                    {tag}
                    <X className="w-3 h-3" />
                  </button>
                ))}
                <button
                  onClick={() => setSelectedTags([])}
                  className={cn(
                    "text-xs px-2 py-1 rounded-full touch-manipulation",
                    darkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Available tag chips */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <Filter className={cn("w-3.5 h-3.5 shrink-0", darkMode ? "text-slate-500" : "text-slate-400")} />
              {visibleTags
                .filter(({ tag }) => !selectedTags.includes(tag))
                .map(({ tag, count }) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full transition-colors touch-manipulation",
                      darkMode
                        ? "bg-slate-700/80 text-slate-300 hover:bg-slate-600"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                    )}
                  >
                    {tag}
                    <span className={cn(
                      "ml-1 opacity-50",
                    )}>
                      {count}
                    </span>
                  </button>
                ))}
              {!showAllTags && allTags.length > topTags.length && (
                <button
                  onClick={() => setShowAllTags(true)}
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full flex items-center gap-0.5 touch-manipulation",
                    darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-500 hover:text-blue-600"
                  )}
                >
                  +{allTags.length - topTags.length} more
                  <ChevronDown className="w-3 h-3" />
                </button>
              )}
              {showAllTags && (
                <button
                  onClick={() => setShowAllTags(false)}
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full touch-manipulation",
                    darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-500 hover:text-blue-600"
                  )}
                >
                  Show less
                </button>
              )}
            </div>
          </div>

          {/* Result count */}
          <div className={cn(
            "mt-3 pt-3 border-t text-xs",
            darkMode ? "border-slate-700 text-slate-500" : "border-slate-100 text-slate-400"
          )}>
            {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Recipe list */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain touch-pan-y px-5 pb-5">
          {/* Create new option when search has text and no exact match */}
          {search.trim() && !exactMatch && (
            <div className={cn(
              "mb-3 p-3 rounded-lg border",
              darkMode
                ? "bg-emerald-900/20 border-emerald-800/50"
                : "bg-emerald-50 border-emerald-200"
            )}>
              <p className={cn(
                "text-sm mb-2",
                darkMode ? "text-emerald-300" : "text-emerald-700"
              )}>
                Create &quot;{search.trim()}&quot; as a new meal?
              </p>
              <div className="flex items-center gap-3">
                <label className={cn(
                  "flex items-center gap-2 text-xs cursor-pointer",
                  darkMode ? "text-slate-300" : "text-slate-600"
                )}>
                  <input
                    type="checkbox"
                    checked={generateDetails}
                    onChange={(e) => setGenerateDetails(e.target.checked)}
                    className="rounded-sm border-slate-300"
                  />
                  Auto-generate with AI
                </label>
                <Button
                  size="sm"
                  onClick={handleCreateNew}
                  disabled={isCreating}
                  className="bg-emerald-600 hover:bg-emerald-700 ml-auto"
                >
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      Create
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {filteredRecipes.length === 0 && !search.trim() && selectedTags.length === 0 ? (
            <p className={cn(
              "text-center py-12 text-sm",
              darkMode ? "text-slate-400" : "text-slate-500"
            )}>
              No recipes found.{' '}
              <Link href="/recipes" className="text-blue-500 hover:underline">
                Add some recipes first!
              </Link>
            </p>
          ) : filteredRecipes.length === 0 ? (
            <p className={cn(
              "text-center py-12 text-sm",
              darkMode ? "text-slate-400" : "text-slate-500"
            )}>
              No recipes match the current filters.
            </p>
          ) : (
            <div className="space-y-1">
              {filteredRecipes.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => onSelect(recipe.id, servings)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 rounded-lg transition-colors touch-manipulation group',
                    recipe.isDraft
                      ? darkMode
                        ? 'hover:bg-amber-900/30 border border-amber-800/50'
                        : 'hover:bg-amber-50 border border-amber-200'
                      : darkMode
                        ? 'hover:bg-slate-700'
                        : 'hover:bg-slate-50'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn(
                      "font-medium text-sm",
                      darkMode ? "text-slate-100" : "text-slate-800"
                    )}>
                      {recipe.name}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {recipe.isDraft && (
                        <span className="text-xs px-1.5 py-0.5 bg-amber-500/20 text-amber-500 rounded-sm">
                          Draft
                        </span>
                      )}
                    </div>
                  </div>
                  {recipe.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {recipe.tags.map(tag => (
                        <span
                          key={tag}
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-sm",
                            selectedTags.includes(tag)
                              ? darkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600"
                              : darkMode ? "text-slate-500" : "text-slate-400"
                          )}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function GroceryListModal({
  groceryList,
  onClose,
  onRegenerate,
  isRegenerating = false,
}: {
  groceryList: GroceryList
  onClose: () => void
  onRegenerate?: () => void
  isRegenerating?: boolean
}) {
  const queryClient = useQueryClient()
  const { darkMode } = useTheme()
  const [view, setView] = useState<'inventory' | 'shopping'>('inventory')
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false)

  const toggleItemMutation = useMutation({
    mutationFn: async ({ itemId, checked }: { itemId: string; checked: boolean }) => {
      await fetch('/api/grocery', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, checked }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlan'] })
    },
  })

  // Filter items based on view
  // checked = true means "I have this" (don't need to buy)
  // checked = false means "I need to buy this"
  const displayItems = view === 'shopping'
    ? groceryList.items.filter(item => !item.checked)
    : groceryList.items

  // Group items by category
  const itemsByCategory = displayItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, typeof groceryList.items>)

  const categoryOrder = ['Meat & Protein', 'Produce', 'Dairy', 'Fats & Oils', 'Broth & Stocks', 'Pantry', 'Frozen', 'Supplements', 'Other']
  const sortedCategories = Object.keys(itemsByCategory).sort((a, b) => {
    const aIdx = categoryOrder.indexOf(a)
    const bIdx = categoryOrder.indexOf(b)
    return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx)
  })

  // Stats
  const totalItems = groceryList.items.length
  const haveItems = groceryList.items.filter(i => i.checked).length
  const needItems = totalItems - haveItems

  // Quality badge helper
  const getQualityBadges = (item: GroceryItem) => {
    const badges: string[] = []
    if (item.preferOrganic) badges.push('organic')
    if (item.preferGrassFed) badges.push('grass-fed')
    if (item.preferWildCaught) badges.push('wild-caught')
    if (item.preferPasture) badges.push('pasture-raised')
    if (item.preferNonGMO) badges.push('non-GMO')
    return badges
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center sm:p-4 z-50">
      <div className={cn(
        "rounded-t-xl sm:rounded-xl w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col",
        darkMode ? "bg-slate-800" : "bg-white"
      )}>
        {/* Regenerate confirmation dialog */}
        {showRegenerateConfirm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 rounded-xl">
            <div className={cn(
              "mx-4 p-4 rounded-lg max-w-sm",
              darkMode ? "bg-slate-700" : "bg-white"
            )}>
              <h3 className={cn(
                "font-semibold mb-2",
                darkMode ? "text-slate-100" : "text-slate-800"
              )}>
                Regenerate List?
              </h3>
              <p className={cn(
                "text-sm mb-4",
                darkMode ? "text-slate-300" : "text-slate-600"
              )}>
                This will refresh ingredients from recipes but reset your inventory checkmarks.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowRegenerateConfirm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setShowRegenerateConfirm(false)
                    onRegenerate?.()
                  }}
                  disabled={isRegenerating}
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                >
                  {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className={cn(
          "p-4 border-b",
          darkMode ? "border-slate-700" : "border-slate-200"
        )}>
          <div className="flex items-center justify-between mb-3">
            <h2 className={cn(
              "text-lg font-bold",
              darkMode ? "text-slate-100" : "text-slate-800"
            )}>
              {view === 'inventory' ? 'Inventory Check' : 'Shopping List'}
            </h2>
            <div className="flex items-center gap-1">
              {onRegenerate && (
                <button
                  onClick={() => setShowRegenerateConfirm(true)}
                  className={cn(
                    "p-2 rounded-lg transition-colors text-xs",
                    darkMode ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-500"
                  )}
                  title="Regenerate list from recipes"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
              <button
                onClick={onClose}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  darkMode ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-500"
                )}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* View toggle tabs */}
          <div className={cn(
            "flex rounded-lg p-1",
            darkMode ? "bg-slate-900" : "bg-slate-100"
          )}>
            <button
              onClick={() => setView('inventory')}
              className={cn(
                "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
                view === 'inventory'
                  ? darkMode
                    ? "bg-slate-700 text-white shadow-sm"
                    : "bg-white text-slate-900 shadow-sm"
                  : darkMode
                    ? "text-slate-400 hover:text-slate-200"
                    : "text-slate-600 hover:text-slate-900"
              )}
            >
              All Items ({totalItems})
            </button>
            <button
              onClick={() => setView('shopping')}
              className={cn(
                "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
                view === 'shopping'
                  ? darkMode
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-emerald-500 text-white shadow-sm"
                  : darkMode
                    ? "text-slate-400 hover:text-slate-200"
                    : "text-slate-600 hover:text-slate-900"
              )}
            >
              <ShoppingCart className="w-4 h-4 inline mr-1.5" />
              Need to Buy ({needItems})
            </button>
          </div>

          {/* Progress indicator for inventory view */}
          {view === 'inventory' && (
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className={darkMode ? "text-slate-400" : "text-slate-500"}>
                  Check off items you already have
                </span>
                <span className={darkMode ? "text-slate-400" : "text-slate-500"}>
                  {haveItems} of {totalItems} checked
                </span>
              </div>
              <div className={cn(
                "h-2 rounded-full overflow-hidden",
                darkMode ? "bg-slate-700" : "bg-slate-200"
              )}>
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${totalItems > 0 ? (haveItems / totalItems) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain touch-pan-y p-4">
          {sortedCategories.length === 0 ? (
            <div className={cn(
              "text-center py-12",
              darkMode ? "text-slate-400" : "text-slate-500"
            )}>
              {view === 'shopping' ? (
                <>
                  <Check className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                  <p className="font-medium">All set!</p>
                  <p className="text-sm mt-1">You have everything you need.</p>
                </>
              ) : (
                <p>No items in the grocery list.</p>
              )}
            </div>
          ) : (
            sortedCategories.map((category) => (
              <div key={category} className="mb-5">
                <h3 className={cn(
                  "font-semibold mb-2 text-sm uppercase tracking-wide",
                  darkMode ? "text-slate-400" : "text-slate-500"
                )}>
                  {category}
                  <span className={cn(
                    "ml-2 text-xs font-normal normal-case",
                    darkMode ? "text-slate-500" : "text-slate-400"
                  )}>
                    ({itemsByCategory[category].length})
                  </span>
                </h3>
                <div className="space-y-1">
                  {itemsByCategory[category].map((item) => {
                    const qualityBadges = getQualityBadges(item)
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg transition-colors",
                          darkMode
                            ? item.checked
                              ? "bg-slate-700/30"
                              : "bg-slate-700/60 hover:bg-slate-700"
                            : item.checked
                              ? "bg-slate-50"
                              : "bg-slate-100 hover:bg-slate-200"
                        )}
                      >
                        <button
                          onClick={() => toggleItemMutation.mutate({
                            itemId: item.id,
                            checked: !item.checked,
                          })}
                          className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all mt-0.5",
                            item.checked
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : darkMode
                                ? "border-slate-500 hover:border-emerald-400"
                                : "border-slate-300 hover:border-emerald-500"
                          )}
                        >
                          {item.checked && <Check className="w-4 h-4" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={cn(
                                "font-medium",
                                item.checked
                                  ? darkMode
                                    ? "line-through text-slate-500"
                                    : "line-through text-slate-400"
                                  : darkMode
                                    ? "text-slate-100"
                                    : "text-slate-800"
                              )}
                            >
                              {item.name}
                            </span>
                            {item.quantity && (
                              <span className={cn(
                                "text-sm whitespace-nowrap shrink-0",
                                item.checked
                                  ? darkMode ? "text-slate-600" : "text-slate-400"
                                  : darkMode ? "text-slate-400" : "text-slate-500"
                              )}>
                                {item.quantity}
                                {item.unit && ` ${item.unit}`}
                              </span>
                            )}
                          </div>

                          {/* Quality badges */}
                          {qualityBadges.length > 0 && !item.checked && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {qualityBadges.map((badge) => (
                                <span
                                  key={badge}
                                  className={cn(
                                    "text-xs px-2 py-0.5 rounded-full",
                                    darkMode
                                      ? "bg-emerald-900/50 text-emerald-400"
                                      : "bg-emerald-100 text-emerald-700"
                                  )}
                                >
                                  {badge}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Recipe tags */}
                          {item.recipeNames && item.recipeNames.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {item.recipeNames.map((recipeName, idx) => (
                                <span
                                  key={idx}
                                  className={cn(
                                    'text-xs px-2 py-0.5 rounded-full',
                                    item.checked
                                      ? darkMode
                                        ? 'bg-slate-700 text-slate-500'
                                        : 'bg-slate-200 text-slate-400'
                                      : darkMode
                                        ? 'bg-amber-900/50 text-amber-400'
                                        : 'bg-amber-100 text-amber-700'
                                  )}
                                >
                                  {recipeName}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className={cn(
          "p-4 border-t",
          darkMode ? "border-slate-700" : "border-slate-200"
        )}>
          {view === 'inventory' ? (
            <div className="flex gap-3">
              <Button variant="secondary" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => setView('shopping')}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                View Shopping List ({needItems})
              </Button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setView('inventory')} className="flex-1">
                Back to All Items
              </Button>
              <Button onClick={onClose} className="flex-1">
                Done
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AISuggestionsModal({
  suggestions,
  weekDays,
  onApply,
  onClose,
  isApplying,
}: {
  suggestions: AISuggestion
  weekDays: Date[]
  onApply: (suggestions: string[]) => void
  onClose: () => void
  isApplying: boolean
}) {
  const [editedSuggestions, setEditedSuggestions] = useState(suggestions.suggestions)

  const updateSuggestion = (index: number, value: string) => {
    const newSuggestions = [...editedSuggestions]
    newSuggestions[index] = value
    setEditedSuggestions(newSuggestions)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center sm:p-4 z-50">
      <div className="bg-white rounded-t-xl sm:rounded-xl w-full sm:max-w-lg max-h-[85vh] sm:max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-bold text-slate-800">AI Meal Suggestions</h2>
          </div>
          <p className="text-sm text-slate-500">
            {suggestions.source === 'ai'
              ? 'Based on your recipes and recent meals'
              : 'Random selection (AI unavailable)'}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain touch-pan-y p-4">
          <div className="space-y-3">
            {weekDays.map((day, index) => (
              <div
                key={day.toISOString()}
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 bg-slate-50 rounded-lg"
              >
                <div className="sm:w-20 shrink-0 flex sm:block items-center gap-2">
                  <span className="font-medium text-slate-700">
                    {format(day, 'EEE')}
                  </span>
                  <span className="text-xs text-slate-400 sm:block">
                    {format(day, 'MMM d')}
                  </span>
                </div>
                <input
                  type="text"
                  value={editedSuggestions[index] || ''}
                  onChange={(e) => updateSuggestion(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-base text-slate-700"
                />
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={() => onApply(editedSuggestions)}
            disabled={isApplying}
            className="flex-1 bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {isApplying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Apply to Week
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

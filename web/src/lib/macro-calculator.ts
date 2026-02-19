import type { AIPMealEntry } from '@prisma/client'

// Extended type with linked recipe for dynamic macros
interface MealWithRecipe extends Partial<AIPMealEntry> {
  recipe?: {
    calories: number | null
    protein: number | null
    carbs: number | null
    fiber: number | null
    fat: number | null
    netCarbs: number | null
  } | null
}

export interface MacroTargets {
  calories: number
  protein: number
  netCarbs: number
  fat?: number
}

export interface MacroTotals {
  calories: number
  protein: number
  carbs: number
  fiber: number
  netCarbs: number
  fat: number
}

export interface MacroProgress {
  current: MacroTotals
  targets: MacroTargets
  percentages: {
    calories: number
    protein: number
    netCarbs: number
    fat?: number
  }
  remaining: {
    calories: number
    protein: number
    netCarbs: number
    fat?: number
  }
}

export interface MealMacros {
  name: string
  mealType?: string
  calories: number
  protein: number
  carbs: number
  fiber: number
  netCarbs: number
  fat: number
}

// Default targets based on user's AIP plan
export const DEFAULT_MACRO_TARGETS: MacroTargets = {
  calories: 2600,
  protein: 150,
  netCarbs: 80,
}

// Calculate net carbs from total carbs and fiber
export function calculateNetCarbs(carbs: number, fiber: number): number {
  return Math.max(0, carbs - fiber)
}

// Sum macros from multiple AIP meal entries - use recipe macros if linked, scaled by servings
export function sumMealMacros(meals: MealWithRecipe[]): MacroTotals {
  const initial: MacroTotals = { calories: 0, protein: 0, carbs: 0, fiber: 0, netCarbs: 0, fat: 0 }
  return meals.reduce(
    (totals: MacroTotals, meal) => {
      const s = meal.actualServings ?? meal.servings ?? 1
      return {
        calories: totals.calories + (meal.recipe?.calories ?? meal.calories ?? 0) * s,
        protein: totals.protein + (meal.recipe?.protein ?? meal.protein ?? 0) * s,
        carbs: totals.carbs + (meal.recipe?.carbs ?? meal.carbs ?? 0) * s,
        fiber: totals.fiber + (meal.recipe?.fiber ?? meal.fiber ?? 0) * s,
        netCarbs: totals.netCarbs + (meal.recipe?.netCarbs ?? meal.netCarbs ?? 0) * s,
        fat: totals.fat + (meal.recipe?.fat ?? meal.fat ?? 0) * s,
      }
    },
    initial
  )
}

// Calculate progress towards targets
export function calculateMacroProgress(
  meals: MealWithRecipe[],
  targets: MacroTargets = DEFAULT_MACRO_TARGETS
): MacroProgress {
  const current = sumMealMacros(meals)

  return {
    current,
    targets,
    percentages: {
      calories: Math.round((current.calories / targets.calories) * 100),
      protein: Math.round((current.protein / targets.protein) * 100),
      netCarbs: Math.round((current.netCarbs / targets.netCarbs) * 100),
      fat: targets.fat ? Math.round((current.fat / targets.fat) * 100) : undefined,
    },
    remaining: {
      calories: Math.max(0, targets.calories - current.calories),
      protein: Math.max(0, targets.protein - current.protein),
      netCarbs: Math.max(0, targets.netCarbs - current.netCarbs),
      fat: targets.fat ? Math.max(0, targets.fat - current.fat) : undefined,
    },
  }
}

// Scale macros by serving size
export function scaleMacros(macros: MealMacros, servings: number): MealMacros {
  return {
    ...macros,
    calories: Math.round(macros.calories * servings),
    protein: Math.round(macros.protein * servings * 10) / 10,
    carbs: Math.round(macros.carbs * servings * 10) / 10,
    fiber: Math.round(macros.fiber * servings * 10) / 10,
    netCarbs: Math.round(macros.netCarbs * servings * 10) / 10,
    fat: Math.round(macros.fat * servings * 10) / 10,
  }
}

// Get status color based on percentage
export function getMacroStatusColor(percentage: number, type: 'target' | 'limit'): string {
  if (type === 'target') {
    // For protein/calories - higher is better (up to 100%)
    if (percentage >= 90) return 'text-green-500'
    if (percentage >= 70) return 'text-yellow-500'
    return 'text-slate-400'
  } else {
    // For carbs - lower is better (staying under limit)
    if (percentage <= 80) return 'text-green-500'
    if (percentage <= 100) return 'text-yellow-500'
    return 'text-red-500'
  }
}

// Get progress bar color based on percentage
export function getMacroProgressBarColor(percentage: number, type: 'target' | 'limit'): string {
  if (type === 'target') {
    if (percentage >= 90) return 'bg-green-500'
    if (percentage >= 70) return 'bg-yellow-500'
    return 'bg-slate-400'
  } else {
    if (percentage <= 80) return 'bg-green-500'
    if (percentage <= 100) return 'bg-yellow-500'
    return 'bg-red-500'
  }
}

// Predefined meal macros for the standard AIP day structure
export const STANDARD_AIP_MEALS: Record<string, MealMacros> = {
  MORNING_COFFEE: {
    name: 'Morning Coffee',
    mealType: 'MORNING_COFFEE',
    calories: 130,
    protein: 0,
    carbs: 3,
    fiber: 1,
    netCarbs: 2,
    fat: 15, // MCT oil + mushroom powder
  },
  SMOOTHIE: {
    name: 'AIP Berry Smoothie',
    mealType: 'SMOOTHIE',
    calories: 725,
    protein: 42,
    carbs: 38,
    fiber: 6,
    netCarbs: 32,
    fat: 28, // Olive oil + coconut oil
  },
  // Standard lunch template (will vary by recipe)
  LUNCH_TEMPLATE: {
    name: 'Lunch',
    mealType: 'LUNCH',
    calories: 650,
    protein: 45,
    carbs: 15,
    fiber: 3,
    netCarbs: 12,
    fat: 20,
  },
  // Afternoon snack options
  AFTERNOON_SNACK_BROTH: {
    name: 'Bone Broth + Collagen',
    mealType: 'AFTERNOON_SNACK',
    calories: 200,
    protein: 20,
    carbs: 3,
    fiber: 0,
    netCarbs: 3,
    fat: 1,
  },
  AFTERNOON_SNACK_PROTEIN: {
    name: 'Leftover Protein (4-5oz)',
    mealType: 'AFTERNOON_SNACK',
    calories: 200,
    protein: 25,
    carbs: 0,
    fiber: 0,
    netCarbs: 0,
    fat: 5,
  },
  // Standard dinner template (will vary by recipe)
  DINNER_TEMPLATE: {
    name: 'Dinner',
    mealType: 'DINNER',
    calories: 650,
    protein: 45,
    carbs: 15,
    fiber: 3,
    netCarbs: 12,
    fat: 20,
  },
  // Evening snack options
  EVENING_SNACK_COLLAGEN: {
    name: 'Collagen Hot Drink',
    mealType: 'EVENING_SNACK',
    calories: 100,
    protein: 12,
    carbs: 0,
    fiber: 0,
    netCarbs: 0,
    fat: 0,
  },
  EVENING_SNACK_APPLE: {
    name: 'Apple + Collagen Drink',
    mealType: 'EVENING_SNACK',
    calories: 200,
    protein: 12,
    carbs: 15,
    fiber: 3,
    netCarbs: 12,
    fat: 0,
  },
  EVENING_SNACK_BROTH: {
    name: 'Bone Broth + Collagen',
    mealType: 'EVENING_SNACK',
    calories: 150,
    protein: 15,
    carbs: 3,
    fiber: 0,
    netCarbs: 3,
    fat: 1,
  },
}

// Calculate ideal remaining macros for a specific meal slot
export function calculateRemainingForMeal(
  currentTotals: MacroTotals,
  targets: MacroTargets,
  remainingMealCount: number
): MacroTargets {
  const remaining = {
    calories: Math.max(0, targets.calories - currentTotals.calories),
    protein: Math.max(0, targets.protein - currentTotals.protein),
    netCarbs: Math.max(0, targets.netCarbs - currentTotals.netCarbs),
  }

  // Distribute remaining evenly among remaining meals
  return {
    calories: Math.round(remaining.calories / remainingMealCount),
    protein: Math.round(remaining.protein / remainingMealCount),
    netCarbs: Math.round(remaining.netCarbs / remainingMealCount),
  }
}

// Check if day is on track for targets
export interface DayStatus {
  onTrack: boolean
  messages: string[]
}

export function checkDayStatus(
  progress: MacroProgress,
  hoursRemaining: number
): DayStatus {
  const messages: string[] = []
  let onTrack = true

  // Check protein
  if (progress.percentages.protein < 50 && hoursRemaining < 6) {
    messages.push(`Low protein: ${progress.remaining.protein}g remaining`)
    onTrack = false
  }

  // Check calories
  if (progress.percentages.calories < 70 && hoursRemaining < 4) {
    messages.push(`Low calories: ${progress.remaining.calories} remaining`)
    onTrack = false
  }

  // Check carbs (over limit)
  if (progress.percentages.netCarbs > 100) {
    messages.push(`Over carb limit by ${Math.round(progress.current.netCarbs - progress.targets.netCarbs)}g`)
    onTrack = false
  }

  if (onTrack && messages.length === 0) {
    messages.push('On track!')
  }

  return { onTrack, messages }
}

import type { AIPFood, AIPPhase, AIPFoodCategory, TyramineLevel, HistamineLevel, AIPRestriction } from '@prisma/client'

export interface AIPFoodFilter {
  category?: AIPFoodCategory
  aipPhase?: AIPPhase
  tyramineLevel?: TyramineLevel
  histamineLevel?: HistamineLevel
  searchTerm?: string
  excludeAvoid?: boolean
}

// Category display names
export const CATEGORY_LABELS: Record<AIPFoodCategory, string> = {
  MEAT_POULTRY: 'Poultry',
  MEAT_BEEF: 'Beef',
  MEAT_PORK: 'Pork',
  SEAFOOD: 'Seafood',
  VEGETABLE: 'Vegetables',
  FRUIT: 'Fruits',
  FAT_OIL: 'Fats & Oils',
  HERB_SPICE: 'Herbs & Spices',
  BROTH: 'Broths',
  SMOOTHIE_INGREDIENT: 'Smoothie Ingredients',
  BEVERAGE: 'Beverages',
  OTHER: 'Other',
}

// Category order for display
export const CATEGORY_ORDER: AIPFoodCategory[] = [
  'MEAT_POULTRY',
  'MEAT_BEEF',
  'MEAT_PORK',
  'SEAFOOD',
  'VEGETABLE',
  'FRUIT',
  'FAT_OIL',
  'BROTH',
  'SMOOTHIE_INGREDIENT',
  'BEVERAGE',
  'HERB_SPICE',
  'OTHER',
]

// AIP Phase display
export const PHASE_LABELS: Record<AIPPhase, string> = {
  ELIMINATION: 'Elimination (Safe)',
  REINTRO_1: 'Reintro Stage 1',
  REINTRO_2: 'Reintro Stage 2',
  REINTRO_3: 'Reintro Stage 3',
  REINTRO_4: 'Reintro Stage 4',
  PERSONAL_AVOID: 'Personal Avoid',
  SAFE: 'Safe (Reintroduced)',
  AVOID: 'Avoid',
}

export const PHASE_COLORS: Record<AIPPhase, string> = {
  ELIMINATION: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  REINTRO_1: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  REINTRO_2: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  REINTRO_3: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  REINTRO_4: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  PERSONAL_AVOID: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  SAFE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  AVOID: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

// Tyramine/Histamine level display
export const LEVEL_LABELS: Record<TyramineLevel | HistamineLevel, string> = {
  LOW: 'Low',
  MODERATE: 'Moderate',
  HIGH: 'High',
}

export const TYRAMINE_COLORS: Record<TyramineLevel, string> = {
  LOW: 'text-green-600',
  MODERATE: 'text-yellow-600',
  HIGH: 'text-red-600',
}

export const HISTAMINE_COLORS: Record<HistamineLevel, string> = {
  LOW: 'text-green-600',
  MODERATE: 'text-yellow-600',
  HIGH: 'text-red-600',
}

// Check if a food is safe based on restrictions
export function isFoodSafe(food: AIPFood, restrictions: AIPRestriction[]): boolean {
  // Check AIP phase
  if (food.aipPhase === 'AVOID') {
    return false
  }

  // Check tyramine level (important for migraine prevention)
  if (food.tyramineLevel === 'HIGH') {
    return false
  }

  // Check against specific restrictions
  const restrictedFoodNames = restrictions.map((r) => r.foodName.toLowerCase())
  if (restrictedFoodNames.includes(food.name.toLowerCase())) {
    return false
  }

  return true
}

// Get quality badges for a food
export interface QualityBadge {
  label: string
  color: string
}

export function getQualityBadges(food: AIPFood): QualityBadge[] {
  const badges: QualityBadge[] = []

  if (food.preferOrganic) {
    badges.push({ label: 'Organic', color: 'bg-green-100 text-green-800' })
  }
  if (food.preferGrassFed) {
    badges.push({ label: 'Grass-Fed', color: 'bg-emerald-100 text-emerald-800' })
  }
  if (food.preferWildCaught) {
    badges.push({ label: 'Wild-Caught', color: 'bg-blue-100 text-blue-800' })
  }
  if (food.preferPasture) {
    badges.push({ label: 'Pasture-Raised', color: 'bg-amber-100 text-amber-800' })
  }
  if (food.preferNonGMO) {
    badges.push({ label: 'Non-GMO', color: 'bg-purple-100 text-purple-800' })
  }

  return badges
}

// Filter foods based on criteria
export function filterFoods(foods: AIPFood[], filter: AIPFoodFilter): AIPFood[] {
  return foods.filter((food) => {
    if (filter.excludeAvoid && food.aipPhase === 'AVOID') {
      return false
    }
    if (filter.category && food.category !== filter.category) {
      return false
    }
    if (filter.aipPhase && food.aipPhase !== filter.aipPhase) {
      return false
    }
    if (filter.tyramineLevel && food.tyramineLevel !== filter.tyramineLevel) {
      return false
    }
    if (filter.histamineLevel && food.histamineLevel !== filter.histamineLevel) {
      return false
    }
    if (filter.searchTerm) {
      const search = filter.searchTerm.toLowerCase()
      return food.name.toLowerCase().includes(search)
    }
    return true
  })
}

// Group foods by category
export function groupFoodsByCategory(foods: AIPFood[]): Map<AIPFoodCategory, AIPFood[]> {
  const grouped = new Map<AIPFoodCategory, AIPFood[]>()

  for (const category of CATEGORY_ORDER) {
    const categoryFoods = foods.filter((f) => f.category === category)
    if (categoryFoods.length > 0) {
      grouped.set(category, categoryFoods)
    }
  }

  return grouped
}

// Calculate macros for a food at a given serving
export interface FoodWithMacros {
  food: AIPFood
  servingGrams: number
  calories: number
  protein: number
  carbs: number
  fiber: number
  netCarbs: number
  fat: number
}

export function calculateFoodMacros(food: AIPFood, servingGrams: number): FoodWithMacros {
  const multiplier = servingGrams / 100 // Nutritional data is per 100g

  return {
    food,
    servingGrams,
    calories: Math.round(food.calories * multiplier),
    protein: Math.round(food.protein * multiplier * 10) / 10,
    carbs: Math.round(food.carbs * multiplier * 10) / 10,
    fiber: Math.round(food.fiber * multiplier * 10) / 10,
    netCarbs: Math.round(food.netCarbs * multiplier * 10) / 10,
    fat: Math.round(food.fat * multiplier * 10) / 10,
  }
}

// Standard restrictions for AIP elimination phase
export const STANDARD_AIP_RESTRICTIONS = [
  'Eggs',
  'Dairy',
  'Nuts',
  'Seeds',
  'Legumes',
  'Grains',
  'Nightshades',
  'Refined sugars',
  'Alcohol',
  'Coffee (reintroduce carefully)',
  'NSAIDs',
]

// Additional restrictions for tyramine sensitivity
export const TYRAMINE_RESTRICTIONS = [
  'Aged cheeses',
  'Aged meats (salami, pepperoni, bacon)',
  'Fermented foods (sauerkraut, kimchi)',
  'Soy sauce',
  'Alcohol (especially red wine, beer)',
  'Overripe fruits',
  'Leftover protein (>24 hours)',
  'Yeast extracts',
]

// Check if a meal contains leftover protein that's too old
export function isLeftoverSafe(originalDate: Date, maxHours: number = 24): boolean {
  const now = new Date()
  const hoursDiff = (now.getTime() - originalDate.getTime()) / (1000 * 60 * 60)
  return hoursDiff <= maxHours
}

// Get a food's freshness warning
export function getLeftoverWarning(originalDate: Date, maxHours: number = 24): string | null {
  const now = new Date()
  const hoursDiff = (now.getTime() - originalDate.getTime()) / (1000 * 60 * 60)

  if (hoursDiff > maxHours) {
    return `This leftover is ${Math.round(hoursDiff)} hours old (max ${maxHours}h for tyramine safety)`
  }
  if (hoursDiff > maxHours * 0.75) {
    const remaining = Math.round(maxHours - hoursDiff)
    return `Use within ${remaining} hours for tyramine safety`
  }
  return null
}

// Format macros for display
export function formatMacros(food: AIPFood): string {
  return `${Math.round(food.calories)} cal | ${food.protein}g P | ${food.netCarbs}g NC | ${food.fat}g F`
}

// Grocery list helper - determine quality notes
export function getGroceryQualityNote(food: AIPFood): string | null {
  const notes: string[] = []

  if (food.preferGrassFed) notes.push('grass-fed')
  if (food.preferWildCaught) notes.push('wild-caught')
  if (food.preferPasture) notes.push('pasture-raised')
  if (food.preferOrganic) notes.push('organic')
  if (food.preferNonGMO) notes.push('non-GMO')

  return notes.length > 0 ? notes.join(', ') : null
}

// Map common ingredient names to AIP food database
export function normalizeIngredientName(ingredient: string): string {
  const normalized = ingredient.toLowerCase().trim()

  // Common mappings
  const mappings: Record<string, string> = {
    'chicken': 'Chicken Breast',
    'chicken breast': 'Chicken Breast',
    'chicken thigh': 'Chicken Thighs',
    'chicken thighs': 'Chicken Thighs',
    'ground turkey': 'Ground Turkey',
    'turkey': 'Turkey Breast',
    'beef': 'Beef Steak (Sirloin)',
    'steak': 'Beef Steak (Sirloin)',
    'ground beef': 'Ground Beef',
    'pork': 'Pork Tenderloin',
    'pork tenderloin': 'Pork Tenderloin',
    'spinach': 'Spinach',
    'broccoli': 'Broccoli',
    'cauliflower': 'Cauliflower',
    'cauli rice': 'Cauliflower Rice',
    'cauliflower rice': 'Cauliflower Rice',
    'green beans': 'Green Beans',
    'zucchini': 'Zucchini',
    'carrots': 'Carrots',
    'carrot': 'Carrots',
    'sweet potato': 'White Sweet Potato',
    'white sweet potato': 'White Sweet Potato',
    'olive oil': 'Olive Oil',
    'coconut oil': 'Coconut Oil',
    'mct oil': 'MCT Oil',
    'collagen': 'Collagen Peptides',
    'collagen peptides': 'Collagen Peptides',
    'berries': 'Triple Berry Mix (Frozen)',
    'berry mix': 'Triple Berry Mix (Frozen)',
    'triple berry': 'Triple Berry Mix (Frozen)',
    'apple': 'Apple',
    'bone broth': 'Bone Broth (Chicken)',
    'chicken broth': 'Bone Broth (Chicken)',
    'beef broth': 'Bone Broth (Beef)',
  }

  return mappings[normalized] || ingredient
}

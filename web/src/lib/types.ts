export interface Ingredient {
  item: string
  quantity?: string
  unit?: string
}

export interface Recipe {
  id: string
  name: string
  ingredients: Ingredient[]
  instructions: string
  prepTime?: number
  cookTime?: number
  servings?: number
  tags: string[]
  source?: string
  imageUrl?: string
  isDraft?: boolean
  createdAt: string
  updatedAt: string
}

export interface MealPlanItem {
  id: string
  mealPlanId: string
  recipeId: string
  recipe: Recipe
  date: string
  servings: number
  notes?: string
  createdAt: string
}

export interface MealPlan {
  id: string
  weekStartDate: string
  status: 'DRAFT' | 'CONFIRMED'
  items: MealPlanItem[]
  groceryList?: GroceryList
  createdAt: string
  updatedAt: string
}

export interface GroceryItem {
  id: string
  groceryListId: string
  name: string
  quantity?: string
  unit?: string
  category: string
  recipeNames: string[]
  checked: boolean  // true = "have it", false = "need to buy"
  createdAt: string
  // Quality preferences
  preferOrganic?: boolean
  preferNonGMO?: boolean
  preferGrassFed?: boolean
  preferWildCaught?: boolean
  preferPasture?: boolean
  qualityNotes?: string
}

export interface GroceryList {
  id: string
  mealPlanId: string
  items: GroceryItem[]
  createdAt: string
  updatedAt: string
}

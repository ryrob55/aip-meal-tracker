import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

interface Ingredient {
  item: string
  quantity?: string
  unit?: string
}

// ==================== Quantity Parsing & Conversion ====================

interface ParsedQuantity {
  value: number
  unit: string
}

// Normalize common unit variations to standard forms
const unitNormalization: Record<string, string> = {
  // Weight
  'oz': 'oz', 'ounce': 'oz', 'ounces': 'oz',
  'lb': 'lb', 'lbs': 'lb', 'pound': 'lb', 'pounds': 'lb',
  'g': 'g', 'gram': 'g', 'grams': 'g',
  'kg': 'kg', 'kilogram': 'kg', 'kilograms': 'kg',
  // Volume
  'cup': 'cup', 'cups': 'cup', 'c': 'cup',
  'tbsp': 'tbsp', 'tablespoon': 'tbsp', 'tablespoons': 'tbsp', 'tbs': 'tbsp', 'tb': 'tbsp',
  'tsp': 'tsp', 'teaspoon': 'tsp', 'teaspoons': 'tsp',
  'ml': 'ml', 'milliliter': 'ml', 'milliliters': 'ml',
  'l': 'l', 'liter': 'l', 'liters': 'l',
  'quart': 'quart', 'quarts': 'quart', 'qt': 'quart',
  'pint': 'pint', 'pints': 'pint', 'pt': 'pint',
  'gallon': 'gallon', 'gallons': 'gallon', 'gal': 'gallon',
  'fl oz': 'fl oz', 'fluid ounce': 'fl oz', 'fluid ounces': 'fl oz',
  // Count
  'clove': 'clove', 'cloves': 'clove',
  'piece': 'piece', 'pieces': 'piece', 'pc': 'piece', 'pcs': 'piece',
  'slice': 'slice', 'slices': 'slice',
  'head': 'head', 'heads': 'head',
  'bunch': 'bunch', 'bunches': 'bunch',
  'sprig': 'sprig', 'sprigs': 'sprig',
  'can': 'can', 'cans': 'can',
  'jar': 'jar', 'jars': 'jar',
  'package': 'package', 'packages': 'package', 'pkg': 'package', 'pkgs': 'package',
  'bag': 'bag', 'bags': 'bag',
  'scoop': 'scoop', 'scoops': 'scoop',
}

// Unit conversion factors to base units
const unitConversions: Record<string, { base: string; factor: number }> = {
  // Weight: base = oz
  'oz': { base: 'oz', factor: 1 },
  'lb': { base: 'oz', factor: 16 },
  'g': { base: 'oz', factor: 0.035274 },
  'kg': { base: 'oz', factor: 35.274 },
  // Volume: base = tbsp
  'tsp': { base: 'tbsp', factor: 1/3 },
  'tbsp': { base: 'tbsp', factor: 1 },
  'cup': { base: 'tbsp', factor: 16 },
  'pint': { base: 'tbsp', factor: 32 },
  'quart': { base: 'tbsp', factor: 64 },
  'gallon': { base: 'tbsp', factor: 256 },
  'fl oz': { base: 'tbsp', factor: 2 },
  'ml': { base: 'tbsp', factor: 0.067628 },
  'l': { base: 'tbsp', factor: 67.628 },
}

// Parse a quantity string like "1/2", "1.5", "1 1/2", "2-3", etc.
function parseQuantityValue(str: string): number {
  if (!str) return 0
  str = str.trim()

  // Handle ranges like "2-3" - take the average
  if (str.includes('-')) {
    const parts = str.split('-').map(p => parseQuantityValue(p.trim()))
    return parts.reduce((a, b) => a + b, 0) / parts.length
  }

  // Handle mixed numbers like "1 1/2"
  const mixedMatch = str.match(/^(\d+)\s+(\d+)\/(\d+)$/)
  if (mixedMatch) {
    return parseInt(mixedMatch[1]) + parseInt(mixedMatch[2]) / parseInt(mixedMatch[3])
  }

  // Handle fractions like "1/2"
  if (str.includes('/')) {
    const [num, denom] = str.split('/')
    return parseFloat(num) / parseFloat(denom)
  }

  // Handle decimals
  const num = parseFloat(str)
  return isNaN(num) ? 0 : num
}

// Parse quantity string into value and unit
function parseQuantity(quantityStr: string | undefined, unitStr: string | undefined): ParsedQuantity | null {
  if (!quantityStr && !unitStr) return null

  let quantity = quantityStr || ''
  let unit = unitStr || ''

  // Sometimes the unit is embedded in the quantity string
  const match = quantity.match(/^([\d\s.\/\-]+)\s*(.*)$/)
  if (match) {
    const valueStr = match[1].trim()
    const embeddedUnit = match[2].trim()
    if (embeddedUnit && !unit) {
      unit = embeddedUnit
    }
    quantity = valueStr
  }

  const value = parseQuantityValue(quantity)
  const normalizedUnit = unitNormalization[unit.toLowerCase()] || unit.toLowerCase()

  return { value, unit: normalizedUnit }
}

// Convert quantity to base unit for aggregation
function toBaseUnit(parsed: ParsedQuantity): ParsedQuantity {
  const conversion = unitConversions[parsed.unit]
  if (conversion) {
    return {
      value: parsed.value * conversion.factor,
      unit: conversion.base,
    }
  }
  // Keep original if no conversion defined
  return parsed
}

// Convert from base unit to most practical shopping unit
function toShoppingUnit(value: number, baseUnit: string, category: string): string {
  if (value === 0) return ''

  // Weight (base = oz)
  if (baseUnit === 'oz') {
    // For meat, convert to pounds when >= 8 oz
    if (category === 'Meat & Protein' || value >= 16) {
      if (value >= 8) {
        const lbs = value / 16
        return formatQuantity(lbs, 'lb')
      }
    }
    return formatQuantity(value, 'oz')
  }

  // Volume (base = tbsp)
  if (baseUnit === 'tbsp') {
    // Convert to most practical unit
    if (value >= 256) { // 1 gallon or more
      return formatQuantity(value / 256, 'gallon')
    }
    if (value >= 64) { // 1 quart or more
      return formatQuantity(value / 64, 'quart')
    }
    if (value >= 16) { // 1 cup or more
      return formatQuantity(value / 16, 'cup')
    }
    if (value >= 3) { // 3+ tbsp
      return formatQuantity(value, 'tbsp')
    }
    // Less than 3 tbsp, use tsp
    return formatQuantity(value * 3, 'tsp')
  }

  // For other units, just return formatted
  return formatQuantity(value, baseUnit)
}

// Format a quantity nicely (round to reasonable precision, use fractions where appropriate)
function formatQuantity(value: number, unit: string): string {
  if (value === 0) return ''

  // Common fractions for cooking
  const fractions: [number, string][] = [
    [0.125, '1/8'],
    [0.25, '1/4'],
    [0.333, '1/3'],
    [0.375, '3/8'],
    [0.5, '1/2'],
    [0.625, '5/8'],
    [0.666, '2/3'],
    [0.75, '3/4'],
    [0.875, '7/8'],
  ]

  const whole = Math.floor(value)
  const frac = value - whole

  // For small fractions, try to find a nice representation
  if (frac > 0.05 && frac < 0.95) {
    for (const [fracValue, fracStr] of fractions) {
      if (Math.abs(frac - fracValue) < 0.04) {
        if (whole > 0) {
          return `${whole} ${fracStr} ${unit}`
        }
        return `${fracStr} ${unit}`
      }
    }
  }

  // Round to 1 decimal place for practical shopping
  const rounded = Math.round(value * 10) / 10
  if (rounded === Math.floor(rounded)) {
    return `${Math.floor(rounded)} ${unit}`
  }
  return `${rounded} ${unit}`
}

// Aggregate quantities with same or convertible units
interface AggregatedQuantity {
  quantities: { value: number; unit: string }[]
  baseValue: number
  baseUnit: string
}

function aggregateQuantities(quantities: ParsedQuantity[], category: string): string {
  if (quantities.length === 0) return ''

  // Group by base unit
  const byBaseUnit: Record<string, { values: number[]; originalUnit: string }> = {}
  const unconvertible: ParsedQuantity[] = []

  for (const q of quantities) {
    if (q.value === 0 && !q.unit) continue

    const base = toBaseUnit(q)
    const conversion = unitConversions[q.unit]

    if (conversion) {
      if (!byBaseUnit[base.unit]) {
        byBaseUnit[base.unit] = { values: [], originalUnit: q.unit }
      }
      byBaseUnit[base.unit].values.push(base.value)
    } else if (q.unit) {
      // Group by original unit if no conversion
      if (!byBaseUnit[q.unit]) {
        byBaseUnit[q.unit] = { values: [], originalUnit: q.unit }
      }
      byBaseUnit[q.unit].values.push(q.value)
    } else {
      unconvertible.push(q)
    }
  }

  const parts: string[] = []

  // Sum and format each base unit group
  for (const [baseUnit, data] of Object.entries(byBaseUnit)) {
    const total = data.values.reduce((a, b) => a + b, 0)
    if (total > 0) {
      const formatted = unitConversions[data.originalUnit]
        ? toShoppingUnit(total, baseUnit, category)
        : formatQuantity(total, baseUnit)
      if (formatted) parts.push(formatted)
    }
  }

  // Add unconvertible quantities
  for (const q of unconvertible) {
    if (q.value > 0) {
      parts.push(formatQuantity(q.value, q.unit))
    }
  }

  return parts.join(' + ') || ''
}

// Category mapping for common ingredients
const categoryMap: Record<string, string> = {
  // Meat/Protein
  chicken: 'Meat & Protein',
  beef: 'Meat & Protein',
  pork: 'Meat & Protein',
  ground: 'Meat & Protein',
  steak: 'Meat & Protein',
  bacon: 'Meat & Protein',
  sausage: 'Meat & Protein',
  turkey: 'Meat & Protein',
  salmon: 'Meat & Protein',
  fish: 'Meat & Protein',
  shrimp: 'Meat & Protein',
  cod: 'Meat & Protein',
  mahi: 'Meat & Protein',
  collagen: 'Supplements',
  // Produce
  onion: 'Produce',
  garlic: 'Produce',
  tomato: 'Produce',
  lettuce: 'Produce',
  spinach: 'Produce',
  carrot: 'Produce',
  potato: 'Produce',
  'sweet potato': 'Produce',
  pepper: 'Produce',
  broccoli: 'Produce',
  celery: 'Produce',
  mushroom: 'Produce',
  lemon: 'Produce',
  lime: 'Produce',
  avocado: 'Produce',
  cucumber: 'Produce',
  zucchini: 'Produce',
  apple: 'Produce',
  banana: 'Produce',
  orange: 'Produce',
  cilantro: 'Produce',
  parsley: 'Produce',
  basil: 'Produce',
  ginger: 'Produce',
  jalapeño: 'Produce',
  cauliflower: 'Produce',
  'green beans': 'Produce',
  // Dairy (AIP avoid but keeping for general use)
  milk: 'Dairy',
  cheese: 'Dairy',
  butter: 'Dairy',
  cream: 'Dairy',
  yogurt: 'Dairy',
  egg: 'Dairy',
  'sour cream': 'Dairy',
  // Pantry/Fats
  oil: 'Fats & Oils',
  'olive oil': 'Fats & Oils',
  'coconut oil': 'Fats & Oils',
  'mct oil': 'Fats & Oils',
  flour: 'Pantry',
  sugar: 'Pantry',
  salt: 'Pantry',
  'sea salt': 'Pantry',
  'black pepper': 'Pantry',
  rice: 'Pantry',
  pasta: 'Pantry',
  sauce: 'Pantry',
  broth: 'Broth & Stocks',
  'bone broth': 'Broth & Stocks',
  stock: 'Broth & Stocks',
  beans: 'Pantry',
  spice: 'Pantry',
  vinegar: 'Pantry',
  'soy sauce': 'Pantry',
  honey: 'Pantry',
  maple: 'Pantry',
  // Frozen
  frozen: 'Frozen',
  'ice cream': 'Frozen',
  'berry mix': 'Frozen',
  'triple berry': 'Frozen',
  // Bakery
  bread: 'Bakery',
  tortilla: 'Bakery',
  bun: 'Bakery',
  roll: 'Bakery',
}

// Quality preference mapping for AIP-compliant items
const qualityPreferenceMap: Record<string, {
  preferOrganic?: boolean
  preferNonGMO?: boolean
  preferGrassFed?: boolean
  preferWildCaught?: boolean
  preferPasture?: boolean
  qualityNotes?: string
}> = {
  // Beef should be grass-fed
  beef: { preferGrassFed: true, preferOrganic: true, qualityNotes: 'grass-fed preferred' },
  steak: { preferGrassFed: true, preferOrganic: true, qualityNotes: 'grass-fed preferred' },
  'ground beef': { preferGrassFed: true, preferOrganic: true, qualityNotes: 'grass-fed preferred' },
  // Poultry should be pasture-raised
  chicken: { preferPasture: true, preferOrganic: true, qualityNotes: 'pasture-raised preferred' },
  turkey: { preferPasture: true, preferOrganic: true, qualityNotes: 'pasture-raised preferred' },
  // Seafood should be wild-caught
  salmon: { preferWildCaught: true, qualityNotes: 'wild-caught only' },
  cod: { preferWildCaught: true, qualityNotes: 'wild-caught preferred' },
  mahi: { preferWildCaught: true, qualityNotes: 'wild-caught preferred' },
  fish: { preferWildCaught: true, qualityNotes: 'wild-caught preferred' },
  shrimp: { preferWildCaught: true, qualityNotes: 'wild-caught preferred' },
  // Vegetables - organic preferred
  spinach: { preferOrganic: true },
  zucchini: { preferOrganic: true },
  broccoli: { preferOrganic: true },
  cauliflower: { preferOrganic: true },
  carrot: { preferOrganic: true },
  'green beans': { preferOrganic: true },
  'sweet potato': { preferOrganic: true },
  apple: { preferOrganic: true },
  // Oils - organic
  'olive oil': { preferOrganic: true },
  'coconut oil': { preferOrganic: true },
  // Berries - organic (dirty dozen)
  berry: { preferOrganic: true, qualityNotes: 'organic (dirty dozen)' },
  'triple berry': { preferOrganic: true, qualityNotes: 'organic preferred' },
  // Collagen - grass-fed source
  collagen: { preferGrassFed: true, qualityNotes: 'grass-fed, single ingredient' },
}

function categorizeIngredient(item: string): string {
  const lowerItem = item.toLowerCase()
  for (const [keyword, category] of Object.entries(categoryMap)) {
    if (lowerItem.includes(keyword)) {
      return category
    }
  }
  return 'Other'
}

function getQualityPreferences(item: string) {
  const lowerItem = item.toLowerCase()
  for (const [keyword, prefs] of Object.entries(qualityPreferenceMap)) {
    if (lowerItem.includes(keyword)) {
      return prefs
    }
  }
  return {}
}

// POST /api/grocery - Generate grocery list from meal plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mealPlanId, includeAIPPreferences = true } = body

    // Get meal plan with recipes
    const mealPlan = await prisma.mealPlan.findUnique({
      where: { id: mealPlanId },
      include: {
        items: {
          include: {
            recipe: true,
          },
        },
      },
    })

    if (!mealPlan) {
      return NextResponse.json(
        { error: 'Meal plan not found' },
        { status: 404 }
      )
    }

    // Aggregate ingredients from all recipes, tracking which recipes they come from
    const ingredientMap = new Map<string, {
      quantities: ParsedQuantity[]
      category: string
      recipeNames: Set<string>
      qualityPrefs: {
        preferOrganic?: boolean
        preferNonGMO?: boolean
        preferGrassFed?: boolean
        preferWildCaught?: boolean
        preferPasture?: boolean
        qualityNotes?: string
      }
    }>()

    for (const item of mealPlan.items) {
      // Skip items without recipes (custom meals)
      if (!item.recipe) continue

      const ingredients = item.recipe.ingredients as unknown as Ingredient[]
      const recipeName = item.recipe.name

      // Smart serving calculation:
      // If recipe makes 4 servings and user wants 4, multiplier = 1 (not 4)
      // If recipe makes 1 serving (AIP) and user wants 4, multiplier = 4
      const requestedServings = item.servings || 1
      const recipeBaseServings = item.recipe.servings || 1
      const servingsMultiplier = requestedServings / recipeBaseServings

      for (const ing of ingredients) {
        const key = ing.item.toLowerCase().trim()
        const existing = ingredientMap.get(key)
        const category = categorizeIngredient(ing.item)

        // Parse and scale the quantity
        const parsed = parseQuantity(ing.quantity, ing.unit)
        let scaledQuantity: ParsedQuantity | null = null
        if (parsed) {
          scaledQuantity = {
            value: parsed.value * servingsMultiplier,
            unit: parsed.unit,
          }
        }

        if (existing) {
          // Add to existing quantities for aggregation
          if (scaledQuantity) {
            existing.quantities.push(scaledQuantity)
          }
          existing.recipeNames.add(recipeName)
        } else {
          ingredientMap.set(key, {
            quantities: scaledQuantity ? [scaledQuantity] : [],
            category,
            recipeNames: new Set([recipeName]),
            qualityPrefs: includeAIPPreferences ? getQualityPreferences(ing.item) : {},
          })
        }
      }
    }

    // Also include items from meals with mealName but no recipe (like smoothies, coffee)
    // These would need to be added separately based on the meal plan items

    // Delete existing grocery list if any
    await prisma.groceryList.deleteMany({
      where: { mealPlanId },
    })

    // Create new grocery list with aggregated quantities
    const groceryList = await prisma.groceryList.create({
      data: {
        mealPlanId,
        items: {
          create: Array.from(ingredientMap.entries()).map(([name, data]) => {
            // Aggregate all quantities into a single shopping-friendly string
            const aggregatedQuantity = aggregateQuantities(data.quantities, data.category)

            return {
              name: name.charAt(0).toUpperCase() + name.slice(1),
              quantity: aggregatedQuantity,
              unit: '', // Unit is now included in the aggregated quantity string
              category: data.category,
              recipeNames: Array.from(data.recipeNames),
              preferOrganic: data.qualityPrefs.preferOrganic || false,
              preferNonGMO: data.qualityPrefs.preferNonGMO || false,
              preferGrassFed: data.qualityPrefs.preferGrassFed || false,
              preferWildCaught: data.qualityPrefs.preferWildCaught || false,
              preferPasture: data.qualityPrefs.preferPasture || false,
              qualityNotes: data.qualityPrefs.qualityNotes,
              aipCompliant: true,
            }
          }),
        },
      },
      include: {
        items: {
          orderBy: [
            { category: 'asc' },
            { name: 'asc' },
          ],
        },
      },
    })

    return NextResponse.json(groceryList, { status: 201 })
  } catch (error) {
    console.error('Failed to generate grocery list:', error)
    return NextResponse.json(
      { error: 'Failed to generate grocery list' },
      { status: 500 }
    )
  }
}

// PUT /api/grocery - Toggle item checked status or update quality preferences
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      itemId,
      checked,
      preferOrganic,
      preferNonGMO,
      preferGrassFed,
      preferWildCaught,
      preferPasture,
      qualityNotes,
    } = body

    const updateData: Record<string, unknown> = {}

    if (checked !== undefined) updateData.checked = checked
    if (preferOrganic !== undefined) updateData.preferOrganic = preferOrganic
    if (preferNonGMO !== undefined) updateData.preferNonGMO = preferNonGMO
    if (preferGrassFed !== undefined) updateData.preferGrassFed = preferGrassFed
    if (preferWildCaught !== undefined) updateData.preferWildCaught = preferWildCaught
    if (preferPasture !== undefined) updateData.preferPasture = preferPasture
    if (qualityNotes !== undefined) updateData.qualityNotes = qualityNotes

    const item = await prisma.groceryItem.update({
      where: { id: itemId },
      data: updateData,
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Failed to update grocery item:', error)
    return NextResponse.json(
      { error: 'Failed to update grocery item' },
      { status: 500 }
    )
  }
}

// GET /api/grocery - Get grocery list for a meal plan
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const mealPlanId = searchParams.get('mealPlanId')

    if (!mealPlanId) {
      return NextResponse.json(
        { error: 'Meal plan ID required' },
        { status: 400 }
      )
    }

    const groceryList = await prisma.groceryList.findUnique({
      where: { mealPlanId },
      include: {
        items: {
          orderBy: [
            { category: 'asc' },
            { name: 'asc' },
          ],
        },
      },
    })

    if (!groceryList) {
      return NextResponse.json(null)
    }

    // Group items by category for easier display
    const groupedItems: Record<string, typeof groceryList.items> = {}
    for (const item of groceryList.items) {
      if (!groupedItems[item.category]) {
        groupedItems[item.category] = []
      }
      groupedItems[item.category].push(item)
    }

    return NextResponse.json({
      ...groceryList,
      groupedItems,
    })
  } catch (error) {
    console.error('Failed to fetch grocery list:', error)
    return NextResponse.json(
      { error: 'Failed to fetch grocery list' },
      { status: 500 }
    )
  }
}

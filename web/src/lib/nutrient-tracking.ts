// Rule-based nutrient deficiency detection for AIP diet
// Flags likely deficiencies based on food categories NOT being logged

export interface NutrientNudge {
  nutrient: string
  message: string
  suggestion: string
  priority: 'low' | 'medium' | 'high'
  daysSinceLast: number | null // null = never logged
}

interface NutrientRule {
  nutrient: string
  foodKeywords: string[] // foods rich in this nutrient
  maxDaysWithout: number // trigger nudge after this many days
  message: string
  suggestion: string
}

const NUTRIENT_RULES: NutrientRule[] = [
  {
    nutrient: 'Calcium',
    foodKeywords: ['sardine', 'salmon', 'bone broth', 'collard', 'kale', 'bok choy', 'broccoli', 'turnip greens'],
    maxDaysWithout: 3,
    message: 'You may be low on calcium',
    suggestion: 'Try sardines, bone broth, or dark leafy greens (collards, kale, bok choy)',
  },
  {
    nutrient: 'Vitamin B12',
    foodKeywords: ['liver', 'organ', 'beef', 'lamb', 'salmon', 'tuna', 'sardine', 'clam', 'oyster'],
    maxDaysWithout: 7,
    message: 'B12 comes primarily from animal sources',
    suggestion: 'Include liver, beef, or fatty fish this week',
  },
  {
    nutrient: 'Iron',
    foodKeywords: ['liver', 'organ', 'beef', 'lamb', 'venison', 'bison', 'oyster', 'spinach'],
    maxDaysWithout: 5,
    message: 'Iron-rich foods have been sparse lately',
    suggestion: 'Red meat, liver, or oysters are excellent AIP-safe iron sources',
  },
  {
    nutrient: 'Zinc',
    foodKeywords: ['oyster', 'beef', 'lamb', 'pumpkin', 'liver', 'crab', 'lobster'],
    maxDaysWithout: 5,
    message: 'Zinc supports immune function and gut healing',
    suggestion: 'Oysters are the richest zinc source, followed by beef and lamb',
  },
  {
    nutrient: 'Omega-3',
    foodKeywords: ['salmon', 'sardine', 'mackerel', 'herring', 'anchov', 'tuna', 'fish oil'],
    maxDaysWithout: 4,
    message: 'Omega-3s are critical for reducing inflammation',
    suggestion: 'Aim for fatty fish (salmon, sardines, mackerel) 3+ times per week',
  },
  {
    nutrient: 'Vitamin D',
    foodKeywords: ['salmon', 'sardine', 'mackerel', 'tuna', 'cod liver', 'mushroom'],
    maxDaysWithout: 5,
    message: 'Few foods contain vitamin D naturally',
    suggestion: 'Fatty fish is the best dietary source. Consider sunlight exposure and supplementation.',
  },
  {
    nutrient: 'Magnesium',
    foodKeywords: ['spinach', 'swiss chard', 'avocado', 'banana', 'plantain', 'sweet potato', 'dark chocolate'],
    maxDaysWithout: 3,
    message: 'Magnesium supports sleep and muscle recovery',
    suggestion: 'Dark leafy greens, avocado, and sweet potato are good AIP sources',
  },
  {
    nutrient: 'Organ Meats',
    foodKeywords: ['liver', 'heart', 'kidney', 'organ'],
    maxDaysWithout: 14,
    message: "Organ meats are nature's multivitamin",
    suggestion: 'Try liver pate, heart skewers, or mix ground liver into ground beef (1:4 ratio)',
  },
  {
    nutrient: 'Collagen / Glycine',
    foodKeywords: ['bone broth', 'collagen', 'gelatin', 'oxtail', 'marrow'],
    maxDaysWithout: 5,
    message: 'Collagen supports gut lining repair',
    suggestion: 'Bone broth is the easiest source — try having a cup daily',
  },
]

/**
 * Check food logs against nutrient rules and generate nudges.
 * @param foodsByDay - Map of date string to food names eaten that day
 * @param lookbackDays - Number of days to look back (default 14)
 */
export function generateNutrientNudges(
  foodsByDay: Record<string, string[]>,
  lookbackDays = 14
): NutrientNudge[] {
  const nudges: NutrientNudge[] = []
  const today = new Date()

  // Sort dates descending
  const dates = Object.keys(foodsByDay).sort((a, b) => b.localeCompare(a))

  for (const rule of NUTRIENT_RULES) {
    let daysSinceLast: number | null = null

    // Find most recent day containing one of the nutrient's food keywords
    for (const dateStr of dates) {
      const foods = foodsByDay[dateStr]
      const hasNutrient = foods.some((food) =>
        rule.foodKeywords.some((kw) => food.toLowerCase().includes(kw))
      )

      if (hasNutrient) {
        const date = new Date(dateStr)
        daysSinceLast = Math.floor(
          (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
        )
        break
      }
    }

    const shouldNudge =
      daysSinceLast === null || daysSinceLast > rule.maxDaysWithout

    if (shouldNudge) {
      const priority: 'low' | 'medium' | 'high' =
        daysSinceLast === null
          ? 'high'
          : daysSinceLast > rule.maxDaysWithout * 2
          ? 'high'
          : daysSinceLast > rule.maxDaysWithout
          ? 'medium'
          : 'low'

      nudges.push({
        nutrient: rule.nutrient,
        message: rule.message,
        suggestion: rule.suggestion,
        priority,
        daysSinceLast,
      })
    }
  }

  // Sort by priority (high first)
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  nudges.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  return nudges
}

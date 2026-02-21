// Canonical food lists per reintroduction stage (1-4)
// Stage 1: least reactive -> Stage 4: most reactive

export interface ReintroFood {
  name: string
  notes?: string
}

export const REINTRO_STAGES: Record<number, { label: string; description: string; foods: ReintroFood[] }> = {
  1: {
    label: 'Stage 1 — Least Reactive',
    description: 'Start here. These foods are tolerated by most people.',
    foods: [
      { name: 'Egg Yolks', notes: 'Fully cooked, start with 1/2 yolk' },
      { name: 'Seed-Based Spices', notes: 'Cumin, coriander, fennel, mustard' },
      { name: 'Ghee', notes: 'Clarified butter (casein-free)' },
      { name: 'Fruit-Based Spices', notes: 'Black pepper, vanilla, allspice, nutmeg' },
      { name: 'Seed Oils', notes: 'Sesame oil, flaxseed oil (small amounts)' },
      { name: 'Cocoa Butter', notes: 'Pure cocoa butter, not chocolate' },
    ],
  },
  2: {
    label: 'Stage 2 — Moderate',
    description: 'After clearing Stage 1 foods.',
    foods: [
      { name: 'Seeds', notes: 'Chia, flax, hemp, sunflower, pumpkin, sesame' },
      { name: 'Cocoa/Chocolate', notes: 'Pure cocoa powder, dark chocolate (>70%)' },
      { name: 'Coffee', notes: 'Start with small amounts, observe energy and sleep' },
      { name: 'Egg Whites', notes: 'After egg yolks cleared in Stage 1' },
      { name: 'Legumes (soaked)', notes: 'Lentils, chickpeas, black beans — long soak/cook' },
      { name: 'Alcohol (moderate)', notes: 'Small amounts of clear spirits or dry wine' },
    ],
  },
  3: {
    label: 'Stage 3 — More Reactive',
    description: 'Proceed carefully. Track symptoms closely.',
    foods: [
      { name: 'Nuts', notes: 'Almonds, cashews, walnuts, pecans, macadamia' },
      { name: 'Grass-Fed Butter', notes: 'After ghee cleared' },
      { name: 'Heavy Cream', notes: 'After butter cleared' },
      { name: 'Rice', notes: 'White rice first, then brown' },
      { name: 'Gluten-Free Grains', notes: 'Oats (certified GF), quinoa, buckwheat, millet' },
      { name: 'Cheese (aged)', notes: 'Hard cheeses after cream cleared' },
    ],
  },
  4: {
    label: 'Stage 4 — Most Reactive',
    description: 'These are common triggers. Many people keep these limited.',
    foods: [
      { name: 'Nightshades', notes: 'Tomatoes, peppers, potatoes, eggplant — test one at a time' },
      { name: 'Dairy (full)', notes: 'Milk, yogurt, soft cheese, ice cream' },
      { name: 'Gluten Grains', notes: 'Wheat, barley, rye — test last' },
      { name: 'Soy', notes: 'Tofu, edamame, soy sauce' },
      { name: 'Corn', notes: 'Fresh corn, corn tortillas' },
      { name: 'Whole Eggs', notes: 'If egg whites not yet tested separately' },
    ],
  },
}

// Get all foods for stages up to the given number
export function getFoodsForStage(maxStage: number): ReintroFood[] {
  const foods: ReintroFood[] = []
  for (let i = 1; i <= maxStage; i++) {
    if (REINTRO_STAGES[i]) {
      foods.push(...REINTRO_STAGES[i].foods)
    }
  }
  return foods
}

// Get stage number for a food
export function getStageForFood(foodName: string): number | null {
  for (const [stage, data] of Object.entries(REINTRO_STAGES)) {
    if (data.foods.some((f) => f.name.toLowerCase() === foodName.toLowerCase())) {
      return parseInt(stage)
    }
  }
  return null
}

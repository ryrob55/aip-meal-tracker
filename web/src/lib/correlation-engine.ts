// Food-symptom correlation engine
// Compares average symptom scores on days when a food was eaten vs not eaten

import { CORE_SYMPTOMS, type SymptomId } from './symptom-utils'

export interface CorrelationResult {
  foodName: string
  symptomType: SymptomId
  avgWithFood: number
  avgWithoutFood: number
  delta: number // positive means food IMPROVES the symptom
  correlation: number // -1 to 1 normalized
  sampleSize: number
  confidence: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface DayData {
  date: string
  foods: string[] // food names eaten that day
  symptoms: Partial<Record<SymptomId, number>> // symptom scores
}

function getConfidence(sampleSize: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (sampleSize >= 20) return 'HIGH'
  if (sampleSize >= 10) return 'MEDIUM'
  return 'LOW'
}

/**
 * Calculate correlation between a specific food and symptom.
 * Returns null if insufficient data (< 5 data points for either group).
 */
export function calculateCorrelation(
  days: DayData[],
  foodName: string,
  symptomId: SymptomId
): CorrelationResult | null {
  const foodNameLower = foodName.toLowerCase()

  const withFood: number[] = []
  const withoutFood: number[] = []

  for (const day of days) {
    const score = day.symptoms[symptomId]
    if (score == null) continue

    const ateFood = day.foods.some((f) => f.toLowerCase().includes(foodNameLower))
    if (ateFood) {
      withFood.push(score)
    } else {
      withoutFood.push(score)
    }
  }

  // Need at least 3 data points in each group
  if (withFood.length < 3 || withoutFood.length < 3) return null

  const avgWith = withFood.reduce((s, v) => s + v, 0) / withFood.length
  const avgWithout = withoutFood.reduce((s, v) => s + v, 0) / withoutFood.length

  const delta = avgWith - avgWithout
  // Normalize to -1..1 range (max possible delta is 9, from 1-10 scale)
  const correlation = Math.max(-1, Math.min(1, delta / 5))

  return {
    foodName,
    symptomType: symptomId,
    avgWithFood: Math.round(avgWith * 10) / 10,
    avgWithoutFood: Math.round(avgWithout * 10) / 10,
    delta: Math.round(delta * 10) / 10,
    correlation: Math.round(correlation * 100) / 100,
    sampleSize: withFood.length + withoutFood.length,
    confidence: getConfidence(Math.min(withFood.length, withoutFood.length)),
  }
}

/**
 * Calculate correlations for all food-symptom combinations.
 * Returns only significant correlations (|delta| > 0.5).
 */
export function calculateAllCorrelations(
  days: DayData[],
  minAbsDelta = 0.5
): CorrelationResult[] {
  // Extract unique food names
  const foodSet = new Set<string>()
  for (const day of days) {
    for (const food of day.foods) {
      foodSet.add(food)
    }
  }

  const results: CorrelationResult[] = []

  for (const food of Array.from(foodSet)) {
    for (const symptom of CORE_SYMPTOMS) {
      const result = calculateCorrelation(days, food, symptom.id)
      if (result && Math.abs(result.delta) >= minAbsDelta) {
        results.push(result)
      }
    }
  }

  // Sort by absolute delta (most impactful first)
  results.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))

  return results
}

/**
 * Get food impact summary (averaged across all symptoms).
 */
export function getFoodImpact(
  days: DayData[],
  foodName: string
): { avgDelta: number; symptomResults: CorrelationResult[] } | null {
  const symptomResults: CorrelationResult[] = []

  for (const symptom of CORE_SYMPTOMS) {
    const result = calculateCorrelation(days, foodName, symptom.id)
    if (result) {
      symptomResults.push(result)
    }
  }

  if (symptomResults.length === 0) return null

  const avgDelta =
    symptomResults.reduce((s, r) => s + r.delta, 0) / symptomResults.length

  return {
    avgDelta: Math.round(avgDelta * 10) / 10,
    symptomResults,
  }
}

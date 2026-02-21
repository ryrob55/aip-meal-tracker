// Symptom tracking utilities

export const CORE_SYMPTOMS = [
  { id: 'energy', label: 'Energy', lowLabel: 'Exhausted', highLabel: 'Energized' },
  { id: 'pain', label: 'Pain', lowLabel: 'Severe', highLabel: 'None' },
  { id: 'digestion', label: 'Digestion', lowLabel: 'Severe issues', highLabel: 'Perfect' },
  { id: 'sleep', label: 'Sleep', lowLabel: 'Terrible', highLabel: 'Great' },
  { id: 'skin', label: 'Skin', lowLabel: 'Severe flare', highLabel: 'Clear' },
  { id: 'mood', label: 'Mood', lowLabel: 'Very low', highLabel: 'Great' },
  { id: 'brainFog', label: 'Brain Fog', lowLabel: 'Severe fog', highLabel: 'Crystal clear' },
  { id: 'headache', label: 'Headache', lowLabel: 'Severe', highLabel: 'None' },
] as const

export const QUICK_SYMPTOMS = ['energy', 'digestion', 'pain'] as const

export type SymptomId = typeof CORE_SYMPTOMS[number]['id']

export interface SymptomLogData {
  id?: string
  date: string
  time: 'MORNING' | 'EVENING'
  energy?: number | null
  pain?: number | null
  digestion?: number | null
  sleep?: number | null
  skin?: number | null
  mood?: number | null
  brainFog?: number | null
  headache?: number | null
  bristolScale?: number | null
  stressLevel?: number | null
  exerciseMinutes?: number | null
  hydrationOz?: number | null
  menstrualDay?: number | null
  notes?: string | null
  tags?: string[]
}

// Get color for a symptom score (1-10)
export function getScoreColor(score: number | null | undefined): string {
  if (score == null) return 'text-slate-500'
  if (score >= 8) return 'text-green-500'
  if (score >= 6) return 'text-green-400'
  if (score >= 4) return 'text-yellow-500'
  if (score >= 2) return 'text-orange-500'
  return 'text-red-500'
}

// Get background color for a symptom score
export function getScoreBgColor(score: number | null | undefined): string {
  if (score == null) return 'bg-slate-500/20'
  if (score >= 8) return 'bg-green-500/20'
  if (score >= 6) return 'bg-green-400/20'
  if (score >= 4) return 'bg-yellow-500/20'
  if (score >= 2) return 'bg-orange-500/20'
  return 'bg-red-500/20'
}

// Calculate average score from a list of logs for a specific symptom
export function averageScore(logs: SymptomLogData[], symptomId: SymptomId): number | null {
  const values = logs
    .map((log) => log[symptomId])
    .filter((v): v is number => v != null)

  if (values.length === 0) return null
  return Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 10) / 10
}

// Calculate overall wellness score (average of all reported symptoms)
export function overallScore(log: SymptomLogData): number | null {
  const scores = CORE_SYMPTOMS
    .map((s) => log[s.id])
    .filter((v): v is number => v != null)

  if (scores.length === 0) return null
  return Math.round((scores.reduce((sum, v) => sum + v, 0) / scores.length) * 10) / 10
}

// Calculate weekly averages from logs
export function weeklyAverages(
  logs: SymptomLogData[]
): Record<SymptomId, number | null> {
  const result = {} as Record<SymptomId, number | null>
  for (const symptom of CORE_SYMPTOMS) {
    result[symptom.id] = averageScore(logs, symptom.id)
  }
  return result
}

// Calculate trend: positive means improving, negative means declining
export function calculateTrend(
  recentLogs: SymptomLogData[],
  olderLogs: SymptomLogData[],
  symptomId: SymptomId
): number | null {
  const recentAvg = averageScore(recentLogs, symptomId)
  const olderAvg = averageScore(olderLogs, symptomId)

  if (recentAvg == null || olderAvg == null) return null
  return Math.round((recentAvg - olderAvg) * 10) / 10
}

// Count how many of the last N days have symptom logs
export function loggedDaysCount(logs: SymptomLogData[], days: number = 7): number {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffStr = cutoff.toISOString().split('T')[0]

  const uniqueDates = new Set(
    logs
      .filter((l) => l.date >= cutoffStr)
      .map((l) => l.date)
  )

  return uniqueDates.size
}

// Format a date string for display
export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

// Generate sparkline data points (last 7 days) for a specific symptom
export function sparklineData(
  logs: SymptomLogData[],
  symptomId: SymptomId,
  days: number = 7
): (number | null)[] {
  const today = new Date()
  const points: (number | null)[] = []

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]

    const dayLogs = logs.filter((l) => l.date === dateStr)
    const avg = averageScore(dayLogs, symptomId)
    points.push(avg)
  }

  return points
}

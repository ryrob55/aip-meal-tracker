// Reintroduction protocol state machine and utilities

export type ReintroStatusType =
  | 'NOT_STARTED'
  | 'TESTING_DAY0'
  | 'OBSERVING'
  | 'CONFIRMING'
  | 'COMPLETE'
  | 'ABANDONED'

export type ReintroResultType = 'PASS' | 'FAIL' | 'INCONCLUSIVE'

// Valid state transitions
const VALID_TRANSITIONS: Record<ReintroStatusType, ReintroStatusType[]> = {
  NOT_STARTED: ['TESTING_DAY0', 'ABANDONED'],
  TESTING_DAY0: ['OBSERVING', 'ABANDONED'],
  OBSERVING: ['CONFIRMING', 'COMPLETE', 'ABANDONED'], // Can go to COMPLETE with FAIL result
  CONFIRMING: ['COMPLETE', 'ABANDONED'],
  COMPLETE: [],
  ABANDONED: [],
}

export function canTransition(from: ReintroStatusType, to: ReintroStatusType): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

// Day 0 portion schedule
export const PORTION_SCHEDULE = [
  { portion: '1/2 teaspoon', waitMinutes: 15 },
  { portion: '1 teaspoon', waitMinutes: 15 },
  { portion: '1.5 teaspoons', waitMinutes: 150 }, // 2.5 hours
  { portion: 'Normal serving', waitMinutes: 0 }, // Done for the day
]

// Calculate dates for a test starting on testDate
export function calculateTestDates(testDate: Date) {
  const observationEnd = new Date(testDate)
  observationEnd.setDate(observationEnd.getDate() + 3)

  const confirmationStart = new Date(testDate)
  confirmationStart.setDate(confirmationStart.getDate() + 4)

  const confirmationEnd = new Date(testDate)
  confirmationEnd.setDate(confirmationEnd.getDate() + 7)

  return {
    testDate,
    observationEnd,
    confirmationStart,
    confirmationEnd,
  }
}

// Get the current day number of a test (0-indexed, Day 0 = test day)
export function getCurrentTestDay(testDate: Date): number {
  const now = new Date()
  const start = new Date(testDate)
  start.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

// Get expected status based on current day
export function getExpectedStatus(testDate: Date): ReintroStatusType {
  const day = getCurrentTestDay(testDate)
  if (day < 0) return 'NOT_STARTED'
  if (day === 0) return 'TESTING_DAY0'
  if (day <= 3) return 'OBSERVING'
  if (day <= 7) return 'CONFIRMING'
  return 'COMPLETE'
}

// Get display label for status (compassionate tone)
export function getStatusLabel(status: ReintroStatusType): string {
  switch (status) {
    case 'NOT_STARTED': return 'Not Started'
    case 'TESTING_DAY0': return 'Testing Today'
    case 'OBSERVING': return 'Observation Period'
    case 'CONFIRMING': return 'Confirmation Period'
    case 'COMPLETE': return 'Complete'
    case 'ABANDONED': return 'Paused'
  }
}

// Get display label for result (compassionate tone - never say "FAIL")
export function getResultLabel(result: ReintroResultType | null): string {
  switch (result) {
    case 'PASS': return 'Safe for You'
    case 'FAIL': return 'Reaction Detected'
    case 'INCONCLUSIVE': return 'Inconclusive'
    default: return 'Pending'
  }
}

export function getResultColor(result: ReintroResultType | null): string {
  switch (result) {
    case 'PASS': return 'text-green-500 bg-green-500/20'
    case 'FAIL': return 'text-orange-500 bg-orange-500/20'
    case 'INCONCLUSIVE': return 'text-yellow-500 bg-yellow-500/20'
    default: return 'text-slate-500 bg-slate-500/20'
  }
}

export function getStatusColor(status: ReintroStatusType): string {
  switch (status) {
    case 'NOT_STARTED': return 'text-slate-500 bg-slate-500/20'
    case 'TESTING_DAY0': return 'text-blue-500 bg-blue-500/20'
    case 'OBSERVING': return 'text-yellow-500 bg-yellow-500/20'
    case 'CONFIRMING': return 'text-purple-500 bg-purple-500/20'
    case 'COMPLETE': return 'text-green-500 bg-green-500/20'
    case 'ABANDONED': return 'text-slate-500 bg-slate-500/20'
  }
}

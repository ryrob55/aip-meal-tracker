// Rule-based nudge engine for AIP diet adherence and wellness

export interface Nudge {
  id: string
  type: 'info' | 'warning' | 'success' | 'tip'
  title: string
  message: string
  actionLabel?: string
  actionHref?: string
}

interface NudgeContext {
  daysOnProtocol: number
  mealsLoggedToday: number
  symptomsLoggedToday: boolean
  activeReintroTest: boolean
  completedReintroTests: number
  streakDays: number // out of last 7
  topCorrelationFood?: { food: string; delta: number; symptom: string }
}

/**
 * Generate contextual nudges based on user state.
 */
export function generateNudges(ctx: NudgeContext): Nudge[] {
  const nudges: Nudge[] = []

  // Logging encouragement
  if (ctx.mealsLoggedToday === 0) {
    nudges.push({
      id: 'log-meals',
      type: 'info',
      title: 'Track your meals today',
      message: "Logging meals helps us find patterns between food and symptoms.",
      actionLabel: 'Log a meal',
      actionHref: '/aip-diet',
    })
  }

  if (!ctx.symptomsLoggedToday) {
    nudges.push({
      id: 'log-symptoms',
      type: 'info',
      title: 'Daily check-in',
      message: 'A quick symptom check takes less than 30 seconds.',
      actionLabel: 'Check in',
      actionHref: '/symptoms',
    })
  }

  // Streak celebration
  if (ctx.streakDays >= 7) {
    nudges.push({
      id: 'streak-7',
      type: 'success',
      title: 'Amazing consistency!',
      message: `You've logged every day this week. Consistency is key to finding patterns.`,
    })
  } else if (ctx.streakDays >= 5) {
    nudges.push({
      id: 'streak-5',
      type: 'success',
      title: 'Great week so far!',
      message: `${ctx.streakDays} out of 7 days logged. Keep it up!`,
    })
  }

  // Protocol milestones
  if (ctx.daysOnProtocol === 30) {
    nudges.push({
      id: 'milestone-30',
      type: 'success',
      title: '30 days on AIP!',
      message: "You've reached a major milestone. Many people start feeling improvements around now.",
    })
  }

  if (ctx.daysOnProtocol >= 30 && !ctx.activeReintroTest && ctx.completedReintroTests === 0) {
    nudges.push({
      id: 'start-reintro',
      type: 'tip',
      title: 'Ready to reintroduce?',
      message: "After 30+ days on elimination, you can start testing foods one at a time.",
      actionLabel: 'Start a test',
      actionHref: '/reintro/new',
    })
  }

  // Correlation insight
  if (ctx.topCorrelationFood) {
    const { food, delta, symptom } = ctx.topCorrelationFood
    if (delta < -1) {
      nudges.push({
        id: 'correlation-negative',
        type: 'warning',
        title: `${food} may be affecting your ${symptom}`,
        message: `On days you eat ${food.toLowerCase()}, your ${symptom.toLowerCase()} scores tend to be ${Math.abs(delta).toFixed(1)} points lower.`,
        actionLabel: 'View details',
        actionHref: `/insights/food/${encodeURIComponent(food)}`,
      })
    } else if (delta > 1) {
      nudges.push({
        id: 'correlation-positive',
        type: 'success',
        title: `${food} seems to help your ${symptom}`,
        message: `On days you eat ${food.toLowerCase()}, your ${symptom.toLowerCase()} scores tend to be ${delta.toFixed(1)} points higher.`,
        actionLabel: 'View details',
        actionHref: `/insights/food/${encodeURIComponent(food)}`,
      })
    }
  }

  return nudges
}

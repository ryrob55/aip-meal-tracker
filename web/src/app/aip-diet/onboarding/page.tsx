'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import {
  AIPQuestionnaireProvider,
  type QuestionnaireData,
} from '@/contexts/AIPQuestionnaireContext'
import { QuestionnaireWizard } from '@/components/aip-diet'
import type { AIPQuestionnaire, AIPRestriction } from '@prisma/client'

type QuestionnaireWithRestrictions = AIPQuestionnaire & {
  restrictions: AIPRestriction[]
}

export default function OnboardingPage() {
  const { darkMode } = useTheme()
  const router = useRouter()

  // Fetch existing questionnaire if any
  const { data: existingQuestionnaire, isLoading } = useQuery<QuestionnaireWithRestrictions | null>({
    queryKey: ['aipQuestionnaire'],
    queryFn: async () => {
      const res = await fetch('/api/aip-diet/questionnaire')
      if (!res.ok) return null
      return res.json()
    },
  })

  // Convert database format to form format
  const initialData: Partial<QuestionnaireData> | undefined = existingQuestionnaire
    ? {
        name: existingQuestionnaire.name || undefined,
        dailyCalories: existingQuestionnaire.dailyCalories,
        dailyProtein: existingQuestionnaire.dailyProtein,
        dailyNetCarbs: existingQuestionnaire.dailyNetCarbs,
        eatingWindowStart: existingQuestionnaire.eatingWindowStart,
        eatingWindowEnd: existingQuestionnaire.eatingWindowEnd,
        includeSmoothie: existingQuestionnaire.includeSmoothie,
        smoothieTime: existingQuestionnaire.smoothieTime || undefined,
        includeSnack: existingQuestionnaire.includeSnack,
        snackTime: existingQuestionnaire.snackTime || undefined,
        includeMorningCoffee: existingQuestionnaire.includeMorningCoffee,
        morningCoffeeTime: existingQuestionnaire.morningCoffeeTime || undefined,
        preferredProteins: existingQuestionnaire.preferredProteins,
        healthGoals: existingQuestionnaire.healthGoals,
        allowLeftovers: existingQuestionnaire.allowLeftovers,
        maxLeftoverHours: existingQuestionnaire.maxLeftoverHours,
        restrictions: existingQuestionnaire.restrictions.map((r) => ({
          foodName: r.foodName,
          restrictionType: r.restrictionType,
          severity: r.severity,
          notes: r.notes || undefined,
        })),
      }
    : undefined

  const handleComplete = () => {
    router.push('/aip-diet')
  }

  if (isLoading) {
    return (
      <div
        className={cn(
          'min-h-screen flex items-center justify-center',
          darkMode ? 'bg-slate-900' : 'bg-slate-50'
        )}
      >
        <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className={cn('min-h-screen', darkMode ? 'bg-slate-900' : 'bg-slate-50')}>
      <AIPQuestionnaireProvider
        initialData={initialData}
        questionnaireId={existingQuestionnaire?.id}
      >
        <QuestionnaireWizard onComplete={handleComplete} darkMode={darkMode} />
      </AIPQuestionnaireProvider>
    </div>
  )
}

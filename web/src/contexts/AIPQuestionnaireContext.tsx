'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { AIPRestrictionType, AIPSeverity } from '@prisma/client'

// Questionnaire step types
export type QuestionnaireStep =
  | 'welcome'
  | 'restrictions'
  | 'goals'
  | 'macros'
  | 'fasting'
  | 'preferences'
  | 'review'

// Restriction data structure for the wizard
export interface RestrictionInput {
  foodName: string
  restrictionType: AIPRestrictionType
  severity: AIPSeverity
  notes?: string
}

// Full questionnaire data
export interface QuestionnaireData {
  name?: string

  // Macro Targets
  dailyCalories: number
  dailyProtein: number
  dailyNetCarbs: number

  // Intermittent Fasting
  eatingWindowStart: string // HH:MM
  eatingWindowEnd: string

  // Meal Preferences
  includeSmoothie: boolean
  smoothieTime?: string
  includeSnack: boolean
  snackTime?: string
  includeMorningCoffee: boolean
  morningCoffeeTime?: string

  // Protein Preferences
  preferredProteins: string[]

  // Health Goals
  healthGoals: string[]

  // Leftover Rules
  allowLeftovers: boolean
  maxLeftoverHours: number

  // Restrictions
  restrictions: RestrictionInput[]
}

// Default values matching the user's AIP plan
const defaultData: QuestionnaireData = {
  dailyCalories: 2600,
  dailyProtein: 150,
  dailyNetCarbs: 80,
  eatingWindowStart: '11:30',
  eatingWindowEnd: '18:30',
  includeSmoothie: true,
  smoothieTime: '11:30',
  includeSnack: true,
  snackTime: '18:30',
  includeMorningCoffee: true,
  morningCoffeeTime: '06:30',
  preferredProteins: [],
  healthGoals: [],
  allowLeftovers: true,
  maxLeftoverHours: 24,
  restrictions: [],
}

// Available health goals
export const HEALTH_GOALS = [
  { id: 'migraine', label: 'Migraine Prevention', description: 'Reduce tyramine exposure' },
  { id: 'inflammation', label: 'Reduce Inflammation', description: 'Anti-inflammatory focus' },
  { id: 'aip_elimination', label: 'AIP Elimination Phase', description: 'Strict AIP protocol' },
  { id: 'weight_loss', label: 'Weight Management', description: 'Calorie-conscious choices' },
  { id: 'gut_healing', label: 'Gut Healing', description: 'Focus on gut health' },
  { id: 'energy', label: 'Improve Energy', description: 'Balanced blood sugar' },
]

// Available protein options
export const PROTEIN_OPTIONS = [
  { id: 'chicken_breast', label: 'Chicken Breast' },
  { id: 'chicken_thighs', label: 'Chicken Thighs' },
  { id: 'ground_chicken', label: 'Ground Chicken' },
  { id: 'ground_turkey', label: 'Ground Turkey' },
  { id: 'turkey_breast', label: 'Turkey Breast' },
  { id: 'beef_steak', label: 'Beef Steak' },
  { id: 'beef_roast', label: 'Beef Roast' },
  { id: 'ground_beef', label: 'Ground Beef' },
  { id: 'pork_tenderloin', label: 'Pork Tenderloin' },
  { id: 'cod', label: 'Cod' },
  { id: 'mahi', label: 'Mahi-Mahi' },
]

// Common AIP restrictions
export const COMMON_RESTRICTIONS = [
  { foodName: 'Eggs', description: 'Common AIP elimination' },
  { foodName: 'Dairy', description: 'Including milk, cheese, butter' },
  { foodName: 'Nuts', description: 'All tree nuts and peanuts' },
  { foodName: 'Seeds', description: 'Including seed oils and spices' },
  { foodName: 'Legumes', description: 'Beans, lentils, peanuts' },
  { foodName: 'Grains', description: 'Including gluten-free grains' },
  { foodName: 'Nightshades', description: 'Tomatoes, peppers, potatoes, eggplant' },
  { foodName: 'Refined Sugars', description: 'White sugar, corn syrup' },
  { foodName: 'Alcohol', description: 'All alcoholic beverages' },
]

// Tyramine-specific restrictions
export const TYRAMINE_RESTRICTIONS = [
  { foodName: 'Aged Meats', description: 'Salami, pepperoni, bacon' },
  { foodName: 'Aged Cheese', description: 'Cheddar, parmesan, blue cheese' },
  { foodName: 'Fermented Foods', description: 'Sauerkraut, kimchi, kombucha' },
  { foodName: 'Soy Sauce', description: 'And similar fermented sauces' },
  { foodName: 'Red Wine', description: 'High tyramine content' },
]

interface AIPQuestionnaireContextType {
  // Current step
  currentStep: QuestionnaireStep
  setCurrentStep: (step: QuestionnaireStep) => void

  // Questionnaire data
  data: QuestionnaireData
  updateData: (updates: Partial<QuestionnaireData>) => void
  resetData: () => void

  // Restrictions management
  addRestriction: (restriction: RestrictionInput) => void
  removeRestriction: (foodName: string) => void
  updateRestriction: (foodName: string, updates: Partial<RestrictionInput>) => void

  // Navigation
  canGoNext: boolean
  canGoPrev: boolean
  goNext: () => void
  goPrev: () => void

  // Submission
  isSubmitting: boolean
  submitQuestionnaire: () => Promise<void>
  existingId?: string
  setExistingId: (id: string) => void
}

const AIPQuestionnaireContext = createContext<AIPQuestionnaireContextType | null>(null)

const STEP_ORDER: QuestionnaireStep[] = [
  'welcome',
  'restrictions',
  'goals',
  'macros',
  'fasting',
  'preferences',
  'review',
]

interface Props {
  children: ReactNode
  initialData?: Partial<QuestionnaireData>
  initialStep?: QuestionnaireStep
  questionnaireId?: string
}

export function AIPQuestionnaireProvider({
  children,
  initialData,
  initialStep = 'welcome',
  questionnaireId,
}: Props) {
  const [currentStep, setCurrentStep] = useState<QuestionnaireStep>(initialStep)
  const [data, setData] = useState<QuestionnaireData>({
    ...defaultData,
    ...initialData,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [existingId, setExistingId] = useState<string | undefined>(questionnaireId)

  const updateData = useCallback((updates: Partial<QuestionnaireData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }, [])

  const resetData = useCallback(() => {
    setData(defaultData)
    setCurrentStep('welcome')
  }, [])

  const addRestriction = useCallback((restriction: RestrictionInput) => {
    setData((prev) => ({
      ...prev,
      restrictions: [
        ...prev.restrictions.filter((r) => r.foodName !== restriction.foodName),
        restriction,
      ],
    }))
  }, [])

  const removeRestriction = useCallback((foodName: string) => {
    setData((prev) => ({
      ...prev,
      restrictions: prev.restrictions.filter((r) => r.foodName !== foodName),
    }))
  }, [])

  const updateRestriction = useCallback(
    (foodName: string, updates: Partial<RestrictionInput>) => {
      setData((prev) => ({
        ...prev,
        restrictions: prev.restrictions.map((r) =>
          r.foodName === foodName ? { ...r, ...updates } : r
        ),
      }))
    },
    []
  )

  const currentIndex = STEP_ORDER.indexOf(currentStep)
  const canGoNext = currentIndex < STEP_ORDER.length - 1
  const canGoPrev = currentIndex > 0

  const goNext = useCallback(() => {
    if (canGoNext) {
      setCurrentStep(STEP_ORDER[currentIndex + 1])
    }
  }, [currentIndex, canGoNext])

  const goPrev = useCallback(() => {
    if (canGoPrev) {
      setCurrentStep(STEP_ORDER[currentIndex - 1])
    }
  }, [currentIndex, canGoPrev])

  const submitQuestionnaire = useCallback(async () => {
    setIsSubmitting(true)
    try {
      const method = existingId ? 'PUT' : 'POST'
      const url = existingId
        ? `/api/aip-diet/questionnaire?id=${existingId}`
        : '/api/aip-diet/questionnaire'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to save questionnaire')
      }

      const result = await response.json()
      setExistingId(result.id)
    } finally {
      setIsSubmitting(false)
    }
  }, [data, existingId])

  return (
    <AIPQuestionnaireContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        data,
        updateData,
        resetData,
        addRestriction,
        removeRestriction,
        updateRestriction,
        canGoNext,
        canGoPrev,
        goNext,
        goPrev,
        isSubmitting,
        submitQuestionnaire,
        existingId,
        setExistingId,
      }}
    >
      {children}
    </AIPQuestionnaireContext.Provider>
  )
}

export function useAIPQuestionnaire() {
  const context = useContext(AIPQuestionnaireContext)
  if (!context) {
    throw new Error('useAIPQuestionnaire must be used within an AIPQuestionnaireProvider')
  }
  return context
}

export function useQuestionnaireStep() {
  const { currentStep, goNext, goPrev, canGoNext, canGoPrev, setCurrentStep } =
    useAIPQuestionnaire()
  return { currentStep, goNext, goPrev, canGoNext, canGoPrev, setCurrentStep }
}

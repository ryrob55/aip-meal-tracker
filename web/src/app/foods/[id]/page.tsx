'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Info } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

interface AIPFood {
  id: string
  name: string
  category: string
  aipPhase: string
  calories: number
  protein: number
  carbs: number
  fiber: number
  fat: number
  netCarbs: number
  histamineLevel: string
  tyramineLevel: string
  modifiedAIPAllowed: boolean
  whyRestricted: string | null
  reintroStage: number | null
  reintroNotes: string | null
  richInCalcium: boolean
  richInB12: boolean
  richInIron: boolean
  richInZinc: boolean
  richInIodine: boolean
  richInSelenium: boolean
  richInVitaminD: boolean
  richInMagnesium: boolean
  richInFolate: boolean
  richInCholine: boolean
  richInOmega3: boolean
  servingSize: string | null
  servingSizeGrams: number | null
  preferOrganic: boolean
  preferGrassFed: boolean
  preferWildCaught: boolean
  preferPasture: boolean
}

const NUTRIENT_LABELS: Record<string, string> = {
  richInCalcium: 'Calcium',
  richInB12: 'Vitamin B12',
  richInIron: 'Iron',
  richInZinc: 'Zinc',
  richInIodine: 'Iodine',
  richInSelenium: 'Selenium',
  richInVitaminD: 'Vitamin D',
  richInMagnesium: 'Magnesium',
  richInFolate: 'Folate',
  richInCholine: 'Choline',
  richInOmega3: 'Omega-3',
}

export default function FoodDetailPage() {
  const { darkMode } = useTheme()
  const params = useParams()
  const id = params.id as string

  const { data: food, isLoading } = useQuery<AIPFood>({
    queryKey: ['aip-food', id],
    queryFn: async () => {
      const res = await fetch(`/api/aip-diet/foods/${id}`)
      if (!res.ok) throw new Error('Not found')
      return res.json()
    },
  })

  if (isLoading || !food) {
    return (
      <div
        className={cn(
          'min-h-screen flex items-center justify-center',
          darkMode ? 'bg-slate-900' : 'bg-slate-50'
        )}
      >
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const nutrients = Object.entries(NUTRIENT_LABELS).filter(
    ([key]) => food[key as keyof AIPFood]
  )

  const qualityTips = [
    food.preferOrganic && 'Choose organic when possible',
    food.preferGrassFed && 'Look for grass-fed',
    food.preferWildCaught && 'Prefer wild-caught',
    food.preferPasture && 'Choose pasture-raised',
  ].filter(Boolean)

  return (
    <div
      className={cn(
        'min-h-screen p-4 pb-24',
        darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/foods"
          className={cn(
            'p-2 rounded-lg',
            darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-200'
          )}
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">{food.name}</h1>
          <span
            className={cn(
              'text-xs',
              darkMode ? 'text-slate-500' : 'text-slate-500'
            )}
          >
            {food.category.replace(/_/g, ' ')}
            {food.servingSize && ` · ${food.servingSize}`}
          </span>
        </div>
      </div>

      {/* Macros */}
      <div
        className={cn(
          'p-4 rounded-xl mb-4',
          darkMode ? 'bg-slate-900' : 'bg-white border border-slate-200'
        )}
      >
        <h3 className="text-sm font-medium mb-3">
          Nutrition {food.servingSizeGrams ? `(per ${food.servingSizeGrams}g)` : '(per 100g)'}
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Calories', value: `${food.calories}`, unit: 'kcal' },
            { label: 'Protein', value: `${food.protein}`, unit: 'g' },
            { label: 'Carbs', value: `${food.carbs}`, unit: 'g' },
            { label: 'Fiber', value: `${food.fiber}`, unit: 'g' },
            { label: 'Fat', value: `${food.fat}`, unit: 'g' },
            { label: 'Net Carbs', value: `${food.netCarbs}`, unit: 'g' },
          ].map((m) => (
            <div key={m.label} className="text-center">
              <div className="text-lg font-bold">{m.value}</div>
              <div
                className={cn(
                  'text-[10px]',
                  darkMode ? 'text-slate-500' : 'text-slate-500'
                )}
              >
                {m.label} ({m.unit})
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AIP Status */}
      <div
        className={cn(
          'p-4 rounded-xl mb-4',
          darkMode ? 'bg-slate-900' : 'bg-white border border-slate-200'
        )}
      >
        <h3 className="text-sm font-medium mb-2">AIP Status</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className={cn('text-sm', darkMode ? 'text-slate-300' : 'text-slate-700')}>
              Phase
            </span>
            <span className="text-sm font-medium">
              {food.aipPhase.replace(/_/g, ' ')}
            </span>
          </div>
          {food.modifiedAIPAllowed && (
            <div className="flex items-center justify-between">
              <span className={cn('text-sm', darkMode ? 'text-slate-300' : 'text-slate-700')}>
                Modified AIP (2024)
              </span>
              <span className="text-sm text-green-500">Allowed</span>
            </div>
          )}
          {food.reintroStage && (
            <div className="flex items-center justify-between">
              <span className={cn('text-sm', darkMode ? 'text-slate-300' : 'text-slate-700')}>
                Reintroduction Stage
              </span>
              <span className="text-sm font-medium">Stage {food.reintroStage}</span>
            </div>
          )}
          {food.histamineLevel !== 'LOW' && (
            <div className="flex items-center justify-between">
              <span className={cn('text-sm', darkMode ? 'text-slate-300' : 'text-slate-700')}>
                Histamine
              </span>
              <span
                className={cn(
                  'text-sm font-medium',
                  food.histamineLevel === 'HIGH' ? 'text-red-400' : 'text-yellow-400'
                )}
              >
                {food.histamineLevel}
              </span>
            </div>
          )}
          {food.tyramineLevel !== 'LOW' && (
            <div className="flex items-center justify-between">
              <span className={cn('text-sm', darkMode ? 'text-slate-300' : 'text-slate-700')}>
                Tyramine
              </span>
              <span
                className={cn(
                  'text-sm font-medium',
                  food.tyramineLevel === 'HIGH' ? 'text-red-400' : 'text-yellow-400'
                )}
              >
                {food.tyramineLevel}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Why Restricted */}
      {food.whyRestricted && (
        <div
          className={cn(
            'p-4 rounded-xl mb-4',
            darkMode
              ? 'bg-orange-500/10 border border-orange-500/30'
              : 'bg-orange-50 border border-orange-200'
          )}
        >
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-orange-500 mb-1">
                Why is this restricted?
              </h3>
              <p
                className={cn(
                  'text-sm',
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                )}
              >
                {food.whyRestricted}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reintro Notes */}
      {food.reintroNotes && (
        <div
          className={cn(
            'p-4 rounded-xl mb-4',
            darkMode
              ? 'bg-blue-500/10 border border-blue-500/30'
              : 'bg-blue-50 border border-blue-200'
          )}
        >
          <h3 className="text-sm font-medium text-blue-500 mb-1">
            Reintroduction Tips
          </h3>
          <p
            className={cn(
              'text-sm',
              darkMode ? 'text-slate-300' : 'text-slate-700'
            )}
          >
            {food.reintroNotes}
          </p>
        </div>
      )}

      {/* Nutrient Highlights */}
      {nutrients.length > 0 && (
        <div
          className={cn(
            'p-4 rounded-xl mb-4',
            darkMode ? 'bg-slate-900' : 'bg-white border border-slate-200'
          )}
        >
          <h3 className="text-sm font-medium mb-2">Rich In</h3>
          <div className="flex flex-wrap gap-1.5">
            {nutrients.map(([, label]) => (
              <span
                key={label}
                className={cn(
                  'text-xs px-2.5 py-1 rounded-full',
                  'text-green-500 bg-green-500/20'
                )}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quality Tips */}
      {qualityTips.length > 0 && (
        <div
          className={cn(
            'p-4 rounded-xl',
            darkMode ? 'bg-slate-900' : 'bg-white border border-slate-200'
          )}
        >
          <h3 className="text-sm font-medium mb-2">Quality Tips</h3>
          <ul className="space-y-1">
            {qualityTips.map((tip) => (
              <li
                key={tip as string}
                className={cn(
                  'text-sm flex items-center gap-2',
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                )}
              >
                <span className="text-green-500">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

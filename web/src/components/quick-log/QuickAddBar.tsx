'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FavoriteFood {
  id: string
  foodName: string
  defaultAmount: string | null
  macros: { calories?: number; protein?: number; carbs?: number; fat?: number } | null
  useCount: number
}

interface Props {
  favorites: FavoriteFood[]
  onSelect: (food: FavoriteFood) => void
  darkMode?: boolean
}

export function QuickAddBar({ favorites, onSelect, darkMode = true }: Props) {
  if (favorites.length === 0) return null

  return (
    <div>
      <div className="flex items-center gap-1 mb-2">
        <Star className={cn('w-3 h-3', darkMode ? 'text-yellow-500' : 'text-yellow-600')} />
        <span className={cn('text-xs font-medium', darkMode ? 'text-slate-400' : 'text-slate-600')}>
          Favorites
        </span>
      </div>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {favorites.slice(0, 8).map((fav) => (
          <button
            key={fav.id}
            onClick={() => onSelect(fav)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs whitespace-nowrap shrink-0',
              darkMode
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            )}
          >
            {fav.foodName}
          </button>
        ))}
      </div>
    </div>
  )
}

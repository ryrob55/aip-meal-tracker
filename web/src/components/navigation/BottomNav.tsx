'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Utensils, Database, TrendingUp, MoreHorizontal } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/aip-diet', label: 'Track', icon: Utensils },
  { href: '/foods', label: 'Foods', icon: Database },
  { href: '/insights', label: 'Insights', icon: TrendingUp },
  { href: '/more', label: 'More', icon: MoreHorizontal },
]

export function BottomNav() {
  const { darkMode } = useTheme()
  const pathname = usePathname()

  // Don't show on auth pages
  if (pathname === '/login' || pathname === '/onboarding') return null

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 border-t',
        darkMode
          ? 'bg-zinc-950/90 backdrop-blur-xl border-zinc-800/50'
          : 'bg-white/95 backdrop-blur-xl border-zinc-200'
      )}
    >
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 transition-colors duration-150',
                isActive
                  ? 'text-emerald-400'
                  : darkMode
                  ? 'text-zinc-600'
                  : 'text-zinc-400'
              )}
            >
              <div className="relative">
                {isActive && (
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
                )}
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

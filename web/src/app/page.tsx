'use client'

import Link from 'next/link'
import { Salad, ChefHat, UtensilsCrossed, Database, BarChart3, CalendarDays, ClipboardList } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

export default function Home() {
  const { darkMode } = useTheme()

  return (
    <main className={cn(
      "min-h-screen bg-gradient-to-br",
      darkMode ? "from-slate-800 to-slate-900" : "from-slate-100 to-slate-200"
    )}>
      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className={cn(
            "text-4xl font-bold mb-2",
            darkMode ? "text-slate-100" : "text-slate-800"
          )}>
            AIP Meal Tracker
          </h1>
          <p className={darkMode ? "text-slate-400" : "text-slate-600"}>
            Autoimmune Protocol diet tracking, recipes, and meal planning
          </p>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Link
            href="/aip-diet"
            className={cn(
              "rounded-xl p-6 shadow-sm hover:shadow-md transition-all group",
              darkMode
                ? "bg-slate-700/50 hover:bg-slate-700 border border-slate-600"
                : "bg-white hover:bg-slate-50 border border-slate-200"
            )}
          >
            <Salad className="w-10 h-10 text-green-400 mb-4 group-hover:scale-110 transition-transform" />
            <h2 className={cn("text-lg font-semibold mb-1", darkMode ? "text-slate-100" : "text-slate-800")}>AIP Diet Tracker</h2>
            <p className={cn("text-sm", darkMode ? "text-slate-400" : "text-slate-600")}>
              Track daily meals, macros, and adherence
            </p>
          </Link>

          <Link
            href="/recipes"
            className={cn(
              "rounded-xl p-6 shadow-sm hover:shadow-md transition-all group",
              darkMode
                ? "bg-slate-700/50 hover:bg-slate-700 border border-slate-600"
                : "bg-white hover:bg-slate-50 border border-slate-200"
            )}
          >
            <ChefHat className="w-10 h-10 text-amber-400 mb-4 group-hover:scale-110 transition-transform" />
            <h2 className={cn("text-lg font-semibold mb-1", darkMode ? "text-slate-100" : "text-slate-800")}>Recipes</h2>
            <p className={cn("text-sm", darkMode ? "text-slate-400" : "text-slate-600")}>
              Browse and manage AIP-compliant recipes
            </p>
          </Link>

          <Link
            href="/meals"
            className={cn(
              "rounded-xl p-6 shadow-sm hover:shadow-md transition-all group",
              darkMode
                ? "bg-slate-700/50 hover:bg-slate-700 border border-slate-600"
                : "bg-white hover:bg-slate-50 border border-slate-200"
            )}
          >
            <UtensilsCrossed className="w-10 h-10 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
            <h2 className={cn("text-lg font-semibold mb-1", darkMode ? "text-slate-100" : "text-slate-800")}>Weekly Meals</h2>
            <p className={cn("text-sm", darkMode ? "text-slate-400" : "text-slate-600")}>
              Plan weekly dinners with grocery lists
            </p>
          </Link>

          <Link
            href="/aip-diet/foods"
            className={cn(
              "rounded-xl p-6 shadow-sm hover:shadow-md transition-all group",
              darkMode
                ? "bg-slate-700/50 hover:bg-slate-700 border border-slate-600"
                : "bg-white hover:bg-slate-50 border border-slate-200"
            )}
          >
            <Database className="w-10 h-10 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
            <h2 className={cn("text-lg font-semibold mb-1", darkMode ? "text-slate-100" : "text-slate-800")}>AIP Foods</h2>
            <p className={cn("text-sm", darkMode ? "text-slate-400" : "text-slate-600")}>
              Browse foods by phase, category, and safety
            </p>
          </Link>

          <Link
            href="/aip-diet/report"
            className={cn(
              "rounded-xl p-6 shadow-sm hover:shadow-md transition-all group",
              darkMode
                ? "bg-slate-700/50 hover:bg-slate-700 border border-slate-600"
                : "bg-white hover:bg-slate-50 border border-slate-200"
            )}
          >
            <BarChart3 className="w-10 h-10 text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
            <h2 className={cn("text-lg font-semibold mb-1", darkMode ? "text-slate-100" : "text-slate-800")}>Progress Report</h2>
            <p className={cn("text-sm", darkMode ? "text-slate-400" : "text-slate-600")}>
              Macro trends, adherence rates, and insights
            </p>
          </Link>

          <Link
            href="/aip-diet/onboarding"
            className={cn(
              "rounded-xl p-6 shadow-sm hover:shadow-md transition-all group",
              darkMode
                ? "bg-slate-700/50 hover:bg-slate-700 border border-slate-600"
                : "bg-white hover:bg-slate-50 border border-slate-200"
            )}
          >
            <ClipboardList className="w-10 h-10 text-sky-400 mb-4 group-hover:scale-110 transition-transform" />
            <h2 className={cn("text-lg font-semibold mb-1", darkMode ? "text-slate-100" : "text-slate-800")}>Setup / Settings</h2>
            <p className={cn("text-sm", darkMode ? "text-slate-400" : "text-slate-600")}>
              Configure macro targets, fasting, and restrictions
            </p>
          </Link>
        </div>
      </div>
    </main>
  )
}

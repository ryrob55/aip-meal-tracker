'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Search, Clock, Users, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'
import { useTheme } from '@/contexts/ThemeContext'
import type { Recipe } from '@/lib/types'

export default function RecipesPage() {
  const [search, setSearch] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const queryClient = useQueryClient()
  const { darkMode } = useTheme()

  const { data: recipes = [], isLoading } = useQuery<Recipe[]>({
    queryKey: ['recipes', search],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      const res = await fetch(`/api/recipes?${params}`)
      const data = await res.json()
      return data.recipes || []
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/recipes/${id}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
    },
  })

  return (
    <main className={cn(
      "min-h-screen p-6",
      darkMode ? "bg-slate-900" : "bg-slate-50"
    )}>
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className={cn(
                "p-2 rounded-lg transition-colors",
                darkMode ? "hover:bg-slate-700" : "hover:bg-slate-200"
              )}
            >
              <ArrowLeft className={cn("w-5 h-5", darkMode ? "text-slate-400" : "text-slate-600")} />
            </Link>
            <h1 className={cn("text-2xl font-bold", darkMode ? "text-slate-100" : "text-slate-800")}>Recipes</h1>
          </div>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Recipe
          </Button>
        </header>

        {/* Search */}
        <div className="relative mb-6">
          <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5", darkMode ? "text-slate-500" : "text-slate-400")} />
          <input
            type="text"
            placeholder="Search recipes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              "w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500",
              darkMode
                ? "bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500"
                : "bg-white border-slate-300 text-slate-800"
            )}
          />
        </div>

        {/* Recipe list */}
        {isLoading ? (
          <div className={cn("text-center py-12", darkMode ? "text-slate-400" : "text-slate-500")}>Loading recipes...</div>
        ) : recipes.length === 0 ? (
          <div className={cn(
            "text-center py-12 rounded-xl border",
            darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
          )}>
            <p className={cn("mb-4", darkMode ? "text-slate-400" : "text-slate-500")}>No recipes yet</p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Recipe
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                darkMode={darkMode}
                onDelete={() => {
                  if (confirm('Delete this recipe?')) {
                    deleteMutation.mutate(recipe.id)
                  }
                }}
              />
            ))}
          </div>
        )}

        {/* Add Recipe Modal */}
        {showAddForm && (
          <AddRecipeModal onClose={() => setShowAddForm(false)} />
        )}
      </div>
    </main>
  )
}

function RecipeCard({
  recipe,
  darkMode,
  onDelete,
}: {
  recipe: Recipe
  darkMode: boolean
  onDelete: () => void
}) {
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0)
  const hasContent = recipe.instructions && recipe.instructions !== 'See image for recipe'

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className={cn(
        "block rounded-xl border p-4 hover:shadow-md transition-all group",
        darkMode
          ? "bg-slate-800 border-slate-700 hover:border-amber-600"
          : "bg-white border-slate-200 hover:border-amber-200"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className={cn(
            "font-semibold text-lg group-hover:text-amber-500 transition-colors",
            darkMode ? "text-slate-100" : "text-slate-800"
          )}>
            {recipe.name}
          </h3>
          <div className={cn("flex items-center gap-4 mt-2 text-sm", darkMode ? "text-slate-400" : "text-slate-500")}>
            {totalTime > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {totalTime} min
              </span>
            )}
            {recipe.servings && (
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {recipe.servings} servings
              </span>
            )}
            {!hasContent && (
              <span className="text-amber-600 text-xs font-medium">
                Needs recipe details
              </span>
            )}
          </div>
          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {recipe.tags.map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    "px-2 py-0.5 rounded-sm text-xs",
                    darkMode ? "bg-amber-900/30 text-amber-400" : "bg-amber-50 text-amber-700"
                  )}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onDelete()
          }}
          className={cn(
            "p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100",
            darkMode ? "hover:bg-red-900/30" : "hover:bg-red-50"
          )}
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </button>
      </div>
    </Link>
  )
}

function AddRecipeModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    name: '',
    instructions: '',
    prepTime: '',
    cookTime: '',
    servings: '',
    tags: '',
    ingredients: [{ item: '', quantity: '', unit: '' }],
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          instructions: data.instructions,
          prepTime: data.prepTime ? parseInt(data.prepTime) : undefined,
          cookTime: data.cookTime ? parseInt(data.cookTime) : undefined,
          servings: data.servings ? parseInt(data.servings) : undefined,
          tags: data.tags.split(',').map((t) => t.trim()).filter(Boolean),
          ingredients: data.ingredients.filter((i) => i.item.trim()),
        }),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      onClose()
    },
  })

  const addIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { item: '', quantity: '', unit: '' }],
    })
  }

  const updateIngredient = (index: number, field: string, value: string) => {
    const newIngredients = [...formData.ingredients]
    newIngredients[index] = { ...newIngredients[index], [field]: value }
    setFormData({ ...formData, ingredients: newIngredients })
  }

  const removeIngredient = (index: number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index),
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Add Recipe</h2>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            createMutation.mutate(formData)
          }}
          className="space-y-4"
        >
          <Input
            label="Recipe Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Ingredients
            </label>
            <div className="space-y-2">
              {formData.ingredients.map((ing, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    placeholder="Quantity"
                    value={ing.quantity}
                    onChange={(e) => updateIngredient(i, 'quantity', e.target.value)}
                    className="w-20 px-2 py-1.5 border border-slate-300 rounded-sm text-sm"
                  />
                  <input
                    placeholder="Unit"
                    value={ing.unit}
                    onChange={(e) => updateIngredient(i, 'unit', e.target.value)}
                    className="w-20 px-2 py-1.5 border border-slate-300 rounded-sm text-sm"
                  />
                  <input
                    placeholder="Ingredient"
                    value={ing.item}
                    onChange={(e) => updateIngredient(i, 'item', e.target.value)}
                    className="flex-1 px-2 py-1.5 border border-slate-300 rounded-sm text-sm"
                  />
                  {formData.ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(i)}
                      className="px-2 text-red-500 hover:bg-red-50 rounded-sm"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addIngredient}
              className="mt-2 text-sm text-blue-500 hover:text-blue-600"
            >
              + Add Ingredient
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Instructions
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) =>
                setFormData({ ...formData, instructions: e.target.value })
              }
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Prep Time (min)"
              type="number"
              value={formData.prepTime}
              onChange={(e) =>
                setFormData({ ...formData, prepTime: e.target.value })
              }
            />
            <Input
              label="Cook Time (min)"
              type="number"
              value={formData.cookTime}
              onChange={(e) =>
                setFormData({ ...formData, cookTime: e.target.value })
              }
            />
            <Input
              label="Servings"
              type="number"
              value={formData.servings}
              onChange={(e) =>
                setFormData({ ...formData, servings: e.target.value })
              }
            />
          </div>

          <Input
            label="Tags (comma-separated)"
            placeholder="quick, chicken, italian"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving...' : 'Save Recipe'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

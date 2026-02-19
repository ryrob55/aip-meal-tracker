'use client'

import { useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Clock, Users, Edit2, Save, X, Trash2, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useTheme } from '@/contexts/ThemeContext'
import type { Recipe, Ingredient } from '@/lib/types'

export default function RecipeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const returnTo = searchParams.get('returnTo')
  const { darkMode } = useTheme()

  const handleBack = () => {
    if (returnTo) {
      router.push(returnTo)
    } else {
      router.back()
    }
  }

  const { data: recipe, isLoading } = useQuery<Recipe>({
    queryKey: ['recipe', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/recipes/${params.id}`)
      if (!res.ok) throw new Error('Recipe not found')
      return res.json()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Recipe>) => {
      const res = await fetch(`/api/recipes/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe', params.id] })
      setIsEditing(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await fetch(`/api/recipes/${params.id}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      router.push('/recipes')
    },
  })

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/recipes/${params.id}/generate`, {
        method: 'POST',
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to generate recipe')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe', params.id] })
    },
  })

  if (isLoading) {
    return (
      <main className={cn("min-h-screen p-6", darkMode ? "bg-slate-900" : "bg-slate-50")}>
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse">
            <div className={cn("h-8 rounded w-1/3 mb-6", darkMode ? "bg-slate-700" : "bg-slate-200")}></div>
            <div className={cn("h-64 rounded mb-6", darkMode ? "bg-slate-700" : "bg-slate-200")}></div>
          </div>
        </div>
      </main>
    )
  }

  if (!recipe) {
    return (
      <main className={cn("min-h-screen p-6", darkMode ? "bg-slate-900" : "bg-slate-50")}>
        <div className="max-w-3xl mx-auto text-center py-12">
          <h1 className={cn("text-2xl font-bold mb-4", darkMode ? "text-slate-100" : "text-slate-800")}>Recipe not found</h1>
          <button onClick={handleBack} className="text-blue-500 hover:underline">
            Go back
          </button>
        </div>
      </main>
    )
  }

  if (isEditing) {
    return <RecipeEditView recipe={recipe} darkMode={darkMode} onSave={updateMutation.mutate} onCancel={() => setIsEditing(false)} />
  }

  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0)
  const hasIngredients = recipe.ingredients && recipe.ingredients.length > 0
  const hasInstructions = recipe.instructions && recipe.instructions !== 'See image for recipe'

  return (
    <main className={cn(
      "min-h-screen bg-gradient-to-b p-4 md:p-6",
      darkMode ? "from-slate-900 to-slate-800" : "from-amber-50 to-orange-50"
    )}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <button
            onClick={handleBack}
            className={cn(
              "flex items-center gap-2 transition-colors",
              darkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-800"
            )}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{returnTo ? 'Back to Display' : 'Back'}</span>
          </button>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setIsEditing(true)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <button
              onClick={() => {
                if (confirm('Delete this recipe?')) {
                  deleteMutation.mutate()
                }
              }}
              className={cn("p-2 text-red-500 rounded-lg transition-colors", darkMode ? "hover:bg-red-900/30" : "hover:bg-red-50")}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Recipe Card */}
        <article className={cn("rounded-2xl shadow-lg overflow-hidden", darkMode ? "bg-slate-800" : "bg-white")}>
          {/* Title Section */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-8 text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">{recipe.name}</h1>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 text-amber-100">
              {totalTime > 0 && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-5 h-5" />
                  {totalTime} min
                  {recipe.prepTime && recipe.cookTime && (
                    <span className="text-sm opacity-80">
                      ({recipe.prepTime} prep + {recipe.cookTime} cook)
                    </span>
                  )}
                </span>
              )}
              {recipe.servings && (
                <span className="flex items-center gap-1.5">
                  <Users className="w-5 h-5" />
                  {recipe.servings} servings
                </span>
              )}
            </div>

            {/* Tags */}
            {recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {recipe.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 md:p-8">
            {/* No content message */}
            {!hasIngredients && !hasInstructions && (
              <div className={cn("text-center py-8", darkMode ? "text-slate-400" : "text-slate-500")}>
                <p className="mb-4">This recipe needs ingredients and instructions added.</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button
                    onClick={() => generateMutation.mutate()}
                    disabled={generateMutation.isPending}
                  >
                    {generateMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    {generateMutation.isPending ? 'Generating...' : 'Generate with AI'}
                  </Button>
                  <Button variant="secondary" onClick={() => setIsEditing(true)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Add Manually
                  </Button>
                </div>
                {generateMutation.isError && (
                  <p className="mt-3 text-sm text-red-500">
                    {generateMutation.error?.message || 'Failed to generate recipe'}
                  </p>
                )}
              </div>
            )}

            {/* Ingredients Section */}
            {hasIngredients && (
              <section className="mb-8">
                <h2 className={cn("text-xl font-bold mb-4 flex items-center gap-2", darkMode ? "text-slate-100" : "text-slate-800")}>
                  <span className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold", darkMode ? "bg-amber-900/50 text-amber-400" : "bg-amber-100 text-amber-600")}>1</span>
                  Ingredients
                </h2>
                <ul className="grid gap-2">
                  {recipe.ingredients.map((ing, i) => (
                    <li
                      key={i}
                      className={cn("flex items-start gap-3 py-2 border-b last:border-0", darkMode ? "border-slate-700" : "border-slate-100")}
                    >
                      <span className="w-2 h-2 mt-2 rounded-full bg-amber-400 flex-shrink-0" />
                      <span className={darkMode ? "text-slate-300" : "text-slate-700"}>
                        {ing.quantity && (
                          <span className={cn("font-semibold", darkMode ? "text-slate-100" : "text-slate-900")}>{ing.quantity} </span>
                        )}
                        {ing.unit && (
                          <span className={darkMode ? "text-slate-400" : "text-slate-600"}>{ing.unit} </span>
                        )}
                        {ing.item}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Instructions Section */}
            {hasInstructions && (
              <section>
                <h2 className={cn("text-xl font-bold mb-4 flex items-center gap-2", darkMode ? "text-slate-100" : "text-slate-800")}>
                  <span className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold", darkMode ? "bg-orange-900/50 text-orange-400" : "bg-orange-100 text-orange-600")}>2</span>
                  Instructions
                </h2>
                <div className="prose prose-slate max-w-none">
                  {recipe.instructions.split('\n\n').map((paragraph, i) => (
                    <p key={i} className={cn("leading-relaxed mb-4 last:mb-0", darkMode ? "text-slate-300" : "text-slate-700")}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Footer */}
          {recipe.source && (
            <footer className={cn("px-6 py-4 border-t text-sm", darkMode ? "bg-slate-700/50 border-slate-700 text-slate-400" : "bg-slate-50 border-slate-100 text-slate-500")}>
              Source: {recipe.source}
            </footer>
          )}
        </article>
      </div>
    </main>
  )
}

function RecipeEditView({
  recipe,
  darkMode,
  onSave,
  onCancel,
}: {
  recipe: Recipe
  darkMode: boolean
  onSave: (data: Partial<Recipe>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: recipe.name,
    instructions: recipe.instructions === 'See image for recipe' ? '' : recipe.instructions,
    prepTime: recipe.prepTime?.toString() || '',
    cookTime: recipe.cookTime?.toString() || '',
    servings: recipe.servings?.toString() || '',
    tags: recipe.tags.join(', '),
    ingredients: recipe.ingredients.length > 0
      ? recipe.ingredients
      : [{ item: '', quantity: '', unit: '' }],
  })

  const addIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { item: '', quantity: '', unit: '' }],
    })
  }

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name: formData.name,
      instructions: formData.instructions,
      prepTime: formData.prepTime ? parseInt(formData.prepTime) : undefined,
      cookTime: formData.cookTime ? parseInt(formData.cookTime) : undefined,
      servings: formData.servings ? parseInt(formData.servings) : undefined,
      tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
      ingredients: formData.ingredients.filter((i) => i.item.trim()),
    })
  }

  return (
    <main className={cn("min-h-screen p-4 md:p-6", darkMode ? "bg-slate-900" : "bg-slate-50")}>
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className={cn("text-2xl font-bold", darkMode ? "text-slate-100" : "text-slate-800")}>Edit Recipe</h1>
          <button
            onClick={onCancel}
            className={cn("p-2 rounded-lg transition-colors", darkMode ? "hover:bg-slate-700" : "hover:bg-slate-200")}
          >
            <X className={cn("w-5 h-5", darkMode ? "text-slate-400" : "text-slate-600")} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className={cn("rounded-xl shadow-sm p-6 space-y-6", darkMode ? "bg-slate-800" : "bg-white")}>
          {/* Name */}
          <div>
            <label className={cn("block text-sm font-medium mb-1", darkMode ? "text-slate-300" : "text-slate-700")}>
              Recipe Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={cn(
                "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500",
                darkMode ? "bg-slate-700 border-slate-600 text-slate-100" : "bg-white border-slate-300"
              )}
              required
            />
          </div>

          {/* Time & Servings */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={cn("block text-sm font-medium mb-1", darkMode ? "text-slate-300" : "text-slate-700")}>
                Prep Time (min)
              </label>
              <input
                type="number"
                value={formData.prepTime}
                onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
                className={cn(
                  "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500",
                  darkMode ? "bg-slate-700 border-slate-600 text-slate-100" : "bg-white border-slate-300"
                )}
              />
            </div>
            <div>
              <label className={cn("block text-sm font-medium mb-1", darkMode ? "text-slate-300" : "text-slate-700")}>
                Cook Time (min)
              </label>
              <input
                type="number"
                value={formData.cookTime}
                onChange={(e) => setFormData({ ...formData, cookTime: e.target.value })}
                className={cn(
                  "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500",
                  darkMode ? "bg-slate-700 border-slate-600 text-slate-100" : "bg-white border-slate-300"
                )}
              />
            </div>
            <div>
              <label className={cn("block text-sm font-medium mb-1", darkMode ? "text-slate-300" : "text-slate-700")}>
                Servings
              </label>
              <input
                type="number"
                value={formData.servings}
                onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                className={cn(
                  "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500",
                  darkMode ? "bg-slate-700 border-slate-600 text-slate-100" : "bg-white border-slate-300"
                )}
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className={cn("block text-sm font-medium mb-1", darkMode ? "text-slate-300" : "text-slate-700")}>
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="chicken, quick, dinner"
              className={cn(
                "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500",
                darkMode ? "bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-500" : "bg-white border-slate-300"
              )}
            />
          </div>

          {/* Ingredients */}
          <div>
            <label className={cn("block text-sm font-medium mb-2", darkMode ? "text-slate-300" : "text-slate-700")}>
              Ingredients
            </label>
            <div className="space-y-2">
              {formData.ingredients.map((ing, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    placeholder="Qty"
                    value={ing.quantity || ''}
                    onChange={(e) => updateIngredient(i, 'quantity', e.target.value)}
                    className={cn(
                      "w-20 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500",
                      darkMode ? "bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-500" : "bg-white border-slate-300"
                    )}
                  />
                  <input
                    placeholder="Unit"
                    value={ing.unit || ''}
                    onChange={(e) => updateIngredient(i, 'unit', e.target.value)}
                    className={cn(
                      "w-24 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500",
                      darkMode ? "bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-500" : "bg-white border-slate-300"
                    )}
                  />
                  <input
                    placeholder="Ingredient name"
                    value={ing.item}
                    onChange={(e) => updateIngredient(i, 'item', e.target.value)}
                    className={cn(
                      "flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500",
                      darkMode ? "bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-500" : "bg-white border-slate-300"
                    )}
                  />
                  {formData.ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(i)}
                      className={cn("px-3 text-red-500 rounded-lg transition-colors", darkMode ? "hover:bg-red-900/30" : "hover:bg-red-50")}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addIngredient}
              className="mt-2 text-sm text-amber-600 hover:text-amber-700 font-medium"
            >
              + Add Ingredient
            </button>
          </div>

          {/* Instructions */}
          <div>
            <label className={cn("block text-sm font-medium mb-1", darkMode ? "text-slate-300" : "text-slate-700")}>
              Instructions
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              rows={8}
              placeholder="Enter cooking instructions..."
              className={cn(
                "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500",
                darkMode ? "bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-500" : "bg-white border-slate-300"
              )}
            />
            <p className={cn("mt-1 text-xs", darkMode ? "text-slate-400" : "text-slate-500")}>
              Separate steps with blank lines for better formatting
            </p>
          </div>

          {/* Actions */}
          <div className={cn("flex justify-end gap-3 pt-4 border-t", darkMode ? "border-slate-700" : "border-slate-200")}>
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}

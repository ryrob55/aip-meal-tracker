// LLM Client — works with any OpenAI-compatible API
// Configure via environment variables:
//   LLM_BASE_URL  - API endpoint (e.g., https://api.openai.com/v1)
//   LLM_API_KEY   - API key (required for most providers)
//   LLM_MODEL     - Model name (e.g., gpt-4o-mini, claude-3-haiku, llama3)
//
// Works with: OpenAI, Anthropic (compatible endpoint), Ollama, vLLM, TensorRT-LLM, etc.

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatCompletionResponse {
  id: string
  choices: Array<{
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
}

const LLM_BASE_URL = process.env.LLM_BASE_URL
const LLM_API_KEY = process.env.LLM_API_KEY
const LLM_MODEL = process.env.LLM_MODEL || 'gpt-4o-mini'

// Check if LLM is configured
export function isLLMConfigured(): boolean {
  return !!LLM_BASE_URL
}

export async function chatCompletion(
  messages: ChatMessage[],
  options?: {
    temperature?: number
    maxTokens?: number
  }
): Promise<string> {
  if (!LLM_BASE_URL) {
    throw new Error('LLM not configured. Set LLM_BASE_URL environment variable.')
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (LLM_API_KEY) {
    headers['Authorization'] = `Bearer ${LLM_API_KEY}`
  }

  const response = await fetch(`${LLM_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: LLM_MODEL,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1024,
    }),
  })

  if (!response.ok) {
    throw new Error(`LLM request failed: ${response.status}`)
  }

  const data: ChatCompletionResponse = await response.json()
  return data.choices[0]?.message?.content || ''
}

// Meal suggestion prompts
export async function suggestMeals(
  availableRecipes: string[],
  recentMeals: string[],
  constraints?: string[]
): Promise<string[]> {
  if (!isLLMConfigured()) return []

  const systemPrompt = `You are a helpful meal planning assistant. Your job is to suggest dinner recipes for a family.

Rules:
- Only suggest meals from the provided recipe list
- Avoid meals that were recently made
- Consider any constraints the user provides
- Suggest exactly 7 meals, one for each day of the week
- Return ONLY a JSON array of recipe names, nothing else

Example output: ["Spaghetti Bolognese", "Grilled Chicken", "Tacos", "Salmon", "Pizza", "Stir Fry", "Burgers"]`

  const constraintText = constraints?.length ? `Constraints: ${constraints.join(', ')}` : ''
  const userPrompt = `Available recipes: ${availableRecipes.join(', ')}

Recently made (avoid these): ${recentMeals.join(', ')}

${constraintText}

Suggest 7 dinner meals for this week. Return only a JSON array of recipe names.`

  try {
    const response = await chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.8 })

    // Parse the JSON array from the response
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return []
  } catch (err) {
    console.error('Failed to get meal suggestions:', err)
    return []
  }
}

// Generate recipe details based on name and existing recipe style
export async function generateRecipeDetails(
  recipeName: string,
  existingRecipes: Array<{ name: string; ingredients: unknown; tags: string[] }>
): Promise<{
  ingredients: Array<{ item: string; quantity?: string; unit?: string }>
  instructions: string
  prepTime: number
  cookTime: number
  servings: number
  tags: string[]
}> {
  if (!isLLMConfigured()) {
    return {
      ingredients: [],
      instructions: '',
      prepTime: 0,
      cookTime: 0,
      servings: 4,
      tags: [],
    }
  }

  // Sample a few existing recipes to understand the style
  const sampleRecipes = existingRecipes.slice(0, 5).map(r => ({
    name: r.name,
    ingredients: r.ingredients,
    tags: r.tags,
  }))

  const systemPrompt = `You are a healthy recipe expert. Generate a recipe based on the style of existing recipes.

Guidelines:
- Use whole, unprocessed ingredients when possible
- Avoid artificial ingredients and excessive sugar
- Keep it practical
- Use similar ingredient styles as the example recipes
- Return a valid JSON object with the exact structure shown below

JSON structure:
{
  "ingredients": [{"item": "ingredient name", "quantity": "amount", "unit": "measurement unit"}],
  "instructions": "Step-by-step cooking instructions as a single string with numbered steps",
  "prepTime": 15,
  "cookTime": 30,
  "servings": 4,
  "tags": ["tag1", "tag2"]
}

Return ONLY the JSON object, no additional text.`

  const userPrompt = `Create a healthy recipe for: "${recipeName}"

Here are some example recipes for style reference:
${JSON.stringify(sampleRecipes, null, 2)}

Generate a complete recipe matching their healthy cooking style. Return only valid JSON.`

  try {
    const response = await chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.7, maxTokens: 2048 })

    // Parse the JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        ingredients: parsed.ingredients || [],
        instructions: parsed.instructions || '',
        prepTime: parsed.prepTime || 15,
        cookTime: parsed.cookTime || 30,
        servings: parsed.servings || 4,
        tags: parsed.tags || [],
      }
    }
    throw new Error('No valid JSON found in response')
  } catch (err) {
    console.error('Failed to generate recipe details:', err)
    // Return empty/default values on failure
    return {
      ingredients: [],
      instructions: '',
      prepTime: 0,
      cookTime: 0,
      servings: 4,
      tags: [],
    }
  }
}

// Smart ingredient categorization
export async function categorizeIngredient(ingredient: string): Promise<string> {
  if (!isLLMConfigured()) return 'Other'

  const systemPrompt = `You are a grocery store expert. Categorize ingredients into one of these categories:
- Meat (includes poultry, fish, seafood)
- Produce (fresh fruits and vegetables)
- Dairy (milk, cheese, eggs, butter)
- Pantry (canned goods, dry goods, spices, oils)
- Frozen (frozen foods)
- Bakery (bread, baked goods)
- Other (anything else)

Return ONLY the category name, nothing else.`

  try {
    const response = await chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Categorize: ${ingredient}` },
    ], { temperature: 0.1, maxTokens: 20 })

    const category = response.trim()
    const validCategories = ['Meat', 'Produce', 'Dairy', 'Pantry', 'Frozen', 'Bakery', 'Other']
    return validCategories.includes(category) ? category : 'Other'
  } catch (err) {
    console.error('Failed to categorize ingredient:', err)
    return 'Other'
  }
}

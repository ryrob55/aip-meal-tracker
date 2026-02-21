import { NextRequest, NextResponse } from 'next/server'
import { getUserId, isAuthError } from '@/lib/auth-helpers'
import { chatCompletion, isLLMConfigured } from '@/lib/llm'

// POST /api/meals/parse - Parse natural language meal description
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    if (!isLLMConfigured()) {
      return NextResponse.json(
        { error: 'AI is not configured. Set up your AI key in Settings to use natural language meal logging.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { text } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'text is required' },
        { status: 400 }
      )
    }

    const systemPrompt = `You are an AIP (Autoimmune Protocol) diet meal parser. Parse the user's meal description into structured data.

For each food item, estimate macros per serving. Be realistic with portions.

AIP compliance rules:
- ALLOWED: meat, fish, vegetables, fruit, healthy fats (olive oil, avocado, coconut), bone broth, herbs (non-seed), sweet potatoes, plantains
- NOT ALLOWED: grains, dairy, eggs, nuts, seeds, nightshades (tomatoes, peppers, potatoes, eggplant), legumes, refined sugar, alcohol, coffee, chocolate, seed-based spices

Return ONLY a valid JSON object:
{
  "meals": [
    {
      "name": "Food description",
      "calories": 300,
      "protein": 25,
      "carbs": 10,
      "fat": 15,
      "fiber": 3,
      "aipCompliant": true,
      "aipWarning": null
    }
  ],
  "totalCalories": 300,
  "totalProtein": 25,
  "totalCarbs": 10,
  "totalFat": 15,
  "mealType": "LUNCH"
}

mealType should be one of: MORNING_COFFEE, SMOOTHIE, LUNCH, AFTERNOON_SNACK, DINNER, EVENING_SNACK
If non-compliant, set aipWarning to a brief explanation (e.g., "Contains nightshades (tomato)").`

    const response = await chatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      { temperature: 0.3, maxTokens: 1024 }
    )

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'Failed to parse meal description' },
        { status: 500 }
      )
    }

    const parsed = JSON.parse(jsonMatch[0])
    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Failed to parse meal:', error)
    return NextResponse.json(
      { error: 'Failed to parse meal description' },
      { status: 500 }
    )
  }
}

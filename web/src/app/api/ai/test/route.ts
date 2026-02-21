import { NextRequest, NextResponse } from 'next/server'
import { getUserId, isAuthError } from '@/lib/auth-helpers'

// POST /api/ai/test - Test AI connection with provided credentials
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (isAuthError(userId)) return userId

    const { provider, baseUrl, apiKey, model } = await request.json()

    if (!baseUrl) {
      return NextResponse.json({ error: 'Base URL is required' }, { status: 400 })
    }

    // For non-Ollama providers, API key is required
    if (provider !== 'OLLAMA' && !apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 })
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    // Make a minimal chat completion request to test the connection
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages: [
          { role: 'user', content: 'Say "hello" in one word.' },
        ],
        max_tokens: 10,
        temperature: 0,
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      return NextResponse.json(
        { error: `API returned ${response.status}: ${body.slice(0, 200)}` },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Connection failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useAIPQuestionnaire } from '@/contexts/AIPQuestionnaireContext'

interface Props {
  darkMode?: boolean
}

const PROVIDERS = [
  {
    id: 'GEMINI',
    name: 'Google Gemini',
    badge: 'Free tier available',
    badgeColor: 'text-green-400 bg-green-900/40',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.0-flash',
    steps: [
      'Go to aistudio.google.com',
      'Click "Get API Key" in the top left',
      'Click "Create API Key"',
      'Copy the key and paste it below',
    ],
  },
  {
    id: 'OPENAI',
    name: 'OpenAI',
    badge: 'Most popular',
    badgeColor: 'text-blue-400 bg-blue-900/40',
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    steps: [
      'Go to platform.openai.com/api-keys',
      'Click "Create new secret key"',
      'Copy the key and paste it below',
    ],
  },
  {
    id: 'OPENROUTER',
    name: 'OpenRouter',
    badge: 'Many models',
    badgeColor: 'text-purple-400 bg-purple-900/40',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'anthropic/claude-haiku-4-5-20251001',
    steps: [
      'Go to openrouter.ai/keys',
      'Create a new API key',
      'Copy the key and paste it below',
    ],
  },
  {
    id: 'OLLAMA',
    name: 'Ollama (Self-Hosted)',
    badge: 'Local & private',
    badgeColor: 'text-orange-400 bg-orange-900/40',
    defaultBaseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3.2',
    steps: [
      'Install Ollama from ollama.com',
      'Run: ollama pull llama3.2',
      'Ollama runs locally - no API key needed',
    ],
  },
]

export function AISetupStep({ darkMode = true }: Props) {
  const { data, updateData } = useAIPQuestionnaire()
  const [selectedProvider, setSelectedProvider] = useState(
    data.aiProvider || 'GEMINI'
  )
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testError, setTestError] = useState('')

  const provider = PROVIDERS.find((p) => p.id === selectedProvider) || PROVIDERS[0]

  const handleSelectProvider = (providerId: string) => {
    setSelectedProvider(providerId)
    const p = PROVIDERS.find((pr) => pr.id === providerId)!
    updateData({
      aiProvider: providerId,
      llmBaseUrl: p.defaultBaseUrl,
      llmModel: p.defaultModel,
      llmApiKey: providerId === 'OLLAMA' ? '' : data.llmApiKey,
    })
    setTestStatus('idle')
  }

  const handleTestConnection = async () => {
    setTestStatus('testing')
    setTestError('')

    try {
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          baseUrl: data.llmBaseUrl || provider.defaultBaseUrl,
          apiKey: data.llmApiKey,
          model: data.llmModel || provider.defaultModel,
        }),
      })

      if (res.ok) {
        setTestStatus('success')
      } else {
        const body = await res.json().catch(() => ({}))
        setTestError(body.error || 'Connection failed. Check your API key and try again.')
        setTestStatus('error')
      }
    } catch {
      setTestError('Network error. Check your connection and try again.')
      setTestStatus('error')
    }
  }

  return (
    <div>
      <h2
        className={cn(
          'text-xl font-bold mb-2',
          darkMode ? 'text-white' : 'text-slate-900'
        )}
      >
        AI Assistant (Optional)
      </h2>
      <p
        className={cn(
          'text-sm mb-4',
          darkMode ? 'text-slate-400' : 'text-slate-600'
        )}
      >
        AI helps with natural language meal logging, recipe suggestions, and smart
        insights. You bring your own API key &mdash; we never store or share it on our servers.
      </p>

      {/* What AI enables */}
      <div
        className={cn(
          'p-4 rounded-lg mb-6',
          darkMode ? 'bg-slate-800' : 'bg-slate-100'
        )}
      >
        <p
          className={cn(
            'text-xs font-medium mb-2',
            darkMode ? 'text-slate-300' : 'text-slate-700'
          )}
        >
          With AI enabled, you can:
        </p>
        <ul className="space-y-1">
          {[
            'Log meals by typing "chicken with sweet potato and spinach"',
            'Get AIP-compliant recipe suggestions',
            'Receive weekly insights about your food patterns',
          ].map((item) => (
            <li
              key={item}
              className={cn(
                'text-xs flex items-start gap-2',
                darkMode ? 'text-slate-400' : 'text-slate-600'
              )}
            >
              <span className="text-green-500 mt-0.5">&#10003;</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Provider tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            onClick={() => handleSelectProvider(p.id)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
              selectedProvider === p.id
                ? 'bg-green-500 text-white'
                : darkMode
                ? 'bg-slate-800 text-slate-400 hover:text-white'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            )}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Provider setup */}
      <div
        className={cn(
          'p-4 rounded-lg',
          darkMode ? 'bg-slate-800' : 'bg-slate-100'
        )}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium">{provider.name}</span>
          <span className={cn('text-xs px-2 py-0.5 rounded-full', provider.badgeColor)}>
            {provider.badge}
          </span>
        </div>

        {/* Setup steps */}
        <ol className="space-y-1.5 mb-4">
          {provider.steps.map((step, i) => (
            <li
              key={i}
              className={cn(
                'text-xs flex items-start gap-2',
                darkMode ? 'text-slate-400' : 'text-slate-600'
              )}
            >
              <span
                className={cn(
                  'w-4 h-4 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5',
                  darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'
                )}
              >
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>

        {/* API Key input */}
        {selectedProvider !== 'OLLAMA' && (
          <div className="mb-3">
            <label
              className={cn(
                'block text-xs font-medium mb-1',
                darkMode ? 'text-slate-300' : 'text-slate-700'
              )}
            >
              API Key
            </label>
            <input
              type="password"
              value={data.llmApiKey}
              onChange={(e) => {
                updateData({ llmApiKey: e.target.value })
                setTestStatus('idle')
              }}
              placeholder="Paste your API key here..."
              className={cn(
                'w-full px-3 py-2 rounded-lg text-sm font-mono',
                darkMode
                  ? 'bg-slate-900 text-white placeholder-slate-600 border border-slate-700 focus:border-green-500'
                  : 'bg-white text-slate-900 placeholder-slate-400 border border-slate-300 focus:border-green-500'
              )}
            />
          </div>
        )}

        {/* Model override (collapsed) */}
        <details className="mb-3">
          <summary
            className={cn(
              'text-xs cursor-pointer',
              darkMode ? 'text-slate-500' : 'text-slate-500'
            )}
          >
            Advanced: Change model or base URL
          </summary>
          <div className="mt-2 space-y-2">
            <div>
              <label className={cn('block text-xs mb-1', darkMode ? 'text-slate-400' : 'text-slate-600')}>
                Base URL
              </label>
              <input
                type="text"
                value={data.llmBaseUrl || provider.defaultBaseUrl}
                onChange={(e) => updateData({ llmBaseUrl: e.target.value })}
                className={cn(
                  'w-full px-3 py-1.5 rounded text-xs font-mono',
                  darkMode
                    ? 'bg-slate-900 text-white border border-slate-700'
                    : 'bg-white text-slate-900 border border-slate-300'
                )}
              />
            </div>
            <div>
              <label className={cn('block text-xs mb-1', darkMode ? 'text-slate-400' : 'text-slate-600')}>
                Model
              </label>
              <input
                type="text"
                value={data.llmModel || provider.defaultModel}
                onChange={(e) => updateData({ llmModel: e.target.value })}
                className={cn(
                  'w-full px-3 py-1.5 rounded text-xs font-mono',
                  darkMode
                    ? 'bg-slate-900 text-white border border-slate-700'
                    : 'bg-white text-slate-900 border border-slate-300'
                )}
              />
            </div>
          </div>
        </details>

        {/* Test connection button */}
        <button
          onClick={handleTestConnection}
          disabled={testStatus === 'testing' || (!data.llmApiKey && selectedProvider !== 'OLLAMA')}
          className={cn(
            'w-full py-2 rounded-lg text-sm font-medium transition-colors',
            testStatus === 'success'
              ? 'bg-green-500 text-white'
              : testStatus === 'error'
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : testStatus === 'testing'
              ? 'bg-slate-600 text-slate-400'
              : (!data.llmApiKey && selectedProvider !== 'OLLAMA')
              ? darkMode
                ? 'bg-slate-700 text-slate-500'
                : 'bg-slate-200 text-slate-400'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          )}
        >
          {testStatus === 'testing' && 'Testing connection...'}
          {testStatus === 'success' && 'Connected successfully!'}
          {testStatus === 'error' && 'Try Again'}
          {testStatus === 'idle' && 'Test Connection'}
        </button>

        {testStatus === 'error' && testError && (
          <p className="text-xs text-red-400 mt-2">{testError}</p>
        )}
      </div>

      {/* Skip option */}
      <p
        className={cn(
          'text-xs text-center mt-4',
          darkMode ? 'text-slate-500' : 'text-slate-500'
        )}
      >
        You can skip this step &mdash; the app works without AI, you&apos;ll just use manual entry.
        You can always set this up later in Settings.
      </p>
    </div>
  )
}

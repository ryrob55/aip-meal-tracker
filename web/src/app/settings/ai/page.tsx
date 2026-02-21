'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronDown, Sparkles } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

const PROVIDERS = [
  {
    id: 'GEMINI',
    name: 'Google Gemini',
    badge: 'Free tier',
    badgeColor: 'text-green-400 bg-green-500/15',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.0-flash',
    steps: [
      { text: 'Go to ', link: 'https://aistudio.google.com', linkText: 'aistudio.google.com' },
      { text: 'Click "Get API Key" in the top left' },
      { text: 'Click "Create API Key"' },
      { text: 'Copy the key and paste it below' },
    ],
  },
  {
    id: 'OPENAI',
    name: 'OpenAI',
    badge: 'Most popular',
    badgeColor: 'text-blue-400 bg-blue-500/15',
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    steps: [
      { text: 'Go to ', link: 'https://platform.openai.com/api-keys', linkText: 'platform.openai.com/api-keys' },
      { text: 'Click "Create new secret key"' },
      { text: 'Copy the key and paste it below' },
    ],
  },
  {
    id: 'OPENROUTER',
    name: 'OpenRouter',
    badge: 'Many models',
    badgeColor: 'text-purple-400 bg-purple-500/15',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'anthropic/claude-haiku-4-5-20251001',
    steps: [
      { text: 'Go to ', link: 'https://openrouter.ai/keys', linkText: 'openrouter.ai/keys' },
      { text: 'Create a new API key' },
      { text: 'Copy the key and paste it below' },
    ],
  },
  {
    id: 'OLLAMA',
    name: 'Ollama',
    badge: 'Local & private',
    badgeColor: 'text-orange-400 bg-orange-500/15',
    defaultBaseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3.2',
    steps: [
      { text: 'Install Ollama from ', link: 'https://ollama.com', linkText: 'ollama.com' },
      { text: 'Run: ollama pull llama3.2' },
      { text: 'Ollama runs locally — no API key needed' },
    ],
  },
]

export default function AISetupPage() {
  const { darkMode } = useTheme()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [selectedProvider, setSelectedProvider] = useState('GEMINI')
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [model, setModel] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [hasExistingKey, setHasExistingKey] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testError, setTestError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const provider = PROVIDERS.find((p) => p.id === selectedProvider) || PROVIDERS[0]

  // Load existing settings
  useEffect(() => {
    fetch('/api/user/settings')
      .then((res) => res.json())
      .then((settings) => {
        if (settings?.aiProvider && settings.aiProvider !== 'NONE') {
          setSelectedProvider(settings.aiProvider)
          setHasExistingKey(!!settings.llmApiKey)
          if (settings.llmBaseUrl) setBaseUrl(settings.llmBaseUrl)
          if (settings.llmModel) setModel(settings.llmModel)
        }
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  const handleSelectProvider = (providerId: string) => {
    setSelectedProvider(providerId)
    const p = PROVIDERS.find((pr) => pr.id === providerId)!
    setBaseUrl(p.defaultBaseUrl)
    setModel(p.defaultModel)
    if (providerId === 'OLLAMA') setApiKey('')
    setTestStatus('idle')
    setHasExistingKey(false)
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
          baseUrl: baseUrl || provider.defaultBaseUrl,
          apiKey: apiKey,
          model: model || provider.defaultModel,
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

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aiProvider: selectedProvider,
          llmBaseUrl: baseUrl || provider.defaultBaseUrl,
          llmApiKey: apiKey || undefined,
          llmModel: model || provider.defaultModel,
        }),
      })

      if (res.ok) {
        await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        router.push('/')
      }
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  const canTest = selectedProvider === 'OLLAMA' || apiKey.length > 0
  const canSave = testStatus === 'success'

  if (!loaded) {
    return (
      <div
        className={cn(
          'min-h-screen flex items-center justify-center',
          darkMode ? 'bg-zinc-950' : 'bg-zinc-50'
        )}
      >
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'min-h-screen pb-12',
        darkMode ? 'bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-900'
      )}
    >
      {/* Header */}
      <div className={cn(
        'sticky top-0 z-10 px-4 pt-4 pb-3',
        darkMode ? 'bg-zinc-950' : 'bg-zinc-50'
      )}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center transition-colors',
              darkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-200'
            )}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">AI Assistant</h1>
        </div>
      </div>

      <div className="px-4 max-w-lg mx-auto">
        {/* Benefits card */}
        <div
          className={cn(
            'p-4 rounded-2xl mb-6',
            darkMode ? 'bg-zinc-900 card-glow' : 'bg-white card-elevated-light'
          )}
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span className={cn('text-xs font-medium', darkMode ? 'text-zinc-300' : 'text-zinc-700')}>
              With AI enabled, you can:
            </span>
          </div>
          <ul className="space-y-2">
            {[
              'Log meals by typing "chicken with sweet potato and spinach"',
              'Get AIP-compliant recipe suggestions',
              'Receive weekly insights about your food patterns',
            ].map((item) => (
              <li
                key={item}
                className={cn(
                  'text-sm flex items-start gap-2',
                  darkMode ? 'text-zinc-400' : 'text-zinc-600'
                )}
              >
                <span className="text-emerald-500 mt-0.5 flex-shrink-0">&#10003;</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Provider selection */}
        <div className="mb-6">
          <h3
            className={cn(
              'text-xs font-medium uppercase tracking-wider mb-3',
              darkMode ? 'text-zinc-500' : 'text-zinc-400'
            )}
          >
            Choose a provider
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectProvider(p.id)}
                className={cn(
                  'p-3 rounded-xl text-left transition-all active:scale-[0.97]',
                  selectedProvider === p.id
                    ? 'ring-2 ring-emerald-500 bg-emerald-500/10'
                    : darkMode
                      ? 'ring-1 ring-zinc-800 bg-zinc-900 card-glow'
                      : 'ring-1 ring-zinc-200 bg-white card-elevated-light'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={cn(
                      'w-3 h-3 rounded-full border-2 flex items-center justify-center',
                      selectedProvider === p.id
                        ? 'border-emerald-500'
                        : darkMode ? 'border-zinc-600' : 'border-zinc-300'
                    )}
                  >
                    {selectedProvider === p.id && (
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                  </div>
                  <span className="text-sm font-medium">{p.name}</span>
                </div>
                <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', p.badgeColor)}>
                  {p.badge}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Setup instructions */}
        <div
          className={cn(
            'p-4 rounded-2xl mb-4',
            darkMode ? 'bg-zinc-900 card-glow' : 'bg-white card-elevated-light'
          )}
        >
          <h3
            className={cn(
              'text-xs font-medium uppercase tracking-wider mb-3',
              darkMode ? 'text-zinc-500' : 'text-zinc-400'
            )}
          >
            Setup Steps
          </h3>
          <ol className="space-y-2">
            {provider.steps.map((step, i) => (
              <li
                key={i}
                className={cn(
                  'text-sm flex items-start gap-2.5',
                  darkMode ? 'text-zinc-400' : 'text-zinc-600'
                )}
              >
                <span
                  className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5 font-medium',
                    darkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-700'
                  )}
                >
                  {i + 1}
                </span>
                <span>
                  {step.text}
                  {step.link && (
                    <a
                      href={step.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-500 underline underline-offset-2"
                    >
                      {step.linkText}
                    </a>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* API Key input */}
        {selectedProvider !== 'OLLAMA' && (
          <div className="mb-4">
            <label
              className={cn(
                'block text-xs font-medium mb-1.5',
                darkMode ? 'text-zinc-300' : 'text-zinc-700'
              )}
            >
              Paste your API key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value)
                setTestStatus('idle')
              }}
              placeholder={hasExistingKey ? 'Key saved — paste new key to change' : 'Paste your API key here...'}
              className={cn(
                'w-full px-4 py-3 rounded-xl text-sm font-mono transition-colors',
                darkMode
                  ? 'bg-zinc-900 text-white placeholder-zinc-600 ring-1 ring-zinc-800 focus:ring-emerald-500'
                  : 'bg-white text-zinc-900 placeholder-zinc-400 ring-1 ring-zinc-200 focus:ring-emerald-500',
                'outline-none'
              )}
            />
          </div>
        )}

        {/* Advanced options */}
        <div className="mb-6">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={cn(
              'flex items-center gap-1.5 text-xs',
              darkMode ? 'text-zinc-500' : 'text-zinc-400'
            )}
          >
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showAdvanced && 'rotate-180')} />
            Advanced: Change model or base URL
          </button>
          {showAdvanced && (
            <div className="mt-3 space-y-3">
              <div>
                <label className={cn('block text-xs mb-1', darkMode ? 'text-zinc-400' : 'text-zinc-600')}>
                  Base URL
                </label>
                <input
                  type="text"
                  value={baseUrl || provider.defaultBaseUrl}
                  onChange={(e) => {
                    setBaseUrl(e.target.value)
                    setTestStatus('idle')
                  }}
                  className={cn(
                    'w-full px-3 py-2 rounded-xl text-xs font-mono outline-none transition-colors',
                    darkMode
                      ? 'bg-zinc-900 text-white ring-1 ring-zinc-800 focus:ring-emerald-500'
                      : 'bg-white text-zinc-900 ring-1 ring-zinc-200 focus:ring-emerald-500'
                  )}
                />
              </div>
              <div>
                <label className={cn('block text-xs mb-1', darkMode ? 'text-zinc-400' : 'text-zinc-600')}>
                  Model
                </label>
                <input
                  type="text"
                  value={model || provider.defaultModel}
                  onChange={(e) => {
                    setModel(e.target.value)
                    setTestStatus('idle')
                  }}
                  className={cn(
                    'w-full px-3 py-2 rounded-xl text-xs font-mono outline-none transition-colors',
                    darkMode
                      ? 'bg-zinc-900 text-white ring-1 ring-zinc-800 focus:ring-emerald-500'
                      : 'bg-white text-zinc-900 ring-1 ring-zinc-200 focus:ring-emerald-500'
                  )}
                />
              </div>
            </div>
          )}
        </div>

        {/* Test Connection */}
        <button
          onClick={handleTestConnection}
          disabled={testStatus === 'testing' || !canTest}
          className={cn(
            'w-full py-3 rounded-xl text-sm font-medium transition-all mb-3',
            testStatus === 'success'
              ? 'bg-emerald-500 text-white'
              : testStatus === 'error'
                ? darkMode
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'bg-red-50 text-red-500 hover:bg-red-100'
                : testStatus === 'testing'
                  ? darkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-200 text-zinc-400'
                  : !canTest
                    ? darkMode ? 'bg-zinc-800 text-zinc-600' : 'bg-zinc-100 text-zinc-400'
                    : darkMode
                      ? 'bg-zinc-800 text-white hover:bg-zinc-700 ring-1 ring-zinc-700'
                      : 'bg-white text-zinc-900 hover:bg-zinc-50 ring-1 ring-zinc-200'
          )}
        >
          {testStatus === 'testing' && 'Testing connection...'}
          {testStatus === 'success' && 'Connected successfully!'}
          {testStatus === 'error' && 'Try Again'}
          {testStatus === 'idle' && 'Test Connection'}
        </button>

        {testStatus === 'error' && testError && (
          <p className="text-xs text-red-400 mb-3 px-1">{testError}</p>
        )}

        {/* Save & Continue */}
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className={cn(
            'w-full py-3 rounded-xl text-sm font-semibold transition-all',
            canSave
              ? 'bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[0.98]'
              : darkMode
                ? 'bg-zinc-800 text-zinc-600'
                : 'bg-zinc-100 text-zinc-400'
          )}
        >
          {saving ? 'Saving...' : 'Save & Continue'}
        </button>

        {/* Skip */}
        <div className="text-center mt-4">
          <button
            onClick={() => router.push('/')}
            className={cn(
              'text-sm',
              darkMode ? 'text-zinc-500 hover:text-zinc-400' : 'text-zinc-400 hover:text-zinc-500'
            )}
          >
            I&apos;ll set this up later
          </button>
        </div>
      </div>
    </div>
  )
}

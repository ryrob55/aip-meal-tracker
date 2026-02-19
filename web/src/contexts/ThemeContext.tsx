'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface ThemeContextType {
  darkMode: boolean
  setDarkMode: (value: boolean) => void
  toggleDarkMode: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkModeState] = useState(true) // Default to dark
  const [mounted, setMounted] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('fcc-dark-mode')
    if (stored !== null) {
      setDarkModeState(stored === 'true')
    }
    setMounted(true)
  }, [])

  // Save to localStorage when changed
  const setDarkMode = (value: boolean) => {
    setDarkModeState(value)
    localStorage.setItem('fcc-dark-mode', String(value))
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  // Prevent flash of wrong theme
  if (!mounted) {
    return null
  }

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

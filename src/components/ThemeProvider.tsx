'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const THEME_KEY = 'crage-theme'

type Theme = 'dark' | 'light'

const ThemeContext = createContext<{
  light: boolean
  setLight: (value: boolean | ((prev: boolean) => boolean)) => void
} | null>(null)

export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: React.ReactNode
  initialTheme: Theme
}) {
  const [light, setLightState] = useState(initialTheme === 'light')

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored) {
      const isLight = stored === 'light'
      setLightState(isLight)
      document.cookie = `${THEME_KEY}=${stored}; path=/; max-age=31536000`
    }
  }, [])

  const setLight = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setLightState(prev => {
      const next = typeof value === 'function' ? value(prev) : value
      const theme = next ? 'light' : 'dark'
      localStorage.setItem(THEME_KEY, theme)
      document.cookie = `${THEME_KEY}=${theme}; path=/; max-age=31536000`
      return next
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ light, setLight }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

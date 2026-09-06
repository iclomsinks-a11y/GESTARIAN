import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { ThemeSettings, AppearanceSettings } from './types'
import { supabase } from './supabase'

export const MODERN_THEME_PRESETS: Record<string, Partial<ThemeSettings>> = {
  classic: {
    theme_preset: 'classic',
    primary_color: '#090d16',
    secondary_color: '#1e293b',
    button_color: '#06b6d4',
    card_color: '#0f172a',
    dashboard_color: '#020617',
    table_color: '#0f172a',
    header_color: '#020617',
    icon_color: '#38bdf8',
  },
  cyberpunk: {
    theme_preset: 'cyberpunk' as any,
    primary_color: '#050508',
    secondary_color: '#181825',
    button_color: '#ec4899',
    card_color: '#11111b',
    dashboard_color: '#000000',
    table_color: '#11111b',
    header_color: '#000000',
    icon_color: '#f43f5e',
  },
  nordic: {
    theme_preset: 'nordic' as any,
    primary_color: '#2e3440',
    secondary_color: '#3b4252',
    button_color: '#88c0d0',
    card_color: '#242933',
    dashboard_color: '#1e222a',
    table_color: '#242933',
    header_color: '#1e222a',
    icon_color: '#81a1c1',
  },
  emerald_oled: {
    theme_preset: 'emerald_oled' as any,
    primary_color: '#022c22',
    secondary_color: '#064e3b',
    button_color: '#10b981',
    card_color: '#062019',
    dashboard_color: '#01140f',
    table_color: '#062019',
    header_color: '#01140f',
    icon_color: '#34d399',
  },
  amber_gold: {
    theme_preset: 'amber_gold' as any,
    primary_color: '#1c1917',
    secondary_color: '#292524',
    button_color: '#f59e0b',
    card_color: '#141210',
    dashboard_color: '#0c0a09',
    table_color: '#141210',
    header_color: '#0c0a09',
    icon_color: '#fbbf24',
  },
  slate_contrast: {
    theme_preset: 'slate_contrast' as any,
    primary_color: '#0f172a',
    secondary_color: '#334155',
    button_color: '#6366f1',
    card_color: '#1e293b',
    dashboard_color: '#020617',
    table_color: '#1e293b',
    header_color: '#020617',
    icon_color: '#818cf8',
  }
}

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  id: 1,
  theme_preset: 'classic',
  primary_color: '#090d16',
  secondary_color: '#1e293b',
  button_color: '#06b6d4',
  icon_color: '#38bdf8',
  warning_color: '#f59e0b',
  success_color: '#10b981',
  error_color: '#ef4444',
  is_dark_mode: true,
  card_color: '#0f172a',
  dashboard_color: '#020617',
  table_color: '#0f172a',
  header_color: '#020617',
  typography: 'Inter',
  font_size: '14px',
  border_radius: '0.5rem',
  shadows: 'md',
  spacing: 'normal',
  visual_density: 'normal',
  logo_url: null,
  logo_inicio_url: null,
  dashboard_image_url: null,
  background_image_url: null,
  favicon_url: null,
  commercial_name: null,
  splash_screen_url: null,
  pwa_icon_url: null,
  notification_color: '#06b6d4',
}

interface ThemeContextValue {
  themeSettings: ThemeSettings
  setThemeSettings: (s: ThemeSettings | ((prev: ThemeSettings) => ThemeSettings)) => void
  saveThemeToDB: (s?: ThemeSettings) => Promise<void>
  playSound: (type?: 'click' | 'success' | 'error') => void
  appearance: AppearanceSettings
  setAppearance: (a: AppearanceSettings) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function applyCssVars(t?: ThemeSettings) {
  const safeT = t || DEFAULT_THEME_SETTINGS
  const root = document.documentElement

  root.style.setProperty('--primary', safeT.primary_color)
  root.style.setProperty('--secondary', safeT.secondary_color)
  root.style.setProperty('--btn-color', safeT.button_color)
  root.style.setProperty('--icon-color', safeT.icon_color)
  root.style.setProperty('--warning', safeT.warning_color)
  root.style.setProperty('--success', safeT.success_color)
  root.style.setProperty('--error', safeT.error_color)

  root.style.setProperty('--card-bg', safeT.card_color)
  root.style.setProperty('--dashboard-bg', safeT.dashboard_color)
  root.style.setProperty('--table-bg', safeT.table_color)
  root.style.setProperty('--header-bg', safeT.header_color)

  root.style.setProperty('--radius', safeT.border_radius)
  root.style.setProperty('--font-family', safeT.typography)

  const defaultTextColors = {
    text_title: '#ffffff',
    text_primary: '#ffffff',
    text_input: '#ffffff',
    text_secondary: '#808080',
    text_card: '#f8fafc',
  }

  let textColors = defaultTextColors
  const storedTextColors = localStorage.getItem('gestarian_text_colors')
  if (storedTextColors) {
    try {
      const parsed = JSON.parse(storedTextColors)
      textColors = { ...defaultTextColors, ...parsed }
    } catch {
      textColors = defaultTextColors
    }
  }

  root.style.setProperty('--text-title', textColors.text_title)
  root.style.setProperty('--text-primary', textColors.text_primary)
  root.style.setProperty('--text-input', textColors.text_input)
  root.style.setProperty('--text-secondary', textColors.text_secondary)
  root.style.setProperty('--text-card', textColors.text_card)

  const shadowsMap = {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  }

  root.style.setProperty(
    '--shadow-custom',
    shadowsMap[safeT.shadows as keyof typeof shadowsMap] || shadowsMap.md,
  )

  root.style.setProperty('--color-fondo', safeT.dashboard_color)
  root.style.setProperty(
    '--color-texto',
    textColors.text_primary || (safeT.is_dark_mode ? '#f8fafc' : '#0f172a'),
  )
  root.style.setProperty('--color-glow', safeT.button_color)
  root.style.setProperty('--color-linea', safeT.secondary_color)
  root.style.setProperty('--color-relleno', safeT.card_color)
  root.style.setProperty('--color-relleno-btn', safeT.button_color)
  root.style.setProperty('--color-relleno-paneles', safeT.card_color)

  root.style.fontFamily = safeT.typography
  root.style.fontSize = safeT.font_size

  root.classList.remove('gestarian-day-mode', 'gestarian-night-mode', 'dark', 'light')
  if (safeT.is_dark_mode) {
    root.classList.add('gestarian-night-mode', 'dark')
  } else {
    root.classList.add('gestarian-day-mode', 'light')
  }

  if (safeT.favicon_url) {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = safeT.favicon_url
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeSettings, setThemeSettingsState] = useState<ThemeSettings>(DEFAULT_THEME_SETTINGS)

  const [appearance, setAppearance] = useState<AppearanceSettings>({
    color_fondo: '#1c1c1e',
    color_texto: '#f5f5f7',
    color_glow_botones: '#40e0d0',
    color_linea_botones: '#8e8e93',
    color_relleno_campo: '#2c2c2e',
    color_relleno_botones: '#3a3a3c',
    color_relleno_paneles: '#2c2c2e',
    modo_diurno: false,
    animaciones_activadas: true,
    sonido_activado: true,
  })

  useEffect(() => {
    const stored = localStorage.getItem('gestarian-theme')
    if (stored && stored !== 'undefined' && stored !== 'null') {
      try {
        const parsed: ThemeSettings = { ...DEFAULT_THEME_SETTINGS, ...JSON.parse(stored) }
        setThemeSettingsState(parsed)
        applyCssVars(parsed)
      } catch (error) {
        setThemeSettingsState(DEFAULT_THEME_SETTINGS)
        applyCssVars(DEFAULT_THEME_SETTINGS)
      }
    } else {
      setThemeSettingsState(DEFAULT_THEME_SETTINGS)
      applyCssVars(DEFAULT_THEME_SETTINGS)
    }

    const loadFromDB = async () => {
      try {
        const { data, error } = await supabase
          .from('theme_settings')
          .select('*')
          .eq('id', 1)
          .maybeSingle()

        if (data && !error) {
          const parsed: ThemeSettings = { ...DEFAULT_THEME_SETTINGS, ...data }
          setThemeSettingsState(parsed)
          applyCssVars(parsed)
          try {
            localStorage.setItem('gestarian-theme', JSON.stringify(parsed))
          } catch (e) {}
        }
      } catch (error) {
        console.warn('Error loading theme from database', error)
      }
    }

    void loadFromDB()
  }, [])

  function setThemeSettings(t: ThemeSettings | ((prev: ThemeSettings) => ThemeSettings)) {
    setThemeSettingsState(prev => {
      const next = typeof t === 'function' ? t(prev) : t
      const safeT = next && typeof next === 'object' && Object.keys(next).length > 0 ? next : DEFAULT_THEME_SETTINGS
      applyCssVars(safeT)
      try {
        localStorage.setItem('gestarian-theme', JSON.stringify(safeT))
      } catch (e) {}
      return safeT
    })
  }

  async function saveThemeToDB(t?: ThemeSettings) {
    const safeT = t && typeof t === 'object' && Object.keys(t).length > 0 ? t : (themeSettings || DEFAULT_THEME_SETTINGS)
    setThemeSettings(safeT)

    try {
      const { error } = await supabase.from('theme_settings').upsert(safeT)
      if (error) {
        console.warn('Error saving theme to database', error)
      }
    } catch (error) {
      console.warn('Unexpected error saving theme', error)
    }
  }

  function playSound(type: 'click' | 'success' | 'error' = 'click') {
    if (!appearance.sonido_activado) return

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

      if (!AudioContextClass) return
      const ctx = new AudioContextClass()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      const freqs = { click: 600, success: 880, error: 300 }
      osc.frequency.value = freqs[type]
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
      osc.start()
      osc.stop(ctx.currentTime + 0.15)
    } catch {}
  }

  return (
    <ThemeContext.Provider
      value={{
        themeSettings,
        setThemeSettings,
        saveThemeToDB,
        playSound,
        appearance,
        setAppearance,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return ctx
}

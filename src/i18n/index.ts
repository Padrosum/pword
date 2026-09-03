import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { en } from './en'
import { tr } from './tr'
import type { Strings } from './types'
import type { Locale } from '../types/document'

export type { Locale, Strings }

const LOCALE_MAP: Record<Locale, Strings> = { en, tr }

interface I18nContextValue {
  locale: Locale
  t: Strings
  setLocale: (locale: Locale) => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({
  initialLocale = 'en',
  onLocaleChange,
  children,
}: {
  initialLocale?: Locale
  onLocaleChange?: (locale: Locale) => void
  children: ReactNode
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  useEffect(() => {
    setLocaleState(initialLocale)
  }, [initialLocale])

  const setLocale = useCallback(
    (next: Locale) => {
      setLocaleState(next)
      onLocaleChange?.(next)
    },
    [onLocaleChange],
  )

  const t = LOCALE_MAP[locale] ?? en

  const value = useMemo(() => ({ locale, t, setLocale }), [locale, t, setLocale])

  return createElement(I18nContext.Provider, { value }, children)
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

export function getStrings(locale: Locale): Strings {
  return LOCALE_MAP[locale] ?? en
}

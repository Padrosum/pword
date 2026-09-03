import { useI18n } from '../i18n'
import type { Locale } from '../types/document'

const LOCALES: { id: Locale; flag: string; label: string }[] = [
  { id: 'en', flag: '🇬🇧', label: 'EN' },
  { id: 'tr', flag: '🇹🇷', label: 'TR' },
]

export function LanguageToggle() {
  const { locale, setLocale } = useI18n()

  const next = LOCALES.find((l) => l.id !== locale) ?? LOCALES[0]!

  return (
    <button
      type="button"
      onClick={() => setLocale(next.id)}
      aria-label={`Switch to ${next.label}`}
      title={`Switch to ${next.label}`}
      className="inline-flex size-8 items-center justify-center font-mono text-[11px] font-medium text-muted transition-colors hover:bg-accent-soft hover:text-ink"
    >
      {locale.toUpperCase()}
    </button>
  )
}

import type { JSONContent } from '@tiptap/core'

export type DocumentContent = JSONContent

export interface PadDocument {
  id: string
  title: string
  content: DocumentContent
  createdAt: number
  updatedAt: number
  wordCount: number
  charCount: number
  schemaVersion: 1
  /** Monoton persistence revision; absent only in pre-revision records. */
  revision?: number
}

export type SaveState = 'saved' | 'saving' | 'unsaved' | 'error'

export type ThemeMode = 'system' | 'light' | 'dark'

export type Locale = 'en' | 'tr'

export interface AppSettings {
  theme: ThemeMode
  locale: Locale
  lastOpenedId: string | null
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  locale: 'en',
  lastOpenedId: null,
}

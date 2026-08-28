import type { Editor } from '@tiptap/core'

export interface ParagraphStyle {
  id: string
  label: string
  isActive: (editor: Editor) => boolean
  apply: (editor: Editor) => void
  canApply: (editor: Editor) => boolean
}

export const PARAGRAPH_STYLES: ParagraphStyle[] = [
  {
    id: 'normal',
    label: 'Normal text',
    isActive: (e) => e.isActive('paragraph') && !e.isActive('heading'),
    apply: (e) => e.chain().focus().setParagraph().run(),
    canApply: () => true,
  },
  {
    id: 'title',
    label: 'Title',
    isActive: (e) => e.isActive('docTitle'),
    apply: (e) => e.chain().focus().setDocTitle().run(),
    canApply: () => true,
  },
  {
    id: 'subtitle',
    label: 'Subtitle',
    isActive: (e) => e.isActive('docSubtitle'),
    apply: (e) => e.chain().focus().setDocSubtitle().run(),
    canApply: () => true,
  },
  {
    id: 'h1',
    label: 'Heading 1',
    isActive: (e) => e.isActive('heading', { level: 1 }),
    apply: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
    canApply: (e) => e.can().toggleHeading({ level: 1 }),
  },
  {
    id: 'h2',
    label: 'Heading 2',
    isActive: (e) => e.isActive('heading', { level: 2 }),
    apply: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
    canApply: (e) => e.can().toggleHeading({ level: 2 }),
  },
  {
    id: 'h3',
    label: 'Heading 3',
    isActive: (e) => e.isActive('heading', { level: 3 }),
    apply: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
    canApply: (e) => e.can().toggleHeading({ level: 3 }),
  },
]

export function currentParagraphStyle(editor: Editor): ParagraphStyle {
  for (let i = PARAGRAPH_STYLES.length - 1; i >= 0; i--) {
    const style = PARAGRAPH_STYLES[i]
    if (style.id !== 'normal' && style.isActive(editor)) return style
  }
  return PARAGRAPH_STYLES[0]!
}

export const FONT_FAMILIES: { id: string; label: string; css: string }[] = [
  { id: 'serif', label: 'Serif', css: "'Charter', 'Bitstream Charter', 'Sitka Text', Cambria, Georgia, serif" },
  { id: 'literata', label: 'Literata', css: "'Literata Variable', Charter, Georgia, serif" },
  { id: 'lora', label: 'Lora', css: "'Lora Variable', Georgia, serif" },
  { id: 'playfair', label: 'Playfair Display', css: "'Playfair Display Variable', Georgia, serif" },
  { id: 'sans', label: 'Sans', css: "'Inter Variable', ui-sans-serif, system-ui, sans-serif" },
  { id: 'open-sans', label: 'Open Sans', css: "'Open Sans Variable', ui-sans-serif, system-ui, sans-serif" },
  { id: 'mono', label: 'Mono', css: "ui-monospace, 'Cascadia Mono', 'JetBrains Mono', Menlo, Consolas, monospace" },
  { id: 'jetbrains', label: 'JetBrains Mono', css: "'JetBrains Mono Variable', ui-monospace, Menlo, Consolas, monospace" },
]

export function fontIdToCss(id: string): string {
  return FONT_FAMILIES.find((f) => f.id === id)?.css ?? FONT_FAMILIES[0]!.css
}

export function cssToFontId(css: string | null | undefined): string {
  if (!css) return 'serif'
  return FONT_FAMILIES.find((f) => f.css === css)?.id ?? 'serif'
}

export const FONT_SIZES = ['11pt', '12pt', '14pt', '16pt', '18pt', '20pt', '24pt', '28pt', '32pt']

export const TEXT_COLORS = [
  { label: 'Ink', value: '#26231e' },
  { label: 'Red', value: '#c0392b' },
  { label: 'Orange', value: '#d97706' },
  { label: 'Green', value: '#15803d' },
  { label: 'Blue', value: '#1d4ed8' },
  { label: 'Purple', value: '#7c3aed' },
]

export const HIGHLIGHT_COLORS = [
  { label: 'Yellow', value: '#fde68a' },
  { label: 'Green', value: '#bbf7d0' },
  { label: 'Blue', value: '#bfdbfe' },
  { label: 'Pink', value: '#fbcfe8' },
  { label: 'Purple', value: '#ddd6fe' },
]

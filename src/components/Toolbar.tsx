import { useRef, useState } from 'react'
import type { Editor } from '@tiptap/core'
import { useEditorState } from '@tiptap/react'
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Baseline,
  Bold,
  ChevronDown,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  MinusSquare,
  Plus,
  Redo2,
  RemoveFormatting,
  SquareSplitVertical,
  Strikethrough,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react'
import { IconButton } from './ui/IconButton'
import { Menu, MenuItem } from './ui/Menu'
import { Select } from './ui/Select'
import { Dialog } from './ui/Dialog'
import { toast } from '../lib/toast'
import {
  FONT_FAMILIES,
  FONT_SIZES,
  HIGHLIGHT_COLORS,
  PARAGRAPH_STYLES,
  TEXT_COLORS,
  cssToFontId,
  currentParagraphStyle,
  fontIdToCss,
} from '../editor/styles'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']

/** Safely normalize a user-provided URL; returns null for unsafe values. */
function normalizeUrl(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const candidate = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const url = new URL(candidate)
    if (url.protocol !== 'https:' && url.protocol !== 'http:' && url.protocol !== 'mailto:') {
      return null
    }
    return url.toString()
  } catch {
    return null
  }
}

interface ToolbarState {
  canUndo: boolean
  canRedo: boolean
  bold: boolean
  italic: boolean
  underline: boolean
  strike: boolean
  styleId: string
  fontId: string
  fontSize: string
  color: string | null
  highlight: string | null
  align: string
  bullet: boolean
  ordered: boolean
  task: boolean
  hasLink: boolean
  inTable: boolean
}

export function Toolbar({ editor }: { editor: Editor }) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const state = useEditorState<ToolbarState>({
    editor,
    selector: ({ editor: e }) => ({
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      styleId: currentParagraphStyle(e).id,
      fontId: cssToFontId(e.getAttributes('textStyle').fontFamily as string | undefined),
      fontSize: (e.getAttributes('textStyle').fontSize as string | undefined) ?? '12pt',
      color: (e.getAttributes('textStyle').color as string | undefined) ?? null,
      highlight: (e.getAttributes('highlight').color as string | undefined) ?? null,
      align:
        e.isActive({ textAlign: 'center' }) ? 'center'
        : e.isActive({ textAlign: 'right' }) ? 'right'
        : e.isActive({ textAlign: 'justify' }) ? 'justify'
        : 'left',
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      task: e.isActive('taskList'),
      hasLink: e.isActive('link'),
      inTable: e.isActive('table'),
    }),
  })

  if (!state) return <div className="h-10 border-b border-line" aria-hidden="true" />
  const s = state

  const insertImage = (file: File) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast('error', 'Unsupported image type. Use PNG, JPEG, GIF or WebP.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast('error', 'Image is too large. Maximum size is 5 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      editor.chain().focus().setImage({ src: reader.result as string, alt: file.name }).run()
    }
    reader.onerror = () => toast('error', 'Could not read that image file.')
    reader.readAsDataURL(file)
  }

  const chain = () => editor.chain().focus()

  return (
    <div className="galley-rail no-print border-b border-line bg-surface" role="toolbar" aria-label="Formatting">
      <div className="no-scrollbar mx-auto flex max-w-6xl items-center gap-0.5 overflow-x-auto px-2 py-1 sm:px-4">
        <IconButton label="Undo" onClick={() => chain().undo().run()} disabled={!s.canUndo}>
          <Undo2 className="size-4" />
        </IconButton>
        <IconButton label="Redo" onClick={() => chain().redo().run()} disabled={!s.canRedo}>
          <Redo2 className="size-4" />
        </IconButton>

        <ToolbarDivider />

        <Select label="Paragraph style" className="mx-0.5" value={s.styleId} onChange={(id) => {
          const style = PARAGRAPH_STYLES.find((p) => p.id === id)
          if (style) style.apply(editor)
        }}>
          {PARAGRAPH_STYLES.map((style) => (
            <option key={style.id} value={style.id}>{style.label}</option>
          ))}
        </Select>

        <Select label="Font" className="mx-0.5" value={s.fontId} onChange={(id) => chain().setFontFamily(fontIdToCss(id)).run()}>
          {FONT_FAMILIES.map((f) => (
            <option key={f.id} value={f.id}>{f.label}</option>
          ))}
        </Select>

        <Select label="Font size" className="mx-0.5" value={s.fontSize} onChange={(size) => {
          if (size === '12pt') chain().unsetFontSize().run()
          else chain().setFontSize(size).run()
        }}>
          {FONT_SIZES.map((size) => (
            <option key={size} value={size}>{size.replace('pt', '')}</option>
          ))}
        </Select>

        <ToolbarDivider />

        <IconButton label="Bold" active={s.bold} onClick={() => chain().toggleBold().run()}>
          <Bold className="size-4" />
        </IconButton>
        <IconButton label="Italic" active={s.italic} onClick={() => chain().toggleItalic().run()}>
          <Italic className="size-4" />
        </IconButton>
        <IconButton label="Underline" active={s.underline} onClick={() => chain().toggleUnderline().run()}>
          <UnderlineIcon className="size-4" />
        </IconButton>
        <IconButton label="Strikethrough" active={s.strike} onClick={() => chain().toggleStrike().run()}>
          <Strikethrough className="size-4" />
        </IconButton>

        <ToolbarDivider />

        <Menu label="Text color" trigger={({ toggle, open }) => (
          <IconButton label="Text color" onClick={toggle} aria-haspopup="menu" aria-expanded={open}
            className={s.color && s.color !== TEXT_COLORS[0]!.value ? 'bg-accent-soft' : undefined}>
            <Baseline className="size-4" style={s.color ? { color: s.color } : undefined} />
          </IconButton>
        )}>
          {(close) => (
            <SwatchGrid colors={TEXT_COLORS} selected={s.color}
              onPick={(value) => { chain().setColor(value).run(); close() }}
              onClear={() => { chain().unsetColor().run(); close() }}
              clearLabel="Remove color" />
          )}
        </Menu>

        <Menu label="Highlight" trigger={({ toggle, open }) => (
          <IconButton label="Highlight" onClick={toggle} aria-haspopup="menu" aria-expanded={open} active={!!s.highlight}>
            <Highlighter className="size-4" />
          </IconButton>
        )}>
          {(close) => (
            <SwatchGrid colors={HIGHLIGHT_COLORS} selected={s.highlight}
              onPick={(value) => { chain().toggleHighlight({ color: value }).run(); close() }}
              onClear={() => { chain().unsetHighlight().run(); close() }}
              clearLabel="Remove highlight" />
          )}
        </Menu>

        <ToolbarDivider />

        <Menu label="Alignment" trigger={({ toggle, open }) => (
          <IconButton label={`Alignment: ${s.align}`} onClick={toggle} aria-haspopup="menu" aria-expanded={open}>
            {s.align === 'center' ? <AlignCenter className="size-4" />
              : s.align === 'right' ? <AlignRight className="size-4" />
              : s.align === 'justify' ? <AlignJustify className="size-4" />
              : <AlignLeft className="size-4" />}
            <ChevronDown className="size-3 opacity-60" />
          </IconButton>
        )}>
          {(close) => (
            <>
              <MenuItem icon={<AlignLeft className="size-4" />} onSelect={() => { chain().setTextAlign('left').run(); close() }}>Left</MenuItem>
              <MenuItem icon={<AlignCenter className="size-4" />} onSelect={() => { chain().setTextAlign('center').run(); close() }}>Center</MenuItem>
              <MenuItem icon={<AlignRight className="size-4" />} onSelect={() => { chain().setTextAlign('right').run(); close() }}>Right</MenuItem>
              <MenuItem icon={<AlignJustify className="size-4" />} onSelect={() => { chain().setTextAlign('justify').run(); close() }}>Justify</MenuItem>
            </>
          )}
        </Menu>

        <IconButton label="Bullet list" active={s.bullet} onClick={() => chain().toggleBulletList().run()}>
          <List className="size-4" />
        </IconButton>
        <IconButton label="Numbered list" active={s.ordered} onClick={() => chain().toggleOrderedList().run()}>
          <ListOrdered className="size-4" />
        </IconButton>

        <ToolbarDivider />

        <IconButton label={s.hasLink ? 'Edit link' : 'Add link'} active={s.hasLink} onClick={() => setLinkDialogOpen(true)}>
          <Link2 className="size-4" />
        </IconButton>

        <Menu label="Insert" align="end" trigger={({ toggle, open }) => (
          <IconButton label="Insert" onClick={toggle} aria-haspopup="menu" aria-expanded={open}>
            <Plus className="size-4" />
            <ChevronDown className="size-3 opacity-60" />
          </IconButton>
        )}>
          {(close) => (
            <>
              <MenuItem icon={<ImageIcon className="size-4" />} onSelect={() => { fileInputRef.current?.click(); close() }}>Image…</MenuItem>
              <MenuItem icon={<TableIcon className="size-4" />} onSelect={() => { chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); close() }}>Table</MenuItem>
              <MenuItem icon={<Minus className="size-4" />} onSelect={() => { chain().setHorizontalRule().run(); close() }}>Horizontal rule</MenuItem>
              <MenuItem icon={<SquareSplitVertical className="size-4" />} onSelect={() => { chain().setPageBreak().run(); close() }}>Page break</MenuItem>
              <MenuItem icon={<ListTodo className="size-4" />} onSelect={() => { chain().toggleTaskList().run(); close() }}>Checklist</MenuItem>
            </>
          )}
        </Menu>

        <ToolbarDivider />

        <IconButton label="Clear formatting" onClick={() => chain().unsetAllMarks().clearNodes().run()}>
          <RemoveFormatting className="size-4" />
        </IconButton>
      </div>

      {s.inTable && (
        <div className="no-scrollbar mx-auto flex max-w-6xl items-center gap-0.5 overflow-x-auto border-t border-line px-2 py-1 sm:px-4" role="toolbar" aria-label="Table tools">
          <span className="mr-2 text-xs font-medium text-muted">Table</span>
          <TableButton label="Insert row above" onClick={() => chain().addRowBefore().run()} />
          <TableButton label="Insert row below" onClick={() => chain().addRowAfter().run()} />
          <TableButton label="Insert column before" onClick={() => chain().addColumnBefore().run()} />
          <TableButton label="Insert column after" onClick={() => chain().addColumnAfter().run()} />
          <TableButton label="Delete row" onClick={() => chain().deleteRow().run()} minus />
          <TableButton label="Delete column" onClick={() => chain().deleteColumn().run()} minus />
          <TableButton label="Delete table" onClick={() => chain().deleteTable().run()} minus />
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        className="sr-only"
        aria-label="Insert image"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) insertImage(file)
          event.target.value = ''
        }}
      />

      <LinkDialog
        open={linkDialogOpen}
        editor={editor}
        onClose={() => setLinkDialogOpen(false)}
      />
    </div>
  )
}

function TableButton({ label, onClick, minus }: { label: string; onClick: () => void; minus?: boolean }) {
  return (
    <IconButton label={label} onClick={onClick} className="size-7">
      {minus ? <MinusSquare className="size-3.5" /> : <Plus className="size-3.5" />}
    </IconButton>
  )
}

function ToolbarDivider() {
  return <span className="mx-1.5 h-5 w-px shrink-0 bg-line" aria-hidden="true" />
}

function SwatchGrid({
  colors,
  selected,
  onPick,
  onClear,
  clearLabel,
}: {
  colors: { label: string; value: string }[]
  selected: string | null
  onPick: (value: string) => void
  onClear: () => void
  clearLabel: string
}) {
  return (
    <div className="p-1.5">
      <div className="grid grid-cols-6 gap-1" role="group" aria-label="Colors">
        {colors.map((color) => (
          <button
            key={color.value}
            type="button"
            role="menuitem"
            aria-label={color.label}
            title={color.label}
            onClick={() => onPick(color.value)}
            className="size-6 rounded-md border border-line-strong transition-transform hover:scale-110"
            style={{ background: color.value }}
            aria-pressed={selected === color.value}
          />
        ))}
      </div>
      <MenuItem onSelect={onClear}>{clearLabel}</MenuItem>
    </div>
  )
}

function LinkDialog({ open, editor, onClose }: { open: boolean; editor: Editor; onClose: () => void }) {
  // Render the inner dialog only while open so its local state resets each time.
  if (!open) return null
  return (
    <LinkDialogInner
      editor={editor}
      initialHref={(editor.getAttributes('link').href as string | undefined) ?? ''}
      onClose={onClose}
    />
  )
}

function LinkDialogInner({ editor, initialHref, onClose }: { editor: Editor; initialHref: string; onClose: () => void }) {
  const [url, setUrl] = useState(initialHref)

  const apply = () => {
    const href = normalizeUrl(url)
    if (href === null) {
      toast('error', 'Enter a valid link (https://, http:// or mailto:).')
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
    onClose()
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Link"
      description="Links open in a new tab. Everything stays on your device."
    >
      <form
        onSubmit={(event) => { event.preventDefault(); apply() }}
        className="flex flex-col gap-3"
      >
        <input
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://example.com"
          aria-label="Link URL"
          className="h-9 w-full border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent"
        />
        <div className="flex justify-end gap-2">
          {editor.isActive('link') && (
            <button
              type="button"
              onClick={() => { editor.chain().focus().extendMarkRange('link').unsetLink().run(); onClose() }}
              className="h-9 px-3 text-sm text-danger hover:bg-accent-soft"
            >
              Remove link
            </button>
          )}
          <button
            type="submit"
            className="h-9 bg-accent px-4 text-sm font-medium text-accent-contrast hover:opacity-90"
          >
            Apply
          </button>
        </div>
      </form>
    </Dialog>
  )
}

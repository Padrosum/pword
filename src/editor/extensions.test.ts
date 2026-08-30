import { describe, expect, it } from 'vitest'
import { Editor } from '@tiptap/core'
import { buildExtensions } from './extensions'
import type { JSONContent } from '@tiptap/core'

function makeEditor(content: string | JSONContent): Editor {
  const editor = new Editor({ extensions: buildExtensions(), content })
  return editor
}

describe('editor schema sanitization', () => {
  it('keeps supported formatting from imported HTML', () => {
    const editor = makeEditor('<h1>Title</h1><p><strong>bold</strong> and <em>italic</em></p><ul><li><p>item</p></li></ul>')
    const json = editor.getJSON()
    expect(json.content?.some((n) => n.type === 'heading')).toBe(true)
    const p = json.content?.find((n) => n.type === 'paragraph')
    expect(p?.content?.some((r) => r.marks?.some((m) => m.type === 'bold'))).toBe(true)
    expect(json.content?.some((n) => n.type === 'bulletList')).toBe(true)
    editor.destroy()
  })

  it('strips scripts and unknown elements while keeping text', () => {
    const editor = makeEditor('<p>safe</p><script>alert(1)</script><style>x{}</style><p>more</p>')
    const json = editor.getJSON()
    const serialized = JSON.stringify(json)
    expect(serialized).not.toContain('script')
    expect(serialized).not.toContain('alert(1)')
    expect(serialized).toContain('safe')
    editor.destroy()
  })

  it('drops unsafe link protocols but keeps the anchor text', () => {
    const editor = makeEditor('<p><a href="javascript:alert(1)">click</a><a href="https://example.com">ok</a></p>')
    const json = editor.getJSON()
    const serialized = JSON.stringify(json)
    expect(serialized).not.toContain('javascript:')
    const paragraph = json.content?.find((n) => n.type === 'paragraph')
    expect(JSON.stringify(paragraph)).toContain('click')
    expect(JSON.stringify(paragraph)).toContain('https://example.com')
    editor.destroy()
  })

  it('blocks remote images while keeping local data images', () => {
    const editor = makeEditor(
      '<p>before</p><img src="https://example.com/tracker.png"><img src="data:image/png;base64,AAAA">',
    )
    const json = editor.getJSON()
    expect(json.content?.some((n) => n.type === 'image' && n.attrs?.src?.startsWith('https://'))).toBe(false)
    expect(json.content?.some((n) => n.type === 'image' && n.attrs?.src?.startsWith('data:image/png'))).toBe(true)
    editor.destroy()
  })

  it('renders a blocked placeholder for remote images in stored content', () => {
    const editor = makeEditor({
      type: 'doc',
      content: [{ type: 'image', attrs: { src: 'https://example.com/remote.png', alt: 'remote' } }],
    })
    expect(editor.view.dom.querySelector('img')).toBeNull()
    expect(editor.view.dom.querySelector('[data-blocked-image]')).toBeTruthy()
    editor.destroy()
  })

  it('supports the page break node round trip', () => {
    const editor = makeEditor('<p>before</p><div data-page-break></div><p>after</p>')
    const json = editor.getJSON()
    expect(json.content?.some((n) => n.type === 'pageBreak')).toBe(true)
    editor.destroy()
  })
})

describe('editor commands', () => {
  it('toggles marks and paragraph styles', () => {
    const editor = makeEditor('<p>hello world</p>')
    editor.chain().focus().selectAll().toggleBold().run()
    expect(editor.isActive('bold')).toBe(true)
    editor.chain().focus().unsetMark('bold').run()
    expect(editor.isActive('bold')).toBe(false)
    editor.chain().focus().toggleHeading({ level: 1 }).run()
    expect(editor.isActive('heading', { level: 1 })).toBe(true)
    editor.destroy()
  })
})

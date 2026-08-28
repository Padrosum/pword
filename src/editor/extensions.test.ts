import { describe, expect, it } from 'vitest'
import { Editor } from '@tiptap/core'
import { buildExtensions } from './extensions'

function makeEditor(html: string): Editor {
  const editor = new Editor({ extensions: buildExtensions(), content: html })
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

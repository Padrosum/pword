import { describe, expect, it } from 'vitest'
import { createDocument } from '../storage/documents'
import { exportDocx } from './docx'
import { importDocx } from '../import/docx'
import type { JSONContent } from '@tiptap/core'

const sampleContent: JSONContent = {
  type: 'doc',
  content: [
    { type: 'docTitle', content: [{ type: 'text', text: 'The Title' }] },
    { type: 'paragraph', content: [{ type: 'text', text: 'plain ' }, { type: 'text', marks: [{ type: 'bold' }], text: 'bold' }, { type: 'text', text: ' text' }] },
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'A Heading' }] },
    {
      type: 'bulletList',
      content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'first item' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'second item' }] }] },
      ],
    },
    { type: 'pageBreak' },
    {
      type: 'orderedList',
      content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'step one' }] }] },
      ],
    },
  ],
}

describe('exportDocx', () => {
  it('produces a non-empty .docx (zip) blob', async () => {
    const doc = createDocument('Round trip', sampleContent)
    const blob = await exportDocx(doc)
    expect(blob.size).toBeGreaterThan(1000)
    const header = new Uint8Array(await blob.slice(0, 2).arrayBuffer())
    // A .docx file is a ZIP archive: bytes 0x50 0x4B ("PK").
    expect(header[0]).toBe(0x50)
    expect(header[1]).toBe(0x4b)
  })
})

describe('docx import/export round trip', () => {
  it('imports a generated .docx back into editor content', async () => {
    // Build a real .docx with the same library used for export.
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx')
    const wordDoc = new Document({
      sections: [
        {
          children: [
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Chapter One')] }),
            new Paragraph({ children: [new TextRun({ text: 'important', bold: true }), new TextRun(' words')] }),
          ],
        },
      ],
    })
    const buffer = await Packer.toBuffer(wordDoc)
    const file = new File([buffer as unknown as BlobPart], 'thesis.docx')

    const result = await importDocx(file)

    expect(result.title).toBe('thesis')
    const heading = result.content.content?.find((n) => n.type === 'heading')
    expect(heading?.content?.[0]?.text).toBe('Chapter One')

    const paragraph = result.content.content?.find(
      (n) => n.type === 'paragraph' && JSON.stringify(n).includes('important'),
    )
    expect(paragraph).toBeDefined()
    const boldRun = paragraph?.content?.find(
      (run) => run.text === 'important' && run.marks?.some((m) => m.type === 'bold'),
    )
    expect(boldRun).toBeDefined()
  })

  it('rejects non-docx files with a clear error', async () => {
    const file = new File(['not a docx'], 'notes.txt')
    await expect(importDocx(file)).rejects.toThrow(/\.docx/)
  })

  it('rejects corrupted docx payloads', async () => {
    const file = new File([new Uint8Array([1, 2, 3, 4])], 'broken.docx')
    await expect(importDocx(file)).rejects.toThrow()
  })
})

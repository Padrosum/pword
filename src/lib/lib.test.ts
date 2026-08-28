import { describe, expect, it, vi } from 'vitest'
import { countCharacters, countWords } from '../lib/textStats'
import { createId } from '../lib/id'
import { sanitizeFilename, downloadBlob } from '../lib/download'
import { jsonToPlainText, createDocument } from '../storage/documents'

describe('textStats', () => {
  it('counts words', () => {
    expect(countWords('')).toBe(0)
    expect(countWords('   \n\t ')).toBe(0)
    expect(countWords('hello world')).toBe(2)
    expect(countWords('  one  two  three ')).toBe(3)
  })

  it('counts characters as code points', () => {
    expect(countCharacters('')).toBe(0)
    expect(countCharacters('abc')).toBe(3)
    // Surrogate pair counts as one character.
    expect(countCharacters('a😀')).toBe(2)
  })
})

describe('createId', () => {
  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => createId()))
    expect(ids.size).toBe(100)
  })
})

describe('sanitizeFilename', () => {
  it('strips filesystem-unsafe characters', () => {
    expect(sanitizeFilename('my: report?.docx', 'document')).toBe('my report.docx')
  })

  it('falls back when empty', () => {
    expect(sanitizeFilename('///', 'document')).toBe('document')
  })
})

describe('jsonToPlainText', () => {
  it('extracts text and block separators', () => {
    const doc = createDocument('T', {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'First line' }] },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'item' }] }] },
          ],
        },
      ],
    })
    const text = jsonToPlainText(doc.content)
    expect(text).toContain('First line')
    expect(text).toContain('item')
    expect(text.trim().split('\n').length).toBe(2)
  })
})

describe('createDocument', () => {
  it('creates a document with metadata and computed counts', () => {
    const doc = createDocument('Essay', {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hello world' }] }],
    })
    expect(doc.title).toBe('Essay')
    expect(doc.wordCount).toBe(2)
    expect(doc.charCount).toBe(11) // "hello world"
    expect(doc.schemaVersion).toBe(1)
    expect(doc.createdAt).toBe(doc.updatedAt)
  })
})

describe('downloadBlob', () => {
  it('creates and revokes an object URL without throwing', () => {
    vi.useFakeTimers()
    const created: string[] = []
    const revoked: string[] = []
    const originalCreate = URL.createObjectURL
    const originalRevoke = URL.revokeObjectURL
    URL.createObjectURL = () => {
      const url = `blob:fake-${created.length}`
      created.push(url)
      return url
    }
    URL.revokeObjectURL = (url: string) => {
      revoked.push(url)
    }
    try {
      downloadBlob(new Blob(['x']), 'file.txt')
      vi.advanceTimersByTime(10_000)
    } finally {
      vi.useRealTimers()
      URL.createObjectURL = originalCreate
      URL.revokeObjectURL = originalRevoke
    }
    expect(created).toHaveLength(1)
    expect(revoked).toHaveLength(1)
  })
})

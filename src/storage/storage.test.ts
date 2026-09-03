import { beforeEach, describe, expect, it } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { Database, isQuotaError } from './db'
import {
  createDocument,
  DocumentRepository,
  jsonToPlainText,
  RevisionConflictError,
} from './documents'
import { SettingsRepository } from './settings'
import { DEFAULT_SETTINGS } from '../types/document'
import type { PadDocument } from '../types/document'

describe('Database', () => {
  it('opens the schema with documents and settings stores', async () => {
    const db = await new Database().get('settings', 'nonexistent')
    expect(db).toBeUndefined()
  })

  it('supports put / get / delete round trips', async () => {
    const db = new Database()
    await db.put('settings', { key: 'test', value: { a: 1 } })
    expect(await db.get('settings', 'test')).toEqual({ key: 'test', value: { a: 1 } })
    await db.delete('settings', 'test')
    expect(await db.get('settings', 'test')).toBeUndefined()
  })
})

describe('DocumentRepository', () => {
  let repository: DocumentRepository

  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory()
    repository = new DocumentRepository(new Database())
  })

  it('creates a document with an empty-content default', async () => {
    const doc = createDocument()
    expect(doc.title).toBe('Untitled document')
    expect(doc.content.type).toBe('doc')
    expect(doc.wordCount).toBe(0)
  })

  it('saves, loads, updates and deletes documents', async () => {
    const doc = createDocument('Essay', {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'one two three' }] }],
    })

    await repository.save(doc)
    const loaded = await repository.get(doc.id)
    expect(loaded?.title).toBe('Essay')
    expect(loaded?.wordCount).toBe(3)

    const updated: PadDocument = { ...loaded!, title: 'Essay v2', updatedAt: Date.now() + 1 }
    await repository.save(updated)
    const reloaded = await repository.get(doc.id)
    expect(reloaded?.title).toBe('Essay v2')

    await repository.remove(doc.id)
    expect(await repository.get(doc.id)).toBeUndefined()
  })

  it('rejects stale concurrent updates without overwriting newer content', async () => {
    const doc = createDocument('Original')
    await repository.insert(doc)

    const first = repository.update({ ...doc, title: 'First' }, 0)
    const second = repository.update({ ...doc, title: 'Second' }, 0)
    const results = await Promise.allSettled([first, second])

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1)
    const rejected = results.find((result) => result.status === 'rejected')
    expect(rejected?.status === 'rejected' && rejected.reason).toBeInstanceOf(RevisionConflictError)
    const saved = await repository.get(doc.id)
    expect(['First', 'Second']).toContain(saved?.title)
    expect(saved?.revision).toBe(1)
  })

  it('does not recreate a document deleted before a stale update', async () => {
    const doc = createDocument('To delete')
    await repository.insert(doc)
    await repository.remove(doc.id)

    await expect(repository.update({ ...doc, title: 'Stale' }, 0)).rejects.toBeInstanceOf(RevisionConflictError)
    expect(await repository.get(doc.id)).toBeUndefined()
  })

  it('lists documents most recently updated first', async () => {
    const a = createDocument('A')
    const b = createDocument('B')
    const c = createDocument('C')
    // Deterministic timestamps: B older than C.
    await repository.save(a)
    await repository.save({ ...b, updatedAt: a.updatedAt - 2000 })
    await repository.save({ ...c, updatedAt: a.updatedAt - 1000 })

    await repository.save({ ...a, updatedAt: a.updatedAt + 5000 })

    const list = await repository.list()
    expect(list.map((d) => d.title)).toEqual(['A', 'C', 'B'])
  })

  it('serializes content to plain text for counts', () => {
    const doc = createDocument('T', {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Chapter' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Body text' }] },
      ],
    })
    const text = jsonToPlainText(doc.content)
    expect(text).toBe('Chapter\nBody text\n')
    expect(doc.wordCount).toBe(3) // Chapter, Body, text
  })
})

describe('SettingsRepository', () => {
  let repository: SettingsRepository

  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory()
    repository = new SettingsRepository(new Database())
  })

  it('returns defaults when nothing is stored', async () => {
    expect(await repository.load()).toEqual(DEFAULT_SETTINGS)
  })

  it('persists and merges settings', async () => {
    await repository.save({ theme: 'dark', lastOpenedId: 'doc-1' })
    expect(await repository.load()).toEqual({ theme: 'dark', locale: 'en', lastOpenedId: 'doc-1' })
  })
})

describe('isQuotaError', () => {
  it('recognizes quota errors', () => {
    expect(isQuotaError(new DOMException('full', 'QuotaExceededError'))).toBe(true)
    expect(isQuotaError(new DOMException('nope', 'NotFoundError'))).toBe(false)
    expect(isQuotaError(new Error('other'))).toBe(false)
  })
})

import { createId } from '../lib/id'
import { countCharacters, countWords } from '../lib/textStats'
import type { DocumentContent, PadDocument } from '../types/document'
import { Database } from './db'

const STORE = 'documents'

export function createDocumentContent(): DocumentContent {
  return {
    type: 'doc',
    content: [{ type: 'paragraph' }],
  }
}

export function createDocument(
  title = 'Untitled document',
  content: DocumentContent = createDocumentContent(),
): PadDocument {
  const now = Date.now()
  const text = jsonToPlainText(content).replace(/\n+$/, '')
  return {
    id: createId(),
    title,
    content,
    createdAt: now,
    updatedAt: now,
    wordCount: countWords(text),
    charCount: countCharacters(text),
    schemaVersion: 1,
    revision: 0,
  }
}

export class RevisionConflictError extends Error {
  constructor(message = 'The document was changed in another tab') {
    super(message)
    this.name = 'RevisionConflictError'
  }
}

export class DocumentRepository {
  private readonly db: Database

  constructor(db: Database) {
    this.db = db
  }

  async list(): Promise<PadDocument[]> {
    const docs = await this.db.getAll<PadDocument>(STORE)
    return docs.sort((a, b) => b.updatedAt - a.updatedAt)
  }

  async get(id: string): Promise<PadDocument | undefined> {
    return this.db.get<PadDocument>(STORE, id)
  }

  /**
   * Legacy insert/update operation used only for initial writes and tests.
   * Editor updates must use update() so stale tabs cannot overwrite content.
   */
  async save(doc: PadDocument): Promise<void> {
    await this.db.put(STORE, doc)
  }

  async insert(doc: PadDocument): Promise<void> {
    await this.db.put(STORE, doc)
  }

  async update(doc: PadDocument, expectedRevision: number): Promise<PadDocument> {
    return this.db.update<PadDocument>(STORE, doc.id, (current) => {
      const currentRevision = current?.revision ?? 0
      if (!current || currentRevision !== expectedRevision) {
        throw new RevisionConflictError()
      }
      return { ...doc, revision: currentRevision + 1 }
    })
  }

  async remove(id: string): Promise<void> {
    await this.db.delete(STORE, id)
  }
}

export function jsonToPlainText(node: DocumentContent): string {
  const parts: string[] = []
  const walk = (n: DocumentContent) => {
    if (n.type === 'text' && typeof n.text === 'string') {
      parts.push(n.text)
      return
    }
    if (n.content) {
      for (const child of n.content) {
        walk(child)
      }
      if (isBlockNode(n.type)) parts.push('\n')
    }
  }
  walk(node)
  return parts.join('')
}

function isBlockNode(type: string | undefined): boolean {
  switch (type) {
    case 'paragraph':
    case 'heading':
    case 'bulletList':
    case 'orderedList':
    case 'taskList':
    case 'blockquote':
    case 'codeBlock':
    case 'table':
    case 'pageBreak':
    case 'horizontalRule':
      return true
    default:
      return false
  }
}

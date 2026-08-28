import { Editor } from '@tiptap/core'
import { buildExtensions } from '../editor/extensions'
import type { DocumentContent } from '../types/document'

export class DocxImportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DocxImportError'
  }
}

export interface DocxImportResult {
  title: string
  content: DocumentContent
  warnings: number
}

const MAX_DOCX_BYTES = 25 * 1024 * 1024

const STYLE_MAP = [
  // Underline and strikethrough are not converted by mammoth by default.
  'u => u',
  'strike => s',
  // Map Word's Title/Subtitle styles onto headings predictably.
  "p[style-name='Title'] => h1:fresh",
  "p[style-name='Subtitle'] => h2:fresh",
].join('\n')

/**
 * Import a .docx file entirely in the browser.
 *
 * mammoth converts the file to semantic HTML; loading that HTML through a
 * headless TipTap editor sanitizes it (the ProseMirror schema drops anything
 * the editor does not understand, so no untrusted markup survives).
 */
export async function importDocx(file: File): Promise<DocxImportResult> {
  if (!/\.docx$/i.test(file.name)) {
    throw new DocxImportError('Only .docx files can be imported. (.doc is not supported.)')
  }
  if (file.size > MAX_DOCX_BYTES) {
    throw new DocxImportError('This document is too large to import (maximum 25 MB).')
  }

  const arrayBuffer = await file.arrayBuffer()
  // The node build of mammoth reads { buffer }, the browser build { arrayBuffer }.
  const nodeBuffer = (globalThis as { Buffer?: { from(input: ArrayBuffer): unknown } }).Buffer
  const input = nodeBuffer ? { buffer: nodeBuffer.from(arrayBuffer) } : { arrayBuffer }

  const { convertToHtml } = await import('mammoth')
  let html: string
  let warnings: number
  try {
    const result = await convertToHtml(input as Parameters<typeof convertToHtml>[0], {
      styleMap: STYLE_MAP,
    })
    html = result.value
    warnings = result.messages.filter((m) => m.type === 'warning').length
  } catch (error) {
    console.error('[pword] docx import failed', error)
    throw new DocxImportError('The document appears to be corrupted or is not a valid .docx file.')
  }

  if (!html.trim()) {
    throw new DocxImportError('This document appears to be empty.')
  }

  let content: DocumentContent
  const headless = new Editor({
    extensions: buildExtensions(),
    content: html,
  })
  try {
    content = headless.getJSON()
  } finally {
    headless.destroy()
  }

  return {
    title: file.name.replace(/\.docx$/i, '').trim() || 'Imported document',
    content,
    warnings,
  }
}

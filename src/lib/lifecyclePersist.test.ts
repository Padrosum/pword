import { describe, expect, it, beforeEach } from 'vitest'
import {
  clearPendingSave,
  consumePendingSave,
  PENDING_SAVE_PREFIX,
  stashPendingSave,
} from './lifecyclePersist'
import { createDocument } from '../storage/documents'

describe('lifecyclePersist', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('stashPendingSave writes synchronously to sessionStorage', () => {
    const doc = createDocument('Emergency')
    stashPendingSave(doc)
    expect(sessionStorage.getItem(`${PENDING_SAVE_PREFIX}${doc.id}`)).toContain('Emergency')
  })

  it('consumePendingSave returns and removes a stashed document', () => {
    const doc = createDocument('Recover me')
    stashPendingSave(doc)

    const recovered = consumePendingSave(doc.id)
    expect(recovered?.title).toBe('Recover me')
    expect(sessionStorage.getItem(`${PENDING_SAVE_PREFIX}${doc.id}`)).toBeNull()
  })

  it('clearPendingSave removes a stashed document', () => {
    const doc = createDocument('Clear me')
    stashPendingSave(doc)
    clearPendingSave(doc.id)
    expect(consumePendingSave(doc.id)).toBeNull()
  })
})

import type { SaveState } from '../types/document'

export const SAVE_STATE_LABEL: Record<SaveState, string> = {
  saved: 'Proof saved',
  saving: 'Saving…',
  unsaved: 'Unsaved marks',
  error: 'Save failed',
}

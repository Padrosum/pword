import type { SaveState } from '../types/document'

export const SAVE_STATE_LABEL: Record<SaveState, string> = {
  saved: 'Saved locally',
  saving: 'Saving…',
  unsaved: 'Unsaved changes',
  error: 'Save failed',
}

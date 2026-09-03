import type { Strings } from './types'

export const en: Strings = {
  // Home
  onThisDevice: 'On this device',
  proofDesk: 'Proof desk',
  writePrivately: 'Write privately. Documents stay in this browser — no account, no uploads.',
  startWriting: 'Start writing',
  importDocx: 'Import .docx',
  importing: 'Importing…',
  recentGalleys: 'Recent galleys',
  noGalleysYet: 'No galleys yet. Start writing — everything stays on this device.',
  storedLocally: 'Stored locally',
  agpl: 'AGPL-3.0',

  // Document list
  untitledDocument: 'Untitled document',
  wordSingular: 'word',
  wordPlural: 'words',
  duplicate: 'Duplicate',
  delete: 'Delete',

  // Delete dialog
  deleteTitle: 'Delete this document?',
  deleteDescription: (title) =>
    `"${title}" will be permanently removed from this device. This cannot be undone.`,
  cancel: 'Cancel',

  // Editor TopBar
  backToDocuments: 'Back to documents',
  documentTitle: 'Document title',
  documentMenu: 'Document menu',

  // Save state
  proofSaved: 'Proof saved',
  saving: 'Saving…',
  unsavedMarks: 'Unsaved marks',
  saveFailed: 'Save failed',

  // StatusBar
  charSingular: 'char',
  charPlural: 'chars',
  pageSingular: 'page',
  pagePlural: 'pages',
  local: 'Local',

  // Toolbar
  formatting: 'Formatting',
  undo: 'Undo',
  redo: 'Redo',
  paragraphStyle: 'Paragraph style',
  font: 'Font',
  fontSize: 'Font size',
  bold: 'Bold',
  italic: 'Italic',
  underline: 'Underline',
  strikethrough: 'Strikethrough',
  textColor: 'Text color',
  highlight: 'Highlight',
  alignLeft: 'Align left',
  alignCenter: 'Align center',
  alignRight: 'Align right',
  alignJustify: 'Justify',
  bulletList: 'Bullet list',
  numberedList: 'Numbered list',
  checklist: 'Checklist',
  insertLink: 'Insert link',
  insertImage: 'Insert image',
  insertTable: 'Insert table',
  horizontalRule: 'Horizontal rule',
  pageBreak: 'Page break',
  clearFormatting: 'Clear formatting',
  linkUrl: 'Link URL',
  removeLink: 'Remove link',
  apply: 'Apply',

  // Editor menu items
  newDocument: 'New document',
  importDocxMenu: 'Import .docx…',
  duplicateMenu: 'Duplicate',
  exportDocx: 'Export as .docx',
  printPdf: 'Print / Save as PDF',
  deleteDocument: 'Delete document',

  // Toasts / errors
  saveFailed_toast: 'Save failed. Try again in a moment.',
  storageFull: 'Storage is full on this device. Remove images or free browser storage.',
  conflictTab: 'This document changed in another tab. Reload it before continuing.',
  importWarnings: (n) => `Imported with ${n} unsupported formatting note(s).`,
  importFailed:
    "Couldn't open this document. The file may be corrupted or contain unsupported formatting.",
  exportFailed: "Couldn't export this document. Your work is saved locally.",
  duplicateFailed: "Couldn't duplicate this document.",
  deleteFailed: "Couldn't delete this document.",
  createFailed: "Couldn't create a new document.",
  couldNotRead: "Couldn't read local storage. Documents may not persist.",
  unsupportedImageType: 'Unsupported image type. Use PNG, JPEG, GIF or WebP.',
  imageTooLarge: 'Image is too large. Maximum size is 5 MB.',
  imageReadError: 'Could not read that image file.',
  restoredSession: 'Restored unsaved changes from your last session.',

  // Loading
  loading: 'Loading…',

  // Relative time
  justNow: 'Just now',
  minutesAgo: (n) => `${n} minute${n === 1 ? '' : 's'} ago`,
  hoursAgo: (n) => `${n} hour${n === 1 ? '' : 's'} ago`,

  // Footer
  padros: 'Padros',

  // Theme
  themeLight: 'Light',
  themeDark: 'Dark',
  themeSystem: 'System',

  // Placeholder
  startWritingPlaceholder: 'Start writing…',
}

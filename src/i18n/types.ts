export type { Locale } from '../types/document'

export interface Strings {
  // Home
  onThisDevice: string
  proofDesk: string
  writePrivately: string
  startWriting: string
  importDocx: string
  importing: string
  recentGalleys: string
  noGalleysYet: string
  storedLocally: string
  agpl: string

  // Document list
  untitledDocument: string
  wordSingular: string
  wordPlural: string
  duplicate: string
  delete: string

  // Delete dialog
  deleteTitle: string
  deleteDescription: (title: string) => string
  cancel: string

  // Editor TopBar
  backToDocuments: string
  documentTitle: string
  documentMenu: string

  // Save state
  proofSaved: string
  saving: string
  unsavedMarks: string
  saveFailed: string

  // StatusBar
  charSingular: string
  charPlural: string
  pageSingular: string
  pagePlural: string
  local: string

  // Toolbar
  formatting: string
  undo: string
  redo: string
  paragraphStyle: string
  font: string
  fontSize: string
  bold: string
  italic: string
  underline: string
  strikethrough: string
  textColor: string
  highlight: string
  alignLeft: string
  alignCenter: string
  alignRight: string
  alignJustify: string
  bulletList: string
  numberedList: string
  checklist: string
  insertLink: string
  insertImage: string
  insertTable: string
  horizontalRule: string
  pageBreak: string
  clearFormatting: string
  linkUrl: string
  removeLink: string
  apply: string

  // Editor menu items
  newDocument: string
  importDocxMenu: string
  duplicateMenu: string
  exportDocx: string
  printPdf: string
  deleteDocument: string

  // Toasts / errors
  saveFailed_toast: string
  storageFull: string
  conflictTab: string
  importWarnings: (count: number) => string
  importFailed: string
  exportFailed: string
  duplicateFailed: string
  deleteFailed: string
  createFailed: string
  couldNotRead: string
  unsupportedImageType: string
  imageTooLarge: string
  imageReadError: string
  restoredSession: string

  // Loading
  loading: string

  // Relative time
  justNow: string
  minutesAgo: (n: number) => string
  hoursAgo: (n: number) => string

  // Footer / Padros
  padros: string

  // Theme
  themeLight: string
  themeDark: string
  themeSystem: string

  // Placeholder
  startWritingPlaceholder: string
}

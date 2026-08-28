# Pword

**Simple documents. Private by design.**

[![CI](https://github.com/Padrosum/pword/actions/workflows/ci.yml/badge.svg)](https://github.com/Padrosum/pword/actions/workflows/ci.yml)

Pword is a minimalist, local-first document editor for students, writers,
researchers, and anyone who needs to write without ceremony. It runs entirely
in your browser — there is no server, no account, and no upload. Your
documents live on your device and stay there.

Pword is part of the Padros family of tools (Pmusic, Pixora, Ptree), but it is
an independent application with no shared backend.

---

## Why Pword exists

Writing tools have drifted toward the cloud. Most editors today ask you to
sign in, sync your work to someone else's computer, and accept tracking in
exchange for a text box.

Pword takes the opposite position:

- **Local-first** — documents are stored in your browser (IndexedDB), never
  on a server.
- **Private by design** — no analytics, no telemetry, no tracking, no
  accounts, no cloud sync.
- **Simple** — a focused writing surface, a compact toolbar, and the
  formatting most documents actually need.
- **Yours** — export to `.docx`, PDF (via print), or just keep working.
  Closing the browser and coming back later loses nothing.

The product intentionally avoids being a Microsoft Word clone. It is a calm,
lightweight writing tool with its own identity.

---

## Features

### Writing

- Rich text editing: **bold, italic, underline, strikethrough**
- Text color and highlight
- Font family (Serif / Sans / Mono) and font size
- Paragraph styles: Title, Subtitle, Heading 1–3, Normal
- Alignment: left, center, right, justify
- Bullet lists, numbered lists, nested lists, checklists
- Links, images, tables, horizontal rules, explicit page breaks
- Undo/redo, keyboard shortcuts, clear formatting
- Live word count, character count, and page estimate

### Documents

- Automatic saving (debounced — not on every keystroke) with a visible save
  state: *Unsaved changes → Saving… → Saved locally*
- Manual save with `Ctrl/Cmd + S`
- Recent documents list, reopen where you left off
- Rename, duplicate, delete — all locally

### Files

- **Import `.docx`** — parsed entirely in the browser (headings, paragraphs,
  bold/italic/underline, font size, basic font family, text color, lists,
  tables, links, and embedded images where supported). Unsupported formatting
  is reported, never silently destroyed, and no external service ever sees
  your file. `.doc` (legacy binary) is not supported.
- **Export `.docx`** — the editor's document structure is converted to a
  Word-compatible file, client-side.
- **PDF / print** — a dedicated print stylesheet produces a clean A4
  document. Use your browser's "Save as PDF" — conversion happens on your
  device.

### Privacy & offline

- No account, no backend, no analytics, no remote document processing.
- No third-party network requests after the first load; fonts are bundled.
- Installable Progressive Web App: after the first visit (or installation),
  Pword works fully offline. A service worker caches the app shell.

> Pword does not claim 100% Microsoft Word compatibility. It handles common
> document structures predictably and tells you when something was skipped.

---

## Architecture

Pword is a fully static site. It can be deployed to GitHub Pages, Cloudflare
Pages, or any static host.

```
React 19 + TypeScript + Vite
Tailwind CSS v4 (design tokens, dark mode)
TipTap / ProseMirror (editor + schema-based sanitization)
IndexedDB (documents + settings, with schema versioning)
vite-plugin-pwa / Workbox (service worker, offline cache)
mammoth.js (DOCX → HTML import, lazy-loaded)
docx (JSON → DOCX export, lazy-loaded)
```

### Project structure

```
src/
  app/         application shell (view state, bootstrap)
  components/  UI: top bar, toolbar, status bar, home view, primitives
  editor/      TipTap setup, custom nodes (page break, title), style presets
  storage/     IndexedDB wrapper, document & settings repositories
  import/      DOCX import pipeline
  export/      DOCX export, print/PDF
  pwa/         service worker registration
  hooks/       useAutosave, useTheme
  lib/         small utilities (debounce, ids, stats, toasts, download)
  types/       shared document model types
  styles/      design tokens, editor typography, print styles
  test/        test setup and integration tests
```

### How documents are stored

Documents are kept in an IndexedDB database (`pword`) with a versioned schema
(migrations land in `src/storage/db.ts`):

- `documents` — id, title, content (ProseMirror JSON), createdAt, updatedAt,
  word/character counts, schema version
- `settings` — theme preference and last opened document

Autosave is debounced (900 ms) and also flushed when the tab is hidden or
closed, so a refresh or crash does not lose your work.

### Security model

Everything is processed locally. Imported `.docx` files are converted to
semantic HTML and then parsed through the ProseMirror schema, which drops
anything the editor does not understand — scripts, event handlers, and
unsafe link protocols never make it into your document. No remote scripts
are loaded; no document data ever leaves the browser.

---

## Development

Requires Node.js 20+.

```bash
npm install
npm run dev        # start the dev server
npm run test       # run the test suite (vitest)
npm run lint       # oxlint
npm run build      # type-check + production build (dist/)
npm run preview    # serve the production build
```

### Deployment

`npm run build` produces a self-contained `dist/` folder. Upload it to any
static host. No environment variables, no server configuration.

For GitHub Pages, deploy the `dist/` directory (e.g. with an Actions
workflow). For sub-directory hosting, set `base` in `vite.config.ts`.

---

## License

Copyright © 2026 Padros

This program is free software: you can redistribute it and/or modify it under
the terms of the **GNU Affero General Public License** as published by the
Free Software Foundation, either version 3 of the License, or (at your
option) any later version. See [LICENSE](LICENSE).

All bundled dependencies are AGPL-3.0-compatible (MIT, BSD, or Apache-2.0).

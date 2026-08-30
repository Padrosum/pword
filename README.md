<div align="center">

**English** · [Türkçe](README.tr.md)

<img src="public/icon.svg" width="72" alt="Pword logo" />

# Pword

### Your documents never leave your device.

[![CI](https://github.com/Padrosum/pword/actions/workflows/ci.yml/badge.svg)](https://github.com/Padrosum/pword/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)

**Pword** is a simple, private document editor designed for students,
writers, and researchers. It runs in your browser — no account, no cloud,
no tracking. Everything you write is stored **only on your device**.

[**Open Pword**](https://pword.alihankarakus.com) ·
[What is it?](#what-is-it) ·
[Features](#features) ·
[Architecture](#architecture)

</div>

---

## What is it?

Pword is a writing tool that works without the cloud. You open it, start
writing; close the tab, come back the next day, and continue where you left
off. It doesn't try to be a Microsoft Word clone — it offers a fast, calm,
and original writing experience.

<div align="center">
  <img src="docs/screenshots/home.png" width="820" alt="Pword home screen — recent documents and new document" />
  <p><em>Home screen: recent documents, one click to start writing.</em></p>
</div>

<div align="center">
  <img src="docs/screenshots/editor.png" width="49%" alt="Pword editor — A4 page view, light theme" />
  <img src="docs/screenshots/editor-dark.png" width="49%" alt="Pword editor — dark theme, paper look preserved" />
  <p><em>Editor: real A4 page view · stays readable like paper even in dark mode.</em></p>
</div>

<div align="center">
  <img src="docs/screenshots/home-dark.png" width="820" alt="Pword home screen — dark theme" />
</div>

## Features

**Writing**

- Bold, italic, underline, strikethrough; text color and highlight
- Font (Serif / Sans / Mono) and point size selection
- Paragraph styles: Title, Subtitle, H1–H3, Normal
- Alignment: left, center, right, justify
- Bullet and numbered lists, nested lists, task lists
- Link, image, table, horizontal rule, page break
- Real A4 pagination: pages fill by height and flow one after another, like Word
- Live word / character / page count

**Documents**

- Automatic saving (after a pause) + manual save with `Ctrl/Cmd + S`
- Recent documents list; the document you were working on reopens when you return
- Rename, duplicate, delete — all local

**Files**

- **.docx import** — parsed entirely in the browser; unsupported formats
  don't silently disappear, you get notified
- **.docx export** — document structure is converted to a Word-compatible file
- **PDF / printing** — clean A4 output; the conversion happens on your device

**Privacy and offline**

- No account, no backend, no analytics, no telemetry
- Works fully offline after the first load; installable PWA
- No external resources are loaded, fonts included

> Pword is not "100% Word compatible" and doesn't claim to be. It handles
> common document structures predictably; if it skips something, it tells you.

## Where are your documents stored?

On your device. Documents are kept in your browser's IndexedDB database
(`pword`), which is schema-versioned and can safely evolve over time.
Autosave runs after a short pause; when the tab is hidden or closed, any pending
save is flushed. Normal navigation and refresh preserve pending changes, but a
browser or device crash can still interrupt a write before it reaches storage.

Imported `.docx` files are first converted to semantic HTML, then passed
through the ProseMirror schema: scripts, event listeners, or unsafe
`javascript:` links never leak into your document.

## Architecture

Pword is a fully static site — no backend, no API, no server-side document
processing.

| Layer | Technology |
| --- | --- |
| UI | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 (design tokens, dark theme) |
| Editor | TipTap / ProseMirror + real A4 pagination |
| Storage | IndexedDB (schema-versioned, `src/storage/`) |
| PWA | vite-plugin-pwa / Workbox |
| .docx | mammoth (import) · docx (export) — lazy-loaded |

```
src/
  app/         application shell
  components/  UI components (top bar, toolbar, home screen…)
  editor/      TipTap setup, custom nodes, pagination algorithm
  storage/     IndexedDB wrapper and repositories
  import/      .docx import
  export/      .docx export, printing
  pwa/         service worker registration
  hooks/       useAutosave, useTheme
  lib/         small helpers
  types/       document model types
  styles/      design tokens, editor typography, print styles
```

## Development

Requires Node.js 20+.

```bash
npm install
npm run dev        # dev server
npm test           # test suite (vitest)
npm run lint       # oxlint
npm run build      # type-check + production build (dist/)
npm run preview    # serves the production build
```

CI: lint + test + build run on every push and PR (`.github/workflows/ci.yml`).
Every push to `main` is deployed automatically to GitHub Pages
(`.github/workflows/deploy.yml`).

## The Padros family

Pword is a member of the Padros ecosystem — there is no technical connection,
only a shared philosophy and design language.

<div align="center">

[![Pmusic](https://img.shields.io/badge/Pmusic-6D28D9?style=for-the-badge)](https://pmusic.alihankarakus.com)
[![Pixora](https://img.shields.io/badge/Pixora-7C3AED?style=for-the-badge)](https://pixora.alihankarakus.com)
[![Ptree](https://img.shields.io/badge/Ptree-8B5CF6?style=for-the-badge)](https://alihankarakus.com)

</div>

## License

Copyright © 2026 Padros

This program is distributed and may be modified under the terms of the
**GNU Affero General Public License** (AGPL-3.0), version 3 or (at your
option) any later version. See the [LICENSE](LICENSE) file for details.

All bundled dependencies are AGPL-3.0-compatible (MIT, BSD, Apache-2.0).
The embedded fonts (Inter, Literata, Lora, Playfair Display, Open Sans,
JetBrains Mono) are licensed under the **SIL Open Font License 1.1** and are
served from the application itself, not from an external CDN.

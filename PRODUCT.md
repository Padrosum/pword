# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

<!-- inferred from README after init interview timed out; not user-confirmed -->
Primary audiences are students, writers, and researchers who need to draft and keep documents without creating an account or sending content to a cloud service. The shared job is: open the app, write calmly, leave, and resume later on the same device.

## Product Purpose

<!-- inferred -->
Pword is a browser-based document editor for private writing. Success means a person can start writing in seconds, keep work only on their device, reopen it later, and export or print when needed — without signup, sync, or tracking.

## Positioning

<!-- inferred -->
Documents never leave the device: storage is local IndexedDB, the app is a static PWA, and there is no backend. It is intentionally not a Microsoft Word clone; it offers a fast, calm writing surface with best-effort `.docx` round-trip and honest warnings when formatting is unsupported.

## Operating Context

<!-- inferred -->
- Home list of recent local documents; open / create / import / duplicate / delete
- WYSIWYG A4 page editor (TipTap / ProseMirror) with toolbar, autosave, and print/PDF
- Used on a personal browser/device; offline after first load
- Sibling Padros products (Pmusic, Pixora, Ptree) are ecosystem links only — no shared technical stack required

## Capabilities and Constraints

<!-- inferred from codebase and docs -->
**Capabilities**
- Rich text: emphasis, colors, highlight, fonts/sizes, headings, alignment, lists, tasks, links, images (base64), tables, horizontal rule, page break
- Real height-based A4 pagination
- Autosave (debounced) + Ctrl/Cmd+S; session restore for pending saves
- `.docx` import (mammoth) and export (`docx`); print / Save as PDF
- Light / dark theme; installable PWA; fonts bundled (no CDN)

**Constraints**
- No account, no server, no analytics/telemetry
- AGPL-3.0-or-later
- Not “100% Word compatible”
- Browser storage quotas apply (large images can fail saves)
- Crash before flush can still lose the last moments of typing

**Open (undecided)**
- Whether one audience (students vs writers vs researchers) should lead product decisions
- Product-specific accessibility standard or inclusion requirements
- Whether future work should deepen Word parity, long-document performance, backup/export packs, or other roadmap items as product commitments

## Brand Commitments

<!-- inferred from shipping assets and docs; visual system itself is out of scope for PRODUCT.md -->
- Product name: **Pword**
- Tagline in docs: “Your documents never leave your device” / “Dökümanınız cihazınızı terk etmesin”
- Voice: calm, direct, privacy-forward; bilingual public docs (English + Turkish)
- Mark: `public/icon.svg` (sage registration-mark tile with stylized “P”; Galley Proof Desk)
- License and copyright: Padros / AGPL-3.0

## Evidence on Hand

- Live product: https://pword.alihankarakus.com
- Screenshots: `docs/screenshots/` (home empty + with galleys, editor light/dark)
- Brand raster for GitHub: `docs/logo.png` (sage registration-mark tile)
- README: `README.md`, `README.tr.md`
- App source: `src/` (React 19 + Vite + TipTap + IndexedDB)
- Do not fabricate testimonials, user counts, benchmarks, or third-party endorsements

## Product Principles

1. **Local by default** — Never add cloud sync, accounts, or tracking that contradict the privacy promise.
2. **Calm over clone** — Prefer a focused writing tool over chasing full Word feature parity.
3. **Honest fidelity** — When import/export skips formatting, tell the user; don’t silently drop meaning.
4. **Returnable work** — Opening, saving, and resuming must feel reliable on a single device.
5. **Ship light** — Static, offline-capable, no external runtime dependencies for core writing.

## Accessibility & Inclusion

<!-- open — no product-specific standard confirmed -->
No accessibility standard or inclusion requirement was confirmed during init. Future UI work should still meet a reasonable baseline for keyboard use and readable contrast unless the owner sets a stricter bar.

---
name: Pword
description: Galley Proof Desk — local A4 writing on uncoated stock with sage registration accents.
colors:
  proof-ground: "#e4e2da"
  sheet-stock: "#f2f0e9"
  ink: "#1a1a18"
  muted-ink: "#5a564e"
  hairline: "#bdb7ab"
  hairline-strong: "#9e9789"
  sage: "#3f5244"
  sage-contrast: "#f2f0e9"
  sage-soft: "rgba(63, 82, 68, 0.1)"
  danger: "#8b3a2f"
  page-paper: "#faf9f4"
  page-highlight: "#e4d39a"
  page-placeholder: "#8a857a"
  page-edge: "rgba(26, 26, 24, 0.22)"
typography:
  headline:
    fontFamily: "Source Sans 3 Variable, IBM Plex Sans Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Source Sans 3 Variable, IBM Plex Sans Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Source Sans 3 Variable, IBM Plex Sans Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.625
  page-body:
    fontFamily: "Source Serif 4 Variable, Literata Variable, Georgia, serif"
    fontSize: "12pt"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "IBM Plex Mono, JetBrains Mono Variable, ui-monospace, Menlo, Consolas, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.08em"
rounded:
  none: "0px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "28px"
  xl: "40px"
  rail: "44px"
  status: "32px"
components:
  button-primary:
    backgroundColor: "{colors.sage}"
    textColor: "{colors.sage-contrast}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.sage}"
    textColor: "{colors.sage-contrast}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "40px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "#ffffff"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "36px"
  icon-button:
    backgroundColor: "transparent"
    textColor: "{colors.muted-ink}"
    rounded: "{rounded.none}"
    size: "32px"
  icon-button-active:
    backgroundColor: "{colors.sage-soft}"
    textColor: "{colors.sage}"
    rounded: "{rounded.none}"
    size: "32px"
  input-field:
    backgroundColor: "{colors.proof-ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "36px"
  select-field:
    backgroundColor: "{colors.sheet-stock}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    height: "28px"
    padding: "0 24px 0 8px"
  dialog-panel:
    backgroundColor: "{colors.sheet-stock}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "20px"
    width: "28rem"
  menu-panel:
    backgroundColor: "{colors.sheet-stock}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "4px 0"
  toast:
    backgroundColor: "{colors.sheet-stock}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "10px 16px"
---

# Design System: Pword

## Overview

**Creative North Star: "Galley Proof Desk"**

Pword is a private local writing tool rendered as a proof desk, not a marketing landing page and not a Word clone. Home is a short stack of galleys on uncoated stock; the Editor is the active proof — slim chrome around real A4 sheets. The room stays quiet: hairline borders, square corners, sage used sparingly as registration ink, and mono metadata for dates, counts, and locality.

Depth comes from paper on ground and a single soft page shadow, not from card stacks or glow. When the editor is focused, chrome dims slightly so the proof stays primary. Documents never leave the device; the visual system reinforces that with a Local status mark and restrained UI.

**Key Characteristics:**
- Uncoated proof ground (`#e4e2da` / `#f2f0e9`) with near-black ink (`#1a1a18`)
- Sage registration accent (`#3f5244`) on brand tile and rare interactive emphasis
- Hairline borders, square chrome, no purple
- UI grotesque (Source Sans 3) + page serif (Source Serif 4) + mono metadata (IBM Plex Mono)
- A4 proof sheets that stay paper-colored even when chrome goes dark

## Colors

Uncoated stock and sage registration ink — warm neutrals for ground and chrome, one cool-green accent for brand and focus.

### Primary
- **Sage Registration** (`{colors.sage}`): Brand mark tile, primary CTAs, focus outline, caret, links in the page, active tool states. Keep it scarce; its rarity reads as proof-desk ink, not a theme wash.

### Neutral
- **Proof Ground** (`{colors.proof-ground}`): App canvas behind home and editor scroll.
- **Sheet Stock** (`{colors.sheet-stock}`): Chrome surfaces — header, toolbar, status, dialogs, menus, toasts.
- **Ink** (`{colors.ink}`): Primary UI and page text.
- **Muted Ink** (`{colors.muted-ink}`): Supporting copy, icons at rest, status labels.
- **Hairline / Hairline Strong** (`{colors.hairline}`, `{colors.hairline-strong}`): Borders, dividers, ruled lists, blockquote rules.
- **Page Paper** (`{colors.page-paper}`): A4 sheet face — always light for writing comfort.
- **Page Highlight / Placeholder / Edge** (`{colors.page-highlight}`, `{colors.page-placeholder}`, `{colors.page-edge}`): Mark highlight, empty-state type, sheet hairlines in the pagination paint.

### Semantic
- **Danger** (`{colors.danger}`): Destructive actions and save/error status only.
- **Sage Soft** (`{colors.sage-soft}`): Hover washes and active tool fills — never a full-panel background.

### Named Rules
**The One Sage Rule.** Sage appears on the brand mark, primary actions, focus, and active tools — not as large fills or decorative gradients.

**The Paper Stays Paper Rule.** In dark theme, chrome may invert; the proof sheet (`{colors.page-paper}` / page ink) remains light for writing.

## Typography

**Display / UI Font:** Source Sans 3 Variable (fallback IBM Plex Sans Variable, system UI)
**Page Font:** Source Serif 4 Variable (fallback Literata Variable, Georgia)
**Label / Mono Font:** IBM Plex Mono (fallback JetBrains Mono Variable, system mono)

**Character:** Grotesque chrome for calm tools; serif only on the proof; mono for timestamps, stats, section labels, and locality — the language of a marked-up galley.

### Hierarchy
- **Headline** (600, `1.75rem`, tight tracking): Home “Proof desk” title.
- **Title** (600, `15px` / `text-sm`): Product name in chrome, document titles in lists, dialog titles.
- **Body** (400, `15px`, relaxed): Supporting UI copy on Home and dialogs.
- **Page body** (400, `12pt` / `1.65`): ProseMirror content on A4; headings scale from the page base (`doc-title` ~2.4em, h1 2em, h2 1.5em, h3 1.2em).
- **Label** (400, `11px`, uppercase, `0.08em`–`0.14em` tracking): “On this device”, “Recent galleys”, save state, status bar, footer meta.

### Named Rules
**The Mono Metadata Rule.** Dates, word counts, save state, Local, and section labels use IBM Plex Mono — never the page serif.

**The Serif-On-Paper Rule.** Source Serif 4 is reserved for document content inside `.ProseMirror`; chrome stays sans.

## Layout

Home is a single centered column (`max-w-2xl`) on proof ground: brand bar (44px), short intro stack, then a ruled “Recent galleys” list. Editor chrome is wider (`max-w-6xl`): 44px top bar, tool rail, scrollable A4 column, 32px mono status bar. Sheets are `21cm` wide, `29.7cm` tall, vertical margin `2.4cm`, horizontal margin `2.3cm`, gap `0.8cm` between sheets. Below ~900px, page width goes fluid with `20px` inline padding. Spacing rhythm favors `8px` / `16px` steps; primary CTA group sits ~`28px` below the intro.

## Elevation & Depth

Mostly flat tonal layering: sheet stock on proof ground, hairlines for structure. Soft page shadow under A4 sheets; dialogs and toasts use a single soft drop shadow for modality — not stacked card elevation.

### Shadow Vocabulary
- **Page** (`0 1px 0 rgba(26, 26, 24, 0.06), 0 10px 28px rgba(26, 26, 24, 0.08)`): Proof sheets on the desk.
- **Dialog** (`0 12px 40px rgba(26, 26, 24, 0.18)`): Modal panel over `bg-black/40`.
- **Toast** (`0 8px 24px rgba(26, 26, 24, 0.14)`): Transient status chips.

### Named Rules
**The Flat Chrome Rule.** Headers, rails, lists, and menus have no drop shadows — borders do the work.

**The Chrome Dim Rule.** Editor focus sets `--chrome-dim` to `0.72` on `.galley-rail` (180ms ease-out); restore to `1` when focus leaves.

## Shapes

Square corners everywhere in chrome (`border-radius: 0`). Hairline `1px` solid borders in hairline colors. Brand mark is a square sage tile with registration crosses and a light “P”. Focus rings are `1px` sage outlines with `2px` offset and square corners. Do not introduce pills, large radii, or soft cards for primary UI.

### Named Rules
**The Square Chrome Rule.** Buttons, inputs, dialogs, menus, and icon buttons are square. Micro radii inside page content (code chips) are content exceptions, not chrome language.

## Components

### Buttons
- **Shape:** Square (`0`)
- **Primary:** Sage fill, sage-contrast text, `h-10`, `px-5`, semibold; hover via opacity `0.9`
- **Secondary / Ghost:** Transparent with hairline border, ink text; hover `sage-soft`
- **Danger:** Danger fill, white text (black text in dark); used only for destructive confirm
- **Icon button:** `32×32`, muted ink; hover sage-soft + ink; active sage-soft + sage text

### Cards / Containers
Not used as a pattern. Lists are ruled rows under a mono header — no card chrome, shadow, or radius on galley items.

### Inputs / Fields
- **Title field (editor):** Transparent, centered; hover/focus draw hairline and canvas fill
- **Dialog fields:** Canvas fill, hairline border; focus border shifts to sage
- **Select:** Square hairline control `h-7`, `13px` sans; focus-within border sage

### Navigation
Slim surface bars with bottom/top hairlines. Home: BrandMark + “Pword” + theme. Editor: back, brand (sm+), editable title, save mono, theme, overflow menu. Tool rail is a horizontal icon/select strip on the same surface language.

### Menus & Dialogs
- **Menu:** Portaled surface panel, hairline border, `py-1`; items hover/focus sage-soft; danger items use danger text
- **Dialog:** Max `28rem`, hairline, `p-5`, soft dialog shadow over dimmed scrim

### Status / Toast
- **Status bar:** Mono `11px`, words · chars · pages · Local (`CloudOff` + label)
- **Toast:** Hairline surface chip; error variant uses danger text/border

### Brand Mark
Sage `#3f5244` square with light registration crosses and “P”; default `24px` (home), `20px` in editor chrome.

### Proof Sheet
Signature surface: painted A4 stack (`.pages` / `.page`) on canvas, page shadow, serif content, sage caret. Pagination is height-based; spacers and repeating gradients draw sheet edges.

## Do's and Don'ts

### Do:
- **Do** keep Home as a short galley stack: brand, “On this device” / Proof desk, Start writing + Import, ruled recent list.
- **Do** keep Editor as slim chrome + A4 proofs + mono status; dim rails while writing.
- **Do** use sage only as registration accent and primary action ink.
- **Do** put metadata in IBM Plex Mono and document body in Source Serif 4.
- **Do** preserve square corners and hairline borders on chrome.

### Don't:
- **Don't** introduce purple, indigo washes, or Padros-purple branding — the shipped mark is sage registration.
- **Don't** wrap galleys or tools in elevated cards or rounded pills.
- **Don't** turn Home into a marketing hero (stats strips, promo badges, full-bleed imagery).
- **Don't** invert the proof sheet in dark mode; only chrome adapts.
- **Don't** use display/marketing typography stacks; stay on Source Sans 3 / Source Serif 4 / IBM Plex Mono.

# Pword — why this desk exists

Pword is a **local-first document editor** that runs as a static web app. You open it, write on A4 sheets, and leave. The draft stays in **this browser on this device**. There is no Pword account, no Pword server, and no analytics pipeline waiting for your sentences.

This note is for people choosing a writing tool — not a feature checklist. For the product tour see [README.md](README.md) / [README.tr.md](README.tr.md).

---

## Highlights

| You get | What that actually means |
| --- | --- |
| **Local-first storage** | Documents live in IndexedDB (`pword`) on your machine. Closing the tab is not “uploading.” |
| **No account, no backend** | The deployed site is static files. Import, export, print, and save all run in the browser. |
| **No tracking** | No analytics, telemetry, or third-party fonts/CDNs. Typefaces ship with the app. |
| **Free software (AGPL-3.0)** | You can run, study, share, and change it. Network use of a modified version must keep the source available. |
| **Honest .docx** | Import/export happens on-device. Unsupported formatting is reported, not silently dropped. |
| **A4 on a desk** | Pages break by height, like a galley — not an infinite web scroll pretending to be Word. |
| **Offline after first load** | Installable PWA. Writing does not require Pword to be “up.” |
| **Calm chrome** | Light and dark desk, English / Türkçe UI, autosave + `Ctrl/Cmd+S`. |

What Pword is **not**: a collaboration suite, a cloud CMS, or a 100% Microsoft Word clone. If you need comments, live cursors, or corporate tenant sync, that is a different product class.

---

## Privacy, free software, local-first — vs common alternatives

Comparisons below are about **where text goes**, **who can read it**, **who owns the program**, and **whether the tool works without their cloud**. They are not performance benchmarks and not legal advice. Products change; verify current terms yourself.

| | **Pword** | **Google Docs** | **Microsoft 365 Word** | **Notion** | **LibreOffice Writer** | **CryptPad** |
| --- | --- | --- | --- | --- | --- | --- |
| **Where the draft lives** | Your browser (IndexedDB), this device | Google’s servers | Microsoft’s cloud (and/or local files if you use desktop Word that way) | Notion’s servers | Your files on disk | Encrypted blobs on a CryptPad server |
| **Account required** | No | Google account | Microsoft account for 365 | Notion account | No | Usually a pad/team on *a* server |
| **Operator can read your prose** | Pword has **no operator backend**. The browser vendor and anyone with device access still can. | Google processes content to run the service (see their terms/privacy policy) | Microsoft processes cloud documents to run 365 | Notion holds workspace content | Nobody remote unless you put the file somewhere | Server sees ciphertext; keys stay with users in the CryptPad model |
| **Telemetry / tracking** | None in Pword | Product analytics and account graph are part of the Google account world | Microsoft 365 diagnostic and connected-experience settings exist | SaaS product analytics are typical | Desktop app; you control network features | Instance-dependent; the *model* is E2E, not “no server” |
| **Works fully offline** | After first load (PWA) | Limited / cache-dependent | Desktop Word can; browser Word needs their stack | Limited | Yes (desktop) | Needs the instance when you are not fully cached |
| **Install** | URL or PWA — no desktop installer | Browser | Heavy suite or web app | Browser | Desktop (or online forks) | Browser against a server |
| **License of the editor** | **AGPL-3.0-or-later** | Proprietary | Proprietary | Proprietary | MPL-2.0 (free software) | AGPL (CryptPad itself is free software) |
| **Collaboration** | Single device, single writer | Real-time, sharing, comments | Real-time (cloud) | Real-time workspace | Files / optional extra stacks | Real-time, E2E pads |
| **Word-like pages** | Real height-based A4 galleys in the browser | Paginated view is a mode on a cloud doc | Full pagination and layout | Blocks, not print galleys | Full desktop pagination | Docs vary by app in the suite |

### How to read that table

**Privacy.** Pword’s promise is narrow and strict: **we never receive your document**, because there is no “we” on the network path. That is stronger than “encrypted in transit to our API.” It is weaker than a threat model that includes a stolen laptop, a malicious browser extension, or disk imaging — IndexedDB is not a vault. Use OS disk encryption; don’t treat a static site as end-to-end crypto.

**LibreOffice.** Closest cousin on **freedom + local files**. Writer is the right tool for long, complex, print-production documents and for people who already live in `.odt`. Pword is the right tool when you want that *local* feeling **inside a tab**, with no installer and a calmer surface. Both are legitimate; they are different desks.

**CryptPad.** Closest cousin on **AGPL + not-Google**. CryptPad is built for **sharing without trusting the host** (E2E). Pword is built for **not having a host**. If you need a link to a co-author, CryptPad (or another E2E collab tool) wins. If you need the file to never leave the machine you are sitting at, Pword wins.

**Google Docs / 365 / Notion.** Excellent at sync, comments, and “open this on another laptop.” That convenience **is** the privacy trade: your sentences become someone else’s service data. Pword refuses that trade on purpose.

---

## Featured capabilities (the ones that match the stance)

1. **Start in one click** — no signup wall.
2. **Autosave on this device** — pause, `Ctrl/Cmd+S`, or leave the tab; pending writes flush on hide/close when the browser allows it.
3. **Import / export `.docx` in the tab** — mammoth in, `docx` out; warnings when the mapping is lossy.
4. **Print / Save as PDF** — the sheet you see is the sheet that prints.
5. **PWA** — install next to other apps; keep writing on a train.
6. **Inspectable stack** — React, TipTap/ProseMirror, IndexedDB. You can read every line. AGPL keeps derivatives honest on the network.

---

## Who it is for

Students, researchers, and writers who want a **private draft** that still looks like a page — essays, notes, letters, galleys — on a personal browser.

## Who should pick something else

- Teams that must comment in parallel → Docs, 365, CryptPad, etc.
- Layout-heavy books, mail merge, macros → LibreOffice or desktop Word
- Markdown knowledge bases with plugins → Obsidian and friends (local-first, different medium)
- “I need the same doc on every device without me moving a file” → a sync product (and its privacy cost)

---

## Copy you can reuse

**One liner.** Your documents never leave your device.

**Short.** Pword is an AGPL, local-first A4 editor in the browser. No account, no cloud, no tracking.

**Contrast.** Other suites rent you a server. Pword is a desk.

---

## Türkçe özet

Pword, **hesapsız, sunucusuz, telemetrisiz** bir belge editörüdür. Taslak **bu tarayıcıda, bu cihazda** kalır (IndexedDB). Lisans **AGPL-3.0**: özgür yazılımdır.

- **Google Docs / Microsoft 365 / Notion:** senkron ve yorum için güçlüdür; metin onların hizmetine gider.
- **LibreOffice Writer:** hem özgür hem yerel dosya — ağır, kurulan bir masaüstü. Pword aynı *yerellik* hissini **sekmede**, kurulum olmadan ister.
- **CryptPad:** uçtan uca şifreli **paylaşım** (yine bir sunucu vardır). Pword’de paylaşılacak sunucu yoktur; tek cihaz, tek yazar.

Pword “çalıntı laptopa karşı kasa” iddiası taşımaz. Vaadi nettir: **Pword’e giden bir kopya yoktur, çünkü Pword’ün arka ucu yoktur.**

Canlı: [pword.alihankarakus.com](https://pword.alihankarakus.com)

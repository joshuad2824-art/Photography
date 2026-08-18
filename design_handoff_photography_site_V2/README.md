# Handoff: Joshua Davis Photography site

## Overview
A personal photography site for Joshua Davis (Tulsa, OK), styled as a keepsake drawer on a worn wooden desk — tilted photo prints, tape strips, hand-written captions, and paper "notes" signed by Joshua. Four pages: **Home**, **Galleries**, **Your Session** (client gallery), and **About**. Built on the Timber & Ink design system, with a lightweight inline text/photo editor for Joshua to update copy himself.

## About the design files
The files in `design/` are **design references built in HTML** — working prototypes showing exact layout, copy, and interaction, not production code to copy directly. The task is to **recreate this design in the target codebase's environment** (framework TBD — see Tech stack) as real pages/routes, matching these prototypes pixel-for-pixel.

Note: this project also contains an earlier, differently-architected prototype (a single consolidated app with an album-management admin dashboard) and two older full-site drafts. Those were **superseded** — only the four files listed below are in scope for this handoff.

## Fidelity
**High-fidelity.** Colors, type, spacing and copy below are final; recreate pixel-perfectly.

## Tech stack
Not yet decided by the client. If nothing else drives the choice, a small full-stack framework with API routes/server functions (e.g. Next.js) fits well — the site is mostly static pages but needs a couple of server-side checks (see Data & backend notes). Confirm with the client before committing.

## Pages
Each page is presently its own standalone HTML file linking to the others by filename (no client-side router). Recreate as four real pages/routes sharing one layout (header + footer).

### Global header & footer (every page)
**Header**: wordmark "JOSHUA DAVIS" (Bevan, uppercase) linking home, hand-written tagline "photographs, mostly close to home" (Grape Nuts) underneath. Nav: Home / Galleries / Your Session / About — sentence-cased small-caps labels, active item underlined in amber. Collapses to a "Menu ▾" button below 720px that opens a rotated cream dropdown card (a torn-tape strip decorates its corner). Below the header: a 2px cream rule + a fainter 1px rule underneath.

**Footer**: wordmark repeat, contact line ("Tulsa, Oklahoma · Timberandink@outlook.com"), hand-written sign-off ("made in spare moments") — both editable text. A large brass line-engraving (moose + puffin) bleeds off the right edge at ~40% opacity. Below that, a thin admin bar: when logged out, a small "Admin" text button reveals an inline password field + "Sign in"; when logged in, a note reading "Editing as admin — click any text to change it" plus "Log out".

### 1. Home (`Joshua Davis Journal Dark.dc.html`)
- **Hero**: a tilted (-1.3°) taped photo print (cream mat, heavy drop shadow) with a hand-written caption ("Two days of walking for four minutes of light.") and a dark "Aug 2026" plate badge in its corner.
- **Intro** beside it: cream/tan badge "Tulsa, Oklahoma", H1 "A drawer full of ordinary hours" (Playfair 700, clamp 34–54px), a hand-written line (Grape Nuts, ~23–29px), a body paragraph (16px/1.62, max 40ch), two buttons ("Look through the galleries" primary, "I have a passphrase" secondary), and a small tilted badge "No prints for sale · no mailing list".
- **"Pasted in lately"**: section title + hand-written aside ("newest on top, as always"), hairline rule, then 3 tilted taped photo cards (each independently rotated ±1.5°) with a hand-written one-line caption and a dark "Plate NN · place" badge; hover lifts and un-tilts slightly. A hand-written link "the rest of the drawer →" points to Galleries.
- **A note before you look**: a paper card (cream, drop shadow, faint vertical margin rule + horizontal ruled lines like a legal pad) with a dark badge, a hand-written paragraph, and "Joshua" signed in script.
- **CTA band** (paper stock, `#EFEADC`): eyebrow badge "IF WE DID A PHOTOSHOOT TOGETHER", H2 "Your gallery is waiting", hand-written body; beside it a cream card with a Passphrase field + full-width "Open my gallery" button (checks against the fixed word list — see Data notes).

### 2. Galleries (`Joshua Davis Galleries.dc.html`)
Two views in one page, toggled by client-side state (no separate URL):
- **Index ("The drawer")**: H1 + hand-written aside ("no filing system to speak of"), intro paragraph, then a CSS-columns masonry of 5 tilted taped photo cards (each a different rotation/width/offset for a scattered-pile feel), each with a title (Playfair), a hand-written line, and a dark badge + mono date/category line. Clicking a card opens its album. Footer row: a hand-written note pointing to "Open a private gallery" (Your Session).
- **Album detail**: "← back to the drawer" link, H1 + a cream "N prints · years" badge, a hand-written note, then a masonry of that album's tilted photos (each opens a full-screen lightbox with prev/next arrows, a hand-written caption, plate number and a fake EXIF line). 5 albums exist: Above the treeline, Downtown/waiting, Weather I stood in, The people I live with, Odds and ends.

### 3. Your Session (`Joshua Davis Your Session.dc.html`)
- **Locked**: badge "A private drawer", H1 "Your gallery is waiting", hand-written line, body paragraph, contact line; beside it a tilted cream card (tape strip corner) with a "The word I sent you" prompt, passphrase input, inline error text, and "Open my gallery" button.
- **Unlocked**: client name as H1 ("The Hartleys") + hand-written line, two badges (shoot meta + files-expire-on date), "Close the drawer" to relock; action row: "Download all full-size", "Copy a link for family", and a "Show only kept" filter toggle; a toast-style status line; then a masonry of 8 photos, each with a "Keep this one" toggle and a per-photo "Download" action; a signed paper note at the bottom.

### 5. Admin — the desk drawer (`Joshua Davis Admin.dc.html`) — NEW 2026-08-18
Back-of-house page, **not in the nav** — reached only from the footer's Admin control. Signed out it shows a short gate ("This part of the desk is mine"). Signed in: an embossed-tape "Back of house" label, H1 "The desk drawer", and two tabs (design-system `Tabs`, `tone="dark"`).

**Tab 1 — My photographs** (the public albums, `lib/galleries.ts` today)
- Album list: cover thumbnail, name, `{n} photographs · {sub}`, a **Live / Draft** badge, `↑ ↓` to change which album shows first on Galleries, then **Edit** and **Publish it / Take it off the site**.
- Album editor (paper worksheet, legal-pad margin rule): *Album name*, *The line under the title*, a drag-and-drop upload zone, then one row per photograph — **plate number** (`IMG 4412`), **hand caption**, **Cover** toggle, **Home** toggle, `‹ › ×` for order and removal.
- **Home** puts a photo in "Pasted in lately" on the home page and is capped at **3** (that's what the home layout holds); a fourth attempt says so rather than silently replacing one.
- New albums save as **drafts** — nothing reaches the public site until published. Captions are editable here *and* by clicking them on the live page.

**Tab 2 — Client galleries** (the private per-shoot galleries, `lib/client-sessions.ts` today)
- One paper card per gallery: client name, `{n} photographs · shot {date}`, the word that opens it, and an expiry badge that flips to dark "Taken down {date}" once past its date.
- **Edit**, **Copy the link** (the family link that opens the gallery without the word), **Take it down** with an inline confirm ("The word stops working straight away").
- Worksheet: *Client name*, *The word that opens it*, *Shoot date*, *Files here until* (defaults **60 days** out), upload zone, thumbnails with `‹ › ×`.

Tweaks on the page: default expiry in days, hide taken-down galleries, worn-desk texture, footer engraving.

**Not yet real:** records live in page state only. This screen is the design for what should write to `lib/client-sessions.ts` / `lib/galleries.ts` (album order, draft flag, cover, plate, caption, home-page picks are all new fields the current server model doesn't carry). Uploads use `URL.createObjectURL` for the prototype — the real path is the image endpoint.

### 4. About (`Joshua Davis About.dc.html`)
- Tilted taped portrait photo (or a "Portrait coming soon" placeholder — admin can hover-replace it) with a mono caption.
- Beside it: badge "Tulsa, Oklahoma", H1 "The person behind the camera", hand-written line, body paragraph.
- A signed paper note (3 hand-written paragraphs + "Joshua").
- "What's in the bag": a paper card with a hand-written intro and 5 dark tag chips (lens/gear notes).
- "back to the drawer →" hand-written link to Galleries.

## Interactions & behavior
- Navigation between pages is plain links (real page loads), not a SPA router.
- Galleries' index↔album and Your Session's locked↔unlocked are client-side view-state toggles within their own page.
- Passphrase check (Home CTA, Your Session gate): case-insensitive match against a **fixed, hardcoded word list** (`hartley`, `cottonwood`, `fellowship`) — see gap below.
- Lightbox in Galleries: click a photo to open, arrow keys / on-screen arrows to navigate, Escape or × to close.
- "Keep this one" toggles are local UI state only (not persisted); "Download all", per-photo "Download", and "Copy a link" are demo stubs that just show a status message — no real files move.
- Responsive breakpoint at 720px (header collapses to a menu button; card layouts reflow).
- Motion: short, weighted transitions on hover only (card lift, tilt easing) — no bounce, no auto-playing animation.
- **Inline admin editing**: logging in via the footer's Admin control makes every labelled text block on the page (and the About portrait) directly editable in place — no separate CMS screen.

## State management & data
**Built as of 2026-08-18** — the Next.js implementation in this repo moved admin auth, the copy store, client galleries and downloads to the server; the notes below describe the prototype these pages still are, kept as the design record. See the root `README.md` for what shipped.

Everything in these prototype files is a client-side demo, not a real data layer:
- **Text/photo editing** (`cms.js`) stores edited copy in `localStorage` under fixed ids, and the one replaceable image (About portrait) as a base64 data URL in `localStorage`. Nothing syncs across devices or browsers, and there's no edit history.
- **Admin auth** is a single shared password (default `"lamplight"`) compared client-side in `cms.js`, with a plain `localStorage` flag marking the browser as "signed in." Per the client's direction (simple shared password, no accounts), this should move to a server-side check (env var + httpOnly session cookie) rather than living in the client bundle.
- **Client galleries — the biggest gap.** The passphrase list (`hartley`, `cottonwood`, `fellowship`) is identical and hardcoded across the Home CTA and the Your Session gate, and entering *any* of them always reveals the same fixed demo set of 8 stock photos ("The Hartleys"). There is currently **no real mapping from a passphrase to a specific client's actual photos.** Building this for real needs: a record per client session (name, date, passphrase, its own photo set, an optional expiry date — the "Files here until Oct 3" badge is already designed for this), a server-side passphrase check, and real photo storage/delivery.
- **Galleries content** (the 5 albums and their photos) is hardcoded in the page's JS and currently reuses the same 5 stock photos across every album — needs a real content model once Joshua has real photos to sort into piles.
- **Downloads** ("Download all full-size", per-photo "Download", "Copy a link for family") are demo-only stubs; needs real file storage and either signed URLs or a zip-on-demand endpoint once there are real files to serve.

## Design tokens
- **Palette**: near-black teal desk background (`#0b1a1b` page / `#0d1f20` content), warm amber accents (`#C6862F` links and hand-written text, `#D9A354` for hand-written highlights), cream photo mats and cards (`#fffdf6`), paper-note stock (`#f3efe2` / `#EFEADC`), dark "leather" badges (linear-gradient `#31403d → #1e2a28 → #182220` with cream text) and light "ivory" badges (linear-gradient `#e8e3d2 → #d6d0bc → #cbc4ae` with dark text).
- **Type**: **Bevan** for the wordmark; **Playfair Display** 700 for headings; **Grape Nuts** (a hand-lettering face) used extensively for asides, captions, CTAs-adjacent copy, and signatures — this is the site's signature typographic device, used far more heavily than a typical editorial page; **Archivo** for nav/labels/small caps; **Courier Prime** for plate numbers, EXIF-style metadata, and admin UI text; body copy is **Spectral** (`--font-body` in the design system's `tokens/typography.css`) — the implementation guessed EB Garamond because the token files weren't in the drop, so swap that import.
- **Texture & motif**: a repeating desk-grain image plus a "worn" overlay behind all content; every photo is presented as a tilted (±0.5–2°), taped-corner print on a cream mat with a heavy soft shadow (`0 22–26px 44–54px rgba(0,0,0,0.5)`); paper notes use a faint vertical margin rule + horizontal ruled lines to read as a legal pad; corner "tape" is a small rotated rectangle built from repeating-linear-gradient (torn-paper texture), positioned at random-feeling angles per card.
- **Radii**: small (3px) on badges and inputs; photo mats and cards are square-cornered (0).
- **Spacing**: content max-width 1120px; section padding scales with `clamp()` (roughly 22–46px depending on viewport); breakpoint at 720px.
- Full token values (fonts, complete color ramps, spacing) are in the client's Timber & Ink design system CSS — reference that directly.

## Assets
- `assets/photos/` — 5 real photographs, reused across Home, both Galleries albums, and Your Session's demo set (not enough distinct photos yet for 5 separate real albums).
- `assets/graphics/engraving-moose-puffin.png` — brass line-engraving used in every page's footer.
- `assets/textures/desk-grain.png`, `desk-wear.png` — the repeating grain and worn-desk overlays behind every page's background.
- Fonts and full design tokens come from the client's Timber & Ink design system.

## Files
- `design/Joshua Davis Journal Dark.dc.html` — Home.
- `design/Joshua Davis Galleries.dc.html` — Galleries (index + album detail + lightbox).
- `design/Joshua Davis Your Session.dc.html` — client gallery (locked + unlocked).
- `design/Joshua Davis About.dc.html` — About.
- `design/Joshua Davis Admin.dc.html` — the admin page: My photographs + Client galleries (**new**).
- `design/cms.js` — the inline-editing shim all four pages load (admin auth + text/image store; prototype-only, see Data notes).
- `screenshots/` — 01 home, 02 galleries index, 03 album detail, 04 session locked, 05 session unlocked, 06 about, 07 admin / my photographs, 08 admin / album editor, 09 admin / client galleries.

## What the build still needs (from the admin design)
- **Public albums need a content model**, not a hardcoded list: album `name`, `sub`, `order`, `live` (draft/published), `cover`, and per-photo `plate`, `caption`, `home` (in "Pasted in lately", max 3).
- **Client galleries need create/edit/delete**, plus the family-link mint already implemented server-side surfaced as "Copy the link".
- **Image upload** for both — the one gap the original handoff left open. Joshua uploads from a MacBook, a few times a year, 20–40 photographs per album.
- Admin routes must sit behind the same signed cookie as `/api/admin/*`; the page itself should 404 or gate server-side, not just hide its contents.

## Fixes folded back from the build (2026-08-18)
- **Header stacking**: the header is `z-index:5` (was 3, level with the page sections), so the narrow-width menu dropdown is no longer painted over.
- **Paper-stock controls**: the Your Session locked card carries `data-stock="paper"`, which flips the design system's primary action from bone-cream to deep teal. Without it a cream button sat on a cream card and read as invisible (see `screenshots/04-session-locked.png`).
- The narrow-width menu was already right-anchored in these files; the build matches.

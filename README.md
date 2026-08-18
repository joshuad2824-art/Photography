# Joshua Davis Photography

A personal photography site for Joshua Davis (Tulsa, OK), built from the design
handoff in [`design_handoff_photography_site/`](design_handoff_photography_site/README.md).
Four pages — Home, Galleries, Your Session, About — on the Timber & Ink design
system: a worn wooden desk, taped photo prints, hand-written captions and paper
notes signed by Joshua.

```bash
cp .env.example .env.local   # fill in SESSION_SECRET and ADMIN_PASSWORD
npm install
npm run dev                  # http://localhost:3000
```

The demo gallery opens with the passphrase `cottonwood` (also `hartley`,
`fellowship`). The footer's **Admin** control takes the value of
`ADMIN_PASSWORD`.

## Stack

Next.js (App Router) + TypeScript, no CSS framework. The handoff left the stack
to the client and suggested "a small full-stack framework with API routes" if
nothing else drove the choice; nothing did, so this is Next.js. Everything the
site needs beyond static pages — the passphrase check, admin auth, the copy
store, downloads — is a route handler in `app/api/`.

Styling follows the prototypes: layout values live inline next to the markup,
mirroring the design files, with shared primitives in `lib/tokens.ts` and the
rules inline styles can't express (hover, focus, media queries) in
`app/globals.css`.

## Layout

```
app/
  layout.tsx            fonts + document shell
  page.tsx              Home            → components/pages/HomeView.tsx
  galleries/page.tsx    Galleries       → components/pages/GalleriesView.tsx
  session/page.tsx      Your Session    → components/pages/SessionView.tsx
  about/page.tsx        About           → components/pages/AboutView.tsx
  api/                  admin auth, copy store, gallery gate, downloads
components/
  Shell.tsx             server half of a page: reads copy + admin cookie
  SiteProvider.tsx      client context for copy, admin state, inline saves
  SiteFrame.tsx         desk background, header, footer
  Editable.tsx          one block of inline-editable copy
  ui.tsx                Button / Input / Field
lib/
  tokens.ts             style primitives from the prototypes
  content.ts            every editable string and its shipped default
  galleries.ts          the five public albums and their photographs
  client-sessions.ts    per-shoot private galleries
  auth.ts               admin + gallery cookies, family share links
  store.ts              JSON-file persistence
```

Navigation between pages is plain links and real page loads, as the handoff
specifies. Galleries' index↔album and Your Session's locked↔unlocked stay
in-page state changes with no URL of their own.

## What moved to the server

The prototype kept everything in the browser. Three things the handoff flagged
now run server-side:

**Admin auth.** One shared password from `ADMIN_PASSWORD`, compared in
`lib/auth.ts` and answered with a signed, httpOnly cookie. Login is
rate-limited. No password ships in the bundle.

**Edited copy.** `PUT /api/content` writes to the store on blur, so an edit made
on Joshua's laptop shows up on his phone. Ids match the prototype's
`JDCms.text()` keys. Reverting a block to its shipped default drops the
override rather than storing a duplicate. The About portrait uploads to
`data/uploads/` and is served from `/api/images/about.portrait`.

**Client galleries.** `lib/client-sessions.ts` is a record per shoot — name,
date, expiry, its own photographs, and the words that open it, stored as salted
hashes. `POST /api/session/unlock` checks the word on the server and issues a
cookie that expires with the gallery; the word list never reaches the browser,
and a client can only ever load their own photographs. "Keep this one" persists
to that record, so Joshua sees which frames were picked.

Downloads are real: `/api/session/photo/[id]` serves one original,
`/api/session/download-all` streams a stored (uncompressed) zip, and "Copy a
link for family" mints a signed link that opens the same gallery without the
word.

Seed data reproduces the prototype exactly — one gallery, "The Hartleys", with
all three demo passphrases pointing at it. Adding a real shoot means adding a
record.

## Configuration

| Variable | Required | Notes |
| --- | --- | --- |
| `SESSION_SECRET` | yes in production | Signs both cookies. 32+ random characters. |
| `ADMIN_PASSWORD` | yes in production | The footer's Admin control. |
| `DATA_DIR` | no | Where the store and uploads are written. Defaults to `./data`. |

Both required variables throw at startup in production rather than falling back
to a development default.

`DATA_DIR` must point at a persistent, writable volume. The JSON store is
process-local: it serialises its own writes, but two instances behind a load
balancer would not see each other's. One instance is right for this site's
traffic; more than one means moving `lib/store.ts` to a database.

## Notes on fidelity

The design system's own CSS was not part of the handoff — the prototypes link
`_ds/timber-ink-…/tokens/*.css`, which the drop doesn't include — so two things
are reconstructions rather than copies:

- **The body face.** The handoff names Bevan, Playfair Display, Grape Nuts,
  Archivo and Courier Prime, but not the body serif. This uses **EB Garamond**,
  the closest match to the handoff screenshots. Swap the `EB_Garamond` import in
  `app/layout.tsx` when the real token file turns up.
- **Button, Input and Field.** Rebuilt from the screenshots. On paper stock the
  primary button inverts to dark ink on cream: the design-system default is a
  cream fill, which on a cream card renders as an all-but-invisible button (you
  can see this in `screenshots/01-final.png`).

Two layout fixes the prototypes needed at narrow widths: the menu dropdown is
anchored to the right of the header so it can't run off the left edge, and the
header sits above the page sections so the open dropdown isn't painted over.

## Still open

- The five public albums reuse the same five photographs, as in the handoff.
  `lib/galleries.ts` is where real ones go.
- Photographs are served from `/public`. Real client galleries with real volume
  want object storage and signed URLs; `lib/client-sessions.ts` already carries
  a per-photo file path for that.
- There is no admin screen for creating client galleries — records are added to
  the seed in `lib/client-sessions.ts` or edited in the store directly.

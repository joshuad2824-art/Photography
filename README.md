# Joshua Davis Photography

A personal photography site for Joshua Davis (Tulsa, OK), built from the design
handoff in [`design_handoff_photography_site_V2/`](design_handoff_photography_site_V2/README.md).
Four public pages — Home, Galleries, Your Session, About — plus a back-of-house
admin page, on the Timber & Ink design system: a worn wooden desk, taped photo
prints, hand-written captions and paper notes signed by Joshua.

```bash
cp .env.example .env.local   # fill in SESSION_SECRET and ADMIN_PASSWORD
npm install
npm run dev                  # http://localhost:3000
```

The demo galleries open with `cottonwood`, `fellowship` or `sycamore`. The
footer's **Admin** control takes the value of `ADMIN_PASSWORD`; signing in adds
a link to **the desk drawer** at `/admin`.

## Stack

Next.js (App Router) + TypeScript, no CSS framework. The handoff left the stack
to the client and suggested "a small full-stack framework with API routes" if
nothing else drove the choice; nothing did. Everything beyond static pages —
the passphrase check, admin auth, the copy store, uploads, downloads — is a
route handler in `app/api/`.

Styling follows the prototypes: layout values live inline next to the markup,
with shared primitives in `lib/tokens.ts` and the rules inline styles can't
express (hover, focus, media queries) in `app/globals.css`.

## Layout

```
app/
  layout.tsx            fonts + document shell
  page.tsx              Home            → components/pages/HomeView.tsx
  galleries/page.tsx    Galleries       → components/pages/GalleriesView.tsx
  session/page.tsx      Your Session    → components/pages/SessionView.tsx
  about/page.tsx        About           → components/pages/AboutView.tsx
  admin/page.tsx        The desk drawer → components/pages/AdminView.tsx
  api/                  admin auth, copy store, albums, galleries, uploads,
                        photo delivery, downloads
components/
  Shell.tsx             server half of a page: reads copy + admin cookie
  SiteProvider.tsx      client context for copy, admin state, inline saves
  SiteFrame.tsx         desk background, header, footer
  Editable.tsx          one block of inline-editable copy
  ui.tsx                Button / Input / Field / Tabs
  admin/                the two admin tabs and the upload zone
lib/
  tokens.ts             style primitives from the prototypes
  scatter.ts            the scattered-pile geometry
  content.ts            every editable string and its shipped default
  album-types.ts        the album model, shared by client and server
  albums.ts             the album store
  client-sessions.ts    per-shoot private galleries
  uploads.ts            photograph intake
  auth.ts               admin + gallery cookies, family share links
  store.ts              JSON-file persistence
```

Navigation between pages is plain links and real page loads, as the handoff
specifies. Galleries' index↔album and Your Session's locked↔unlocked stay
in-page state changes with no URL of their own.

## The desk drawer

`/admin` is back of house: not in the nav, reached from the footer's Admin
control. Signed out it shows the gate and nothing else — the server hands the
page empty arrays, so no album name, client name or word is in the payload at
all.

**My photographs** lists the public albums with a cover thumbnail, a Live/Draft
badge, `↑ ↓` for the order they appear on Galleries, Edit, and Publish it /
Take it off the site. The editor is a paper worksheet: album name, the line
under the title, a drag-and-drop upload zone, then one row per photograph with
a plate number, a hand-written caption, **Cover**, **Home** and `‹ › ×`.

**Home** puts a photograph in "Pasted in lately" and is capped at three —
that's what the home layout holds. A fourth pick is refused, in the browser and
again on the server, rather than quietly bumping someone out.

New albums save as drafts. A draft is invisible on Galleries *and* its uploaded
photographs 404 for anyone but Joshua, so nothing leaks before he publishes.

**Client galleries** is one paper card per shoot: name, `{n} photographs · shot
{date}`, the word that opens it, and an expiry badge that flips to a dark
"Taken down {date}" once past its date. Edit, Copy the link (the family link
that opens the gallery without the word), and Take it down behind an inline
confirm. New galleries default to files coming down 60 days out.

Album titles, the hand-written lines and photo captions are editable from the
worksheet **and** by clicking them on the live page.

## What runs on the server

**Admin auth.** One shared password from `ADMIN_PASSWORD`, compared in
`lib/auth.ts` and answered with a signed, httpOnly cookie. Login is
rate-limited. No password ships in the bundle, and every `/api/admin/*` route
starts by checking the cookie.

**Edited copy.** `PUT /api/content` writes to the store on blur, so an edit
made on Joshua's laptop shows up on his phone. Ids match the prototype's
`JDCms.text()` keys. Album and gallery copy lives in its own record instead of
the copy store, which is why the same caption is editable in both places.

**Client galleries.** `lib/client-sessions.ts` is a record per shoot — name,
shoot date, expiry, its own photographs, and the word, stored as a salted hash.
`POST /api/session/unlock` checks the word on the server and issues a cookie
that expires with the gallery; a client can only ever load their own
photographs, and those are served through the gated route rather than the
image optimiser, which fetches without cookies.

**Uploads.** `POST /api/admin/upload` takes full-size frames off the card,
rotates by EXIF, caps the long edge at 3200px, re-encodes, and stores by
content hash, so the same frame uploaded twice costs one file.

Downloads are real: `/api/session/photo/[id]` serves one original (or renders
it inline for the gallery), `/api/session/download-all` streams a stored
(uncompressed) zip, and "Copy a link for family" mints a signed link.

## Configuration

| Variable | Required | Notes |
| --- | --- | --- |
| `SESSION_SECRET` | yes in production | Signs both cookies and seals the stored words. 32+ random characters. |
| `ADMIN_PASSWORD` | yes in production | The footer's Admin control. |
| `DATA_DIR` | no | Where the stores and uploaded photographs are written. Defaults to `./data`. |

Both required variables throw at startup in production rather than falling back
to a development default. Changing `SESSION_SECRET` signs everyone out and makes
stored words unreadable in the admin listing — the galleries still open, since
the passphrase check goes through the hash.

`DATA_DIR` must point at a persistent, writable volume: it holds the album and
gallery records, the edited copy, and every uploaded photograph. The JSON store
is process-local — it serialises its own writes, but two instances behind a
load balancer would not see each other's. One instance is right for this site's
traffic; more than one means moving `lib/store.ts` to a database and the
uploads to object storage.

Records written by the first build are migrated on read (that version stored a
rendered "March 2026 · 24 frames" string rather than the shoot date). The word
itself was only ever hashed there, so a migrated gallery shows no word until
Joshua sets a new one.

## Deploying

**Live at https://photography.fly.dev.** One machine with a persistent disk,
built from the `Dockerfile` here and configured for Fly.io in `fly.toml`. `DATA_DIR` is a mounted volume at `/data`,
`/api/health` fails the host's check if that volume ever stops being writable,
and the image is Next's `standalone` output running unprivileged.

Deploying a change is **merging to `main`**.
`.github/workflows/ci.yml` typechecks, runs `next build` and builds the
container on every pull request, and deploys only if all three pass.

The one-time setup is by hand, because it needs a Fly account and two secrets
that should never pass through CI. [`docs/DEPLOY.md`](docs/DEPLOY.md) is the
runbook — creating the app, the secrets, the volume and the deploy token,
pointing a domain at it, and what day two looks like. The short version, once
`flyctl` is installed:

```bash
fly apps create photography
fly secrets set SESSION_SECRET="$(node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))')" ADMIN_PASSWORD='...'
fly volumes create jd_data --region dfw --size 10
fly tokens create deploy -x 8760h   # → GitHub repo secret FLY_API_TOKEN
fly deploy
```

Nothing in the application knows about Fly, so the same image runs anywhere
that can mount a disk. What it cannot run on is a platform with an ephemeral
filesystem — that needs the store moved to a database and the uploads to
object storage first.

**This site runs as exactly one instance.** The JSON store is process-local and
the rate limiter is in memory; both are right for one machine and wrong for
two.

## Notes on fidelity

The design system's own CSS was not part of either drop — the prototypes link
`_ds/timber-ink-…/tokens/*.css`, which isn't included — so the Button, Input,
Field and Tabs controls are rebuilt from the screenshots. On paper stock the
primary button inverts to deep teal, which is what the V2 handoff's
`data-stock="paper"` note asks for.

Two things the data model changes, deliberately:

- **The pile scatter is generated, not authored.** Every card's rotation, width
  and offset used to be typed per card. The admin has no controls for them and
  shouldn't, so `lib/scatter.ts` cycles the handoff's values by position — the
  seeded albums land where they were drawn, and a new pile gets the same feel.
- **"Pasted in lately" is data.** The three home-page prints used to be their
  own hardcoded cards; they're now whichever photographs carry the **Home**
  flag, in album order.

## Still open

See [ROADMAP.md](ROADMAP.md) for what needs doing next and in what order. The
hosting question is settled and the deploy config is in the tree; the next
thing that matters is a backup of `DATA_DIR` somewhere off the box, before a
real client is handed a word.

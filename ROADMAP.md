# What's next

The site is built and merged. Where it runs is decided, the deploy config is in
the tree, and a merge to `main` now deploys it. What's left of step 1 is the
one-time account setup — creating the Fly app, its two secrets, its volume and
a deploy token — which needs credentials this repository doesn't have. Until
someone does that, nobody can reach the site, and almost everything below is
polish on something no one can see.

Written as a handoff: enough context to pick any item up cold.

---

## 1. Deploy it

**Decided: path A — one small box with a persistent disk, on Fly.io.**

`DATA_DIR` is a writable directory holding three things: the album records, the
client-gallery records, and every uploaded photograph. That ruled out platforms
with an ephemeral filesystem — on Vercel's serverless functions the store and
the uploads would be wiped on each deploy, and taking that path would have
meant rewriting `lib/store.ts` onto Postgres and `lib/uploads.ts` onto object
storage first. This is a hobby portfolio with one author and a handful of
client galleries a year; one instance is the right shape, and it keeps the
whole storage layer as it is.

Everything needed to run it is now in the repository:

- `Dockerfile` + `docker-entrypoint.sh` — Next's `standalone` output on Debian
  slim, running as a non-root user, with the mounted volume handed to it at
  boot. Ordinary Docker, so the same image runs on Railway, Render or a VPS.
- `fly.toml` — one `shared-cpu-1x`/1GB machine, a 10GB volume at `/data`,
  `force_https`, and a health check.
- `app/api/health/route.ts` — writes a byte to `DATA_DIR` and removes it, so an
  unmounted or full volume fails the health check instead of the site quietly
  losing every edit and every upload.
- [`docs/DEPLOY.md`](docs/DEPLOY.md) — the runbook.

The image was verified as far as it can be from a session without a Fly
account: `standalone` builds clean, and the built server serves all four public
pages, seeds the album store into `DATA_DIR`, resolves the zip route, and
re-encodes an upload through `sharp`.

Deploying is now a merge to `main`: `.github/workflows/ci.yml` typechecks,
runs `next build`, builds the container, and only then hands it to Fly. That
container build matters more than it looks — it is the one thing no session
could verify without a Docker daemon, and it fails on exactly the problems
`npm run build` cannot see.

**What's left is the account work**, which nobody but Joshua can do. It stays
by hand on purpose: it needs a Fly account, and the two secrets should never
pass through a repository or a CI log. `docs/DEPLOY.md` has each step in full:

```bash
fly apps create joshua-davis-photography
fly secrets set SESSION_SECRET="$(node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))')" ADMIN_PASSWORD='...'
fly volumes create jd_data --region dfw --size 10
fly tokens create deploy -x 8760h   # → GitHub repo secret FLY_API_TOKEN
fly deploy                          # or just merge to main, once the token is set
```

Without `FLY_API_TOKEN` the deploy job skips itself with a notice rather than
failing, so `main` stays green while the setup is half-done.

Then a domain — `fly certs add <domain>`, and the records it prints go at the
registrar. HTTPS is not optional: both cookies are already `Secure` in
production, so over plain HTTP neither the admin sign-in nor a client's gallery
would hold.

Two things to know before typing them:

- `SESSION_SECRET` should be written down somewhere durable first. Changing it
  later signs everyone out and makes stored words unreadable in the admin
  listing (galleries still open; the check goes through the hash, not the
  sealed copy).
- `ADMIN_PASSWORD` should be something better than the development default.

**Don't scale this past one machine.** The JSON store is process-local and the
rate limiter is in memory. A second instance means the database-and-object-
storage rewrite, not a config change.

## 2. Back up the client photographs

Before Joshua hands a real client a word.

Right now everything lives on one disk with no copy anywhere. Client
photographs are the one thing on this site that cannot be recreated — the
albums are his own work, the copy is in git, but a family's session exists once.

A nightly `DATA_DIR` snapshot off the box is enough. `fly.toml` already asks
for nightly volume snapshots kept a fortnight, but those live on the same
provider as the disk they copy — that's a floor, not the backup. Somewhere
else entirely: `restic` to object storage from a cron'd `fly ssh console`, or
pulled down on a schedule.

## 3. Real photographs

The albums still reuse the same five stock images, as they did in the handoff.
Joshua uploads through **the desk drawer → My photographs**; the seeded albums
can be edited in place or taken off the site and replaced.

Two things go with it:

- The About portrait is still the "Portrait coming soon" placeholder. Signed in,
  hover the frame on `/about` to replace it.
- Pick the three photographs that carry the **Home** flag — those are the
  "Pasted in lately" strip.

## 4. Make "files here until Oct 8" true

The site makes two promises it does not currently keep:

> Files here until Oct 8 · If you'd rather I take the gallery down early,
> that's fine too — say so and it's gone that day.

Expiry is enforced at *access* time: past the date the word stops working, the
cookie stops resolving, the share link dies. But nothing ever deletes a byte.
Taking a gallery down removes the record and leaves the photographs on disk;
removing a photograph from an album orphans its file. There is no `unlink`
anywhere in the codebase.

What's needed:

- A sweep that deletes uploads no album or gallery references any more. Note
  files are content-addressed, so two records can share one file — count
  references before deleting.
- Expired galleries: purge their files after a short grace period, so the
  promise is literal rather than a locked door with the box still behind it.
- Run it on a schedule, and on take-down.

This is small, and it's the difference between the copy being true and being
marketing.

## 5. Continuous integration

**The build check exists now.** `.github/workflows/ci.yml` runs `npm ci`,
`npx tsc --noEmit`, `npm run build` and a `docker build` on every pull request,
which is what this step asked for as the cheapest useful step, plus the
container build that guards the deploy path.

What's still missing is tests. There are no test files, and every check so far
has been a browser driven by hand inside a session, which a future session
cannot cheaply repeat. A small Playwright smoke suite over the flows that
actually matter — all of which have been driven manually and would translate
directly:

- passphrase gate: wrong word, right word, expired gallery
- the admin gate leaking nothing signed out
- the home-page cap holding at three, from the API as well as the UI
- a draft album's uploads 404 for anyone but Joshua, and flip on publish
- keeps surviving a reload; the zip downloading

## 6. Public-site basics

None of these exist yet:

- `favicon.ico` (the browser requests it on every page and gets a 404)
- `robots.txt` and `sitemap.xml`
- an Open Graph image, so a link to the site previews as something other than
  bare text

## 7. Smaller things, in no particular order

- **Sending the word.** Joshua tells clients out-of-band today. That may well be
  right for this site — worth confirming rather than assuming. If he wants the
  site to send it, that's a mail-provider decision.
- **EXIF.** The album worksheet has no field for the EXIF line under a lightbox
  photograph, so uploaded frames simply don't have one. Seeded ones do. Either
  add the field or read it off the file on upload.
- **Alt text.** Client photographs fall back to `"{client} — IMG 4412"`. Album
  photographs use their caption, which is better. A per-photograph alt field
  would be better still.
- **An accessibility and performance pass.** Neither has been done. The pages
  lean on inline styles and heavy background textures; worth measuring before
  assuming either is fine.
- **The rate limiter is in-memory** (`lib/rate-limit.ts`), so it resets on
  deploy and doesn't span instances. Correct for the one box step 1 landed on;
  revisit only if that ever stops being true.

---

## Where things are

`README.md` covers the stack, the layout, what runs on the server and the
configuration. The design references are in
`design_handoff_photography_site_V2/` — its README is the source of truth for
intent, and `screenshots/` shows every page as drawn.

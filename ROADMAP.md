# What's next

The site is built, merged and **live at https://photography.fly.dev**, deployed
by a merge to `main`. Step 1 is done. Everything below is what a live site
still needs. The one that matters before Joshua hands a real client a word is
now step 4: the site promises files come down on a date and nothing ever
deletes a byte.

Written as a handoff: enough context to pick any item up cold.

---

## 1. Deploy it — done

**Path A: one machine with a persistent disk, on Fly.io.** `DATA_DIR` is a real
directory holding the album records, the client-gallery records and every
uploaded photograph, so ephemeral-filesystem hosting was out; taking that path
would have meant rewriting `lib/store.ts` onto Postgres and `lib/uploads.ts`
onto object storage before anything could ship. No application code changed.

Live at **https://photography.fly.dev**, on one `shared-cpu-1x`/1GB machine
with a 10GB volume at `/data`.

Deploying is **merging to `main`**. `.github/workflows/ci.yml` typechecks, runs
`next build`, builds the container, and only then hands it to Fly; the last
step curls the live `/api/health` and fails the run if it doesn't answer.

`docs/DEPLOY.md` is the runbook — the account setup, the domain, day two, and
how to read the deploy job when something is wrong.

Two things learned getting here, both written down there:

- A green tick on `main` doesn't prove a deploy happened. The deploy job
  reports success whether it deployed or skipped, because a missing token is
  unfinished setup rather than a broken build.
- `/api/health` writes a byte to `DATA_DIR` and removes it, so an unmounted or
  full volume fails the check instead of the site serving pages while losing
  every edit. It does **not** touch `SESSION_SECRET`, so a healthy check says
  nothing about whether the admin door works.

Still open here: **no custom domain.** `fly certs add <domain>` and the records
it prints, whenever Joshua picks one.

## 2. Back up the client photographs — done

`restic` copies `DATA_DIR` to an S3-compatible bucket off this provider,
roughly daily, from inside the app machine — the volume can only be mounted by
one machine, so the thing backing it up has to live there too.

- `scripts/backup.sh` — one run: init if needed, back up, prune, record.
- `scripts/backup-daemon.sh` — every 15 minutes, runs one if the last **good**
  backup is over 20 hours old. Not cron: the container restarts on every
  deploy, and a cron entry set for 03:15 is silently missed by a machine that
  restarted at 03:14.
- `/api/health` reports `configured`, `ok`, `ageHours` and `stale`, so a
  backup that quietly stopped is visible before the day it is needed.

Retention is 14 daily, 5 weekly, 12 monthly. The Fly volume snapshots in
`fly.toml` remain a floor, not this.

**[`docs/BACKUP.md`](docs/BACKUP.md)** covers the bucket, the secrets, and —
the part that matters — how to restore, including to a machine that does not
exist yet. The restore was verified end to end against a test repository:
`diff -r` and SHA-256 of every photograph came back identical.

**Still needs doing once:** the bucket and the four Fly secrets. Until
`RESTIC_REPOSITORY` is set the site runs normally, says so once in the log, and
`/api/health` reports `configured: false` — **nothing is being backed up.**

Two things about `RESTIC_PASSWORD` worth knowing before setting it. It encrypts
the repository and no provider can recover it: lose it and the bucket is
ciphertext. And a restore needs the *old* `SESSION_SECRET` too, or the stored
gallery words are unreadable in the admin listing afterwards — the galleries
still open, since that check goes through the hash.

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

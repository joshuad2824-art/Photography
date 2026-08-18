# Deploying

The site runs as **one machine with one persistent disk**. This is the shape
`ROADMAP.md` step 1 calls path A, and it's chosen because `DATA_DIR` is a real
directory: it holds the album records, the client-gallery records, the edited
copy and every uploaded photograph. A platform with an ephemeral filesystem
would wipe all of it on each deploy, which is why Vercel-style hosting would
first need `lib/store.ts` moved to a database and `lib/uploads.ts` to object
storage.

The config here is written for [Fly.io](https://fly.io) with a volume. Nothing
in the application knows about Fly — `Dockerfile` and `docker-entrypoint.sh`
are ordinary Docker, so the same image runs on Railway, Render or a VPS with
`docker run -v /srv/joshua-davis:/data`. Only `fly.toml` is provider-specific.

## What's here

| File | What it does |
| --- | --- |
| `Dockerfile` | Three-stage build; ships Next's `standalone` output on Debian slim. |
| `docker-entrypoint.sh` | Gives the mounted volume to the `node` user, then drops root. |
| `.dockerignore` | Keeps `.git`, the two design-handoff directories and `data/` out of the image. |
| `fly.toml` | One `shared-cpu-1x` machine, a 10GB volume at `/data`, health check on `/api/health`. |
| `app/api/health/route.ts` | Writes a byte to `DATA_DIR` and removes it, so an unmounted volume fails the check instead of silently losing every edit. |
| `.github/workflows/ci.yml` | Typecheck, `next build` and a container build on every pull request; on a merge to `main`, the deploy. |

## First deploy

This is the one-time setup, and it has to be done by hand: it needs a Fly
account, and the two secrets should never pass through a repository or a CI
log. After it, deploying is merging to `main`.

Run these from the repository root, on a machine with the
[`flyctl` CLI](https://fly.io/docs/flyctl/install/) installed.

**1. Sign in and create the app.** The app has to exist before anything can be
deployed into it — `fly deploy` won't create one.

```bash
fly auth login
fly apps create joshua-davis-photography
```

If that name is taken, pick another and change `app =` at the top of
`fly.toml` to match.

**2. Set the secrets.** Generate a fresh `SESSION_SECRET` — don't reuse one
from anywhere, and don't paste the value into a shell that keeps history:

```bash
fly secrets set \
  SESSION_SECRET="$(node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))')" \
  ADMIN_PASSWORD='<pick something long, not the development default>'
```

Both are read at request time and throw at startup in production if missing,
so a deploy without them fails loudly rather than falling back to the
development values.

`SESSION_SECRET` is worth writing down somewhere durable before it goes in.
Changing it later signs everyone out and makes the stored passphrases
unreadable in the admin listing — existing galleries still open, because the
check goes through the hash rather than the sealed copy, but Joshua can no
longer see the word he gave a client.

**3. Create the volume**, in the same region as `primary_region`:

```bash
fly volumes create jd_data --region dfw --size 10
```

10GB is roughly 20,000 uploaded frames at the size they're stored, which is
years of shoots. It can be grown later (`fly volumes extend`) but not shrunk.

**4. Give GitHub a deploy token**, so merges to `main` go out on their own:

```bash
fly tokens create deploy -x 8760h
```

Copy the whole thing, including the `FlyV1 ` prefix, and add it to the
repository under **Settings → Secrets and variables → Actions → New
repository secret**, named exactly `FLY_API_TOKEN`. It is scoped to deploying
this one app, and expires in a year.

Until that secret exists the deploy job skips itself with a notice rather than
failing the run, so `main` stays green while the setup is half-done.

**5. Deploy.** Either merge to `main` and let
`.github/workflows/ci.yml` do it, or, for the very first one, run it by hand:

```bash
fly deploy
```

The first build takes a few minutes — mostly `npm ci` and `sharp`. Watch it
come up:

```bash
fly status
fly logs
curl https://joshua-davis-photography.fly.dev/api/health
```

A healthy answer is `{"ok":true,"store":"writable","ms":<n>}`. `store` is the
volume: if that comes back `unwritable`, the mount is wrong, not the app.

**6. Check it end to end**, on the deployed URL:

- the four public pages load, and photographs render
- the footer's **Admin** control takes the new `ADMIN_PASSWORD`
- signed in, **the desk drawer** at `/admin` lists the seeded albums
- signed out, `/admin` shows the gate and nothing else
- a demo gallery opens with `cottonwood`, and the wrong word is refused
- upload one frame through **My photographs**, then `fly apps restart` and
  confirm it's still there — that is the volume doing its job

## The domain

Fly's `*.fly.dev` hostname works immediately and is fine for testing.
For a real domain:

```bash
fly certs add joshuadavisphoto.com
fly certs add www.joshuadavisphoto.com
```

`fly certs show <domain>` prints the exact `A`/`AAAA`/`CNAME` records to
add at the registrar. Certificates issue within a few minutes of DNS
propagating, and renew on their own.

HTTPS is not optional here. `force_https` in `fly.toml` redirects plain HTTP,
and both cookies are already `Secure` in production — over HTTP the browser
would drop them and neither the admin sign-in nor a client's gallery would
hold.

## Day two

**Deploying a change** is merging to `main`. `.github/workflows/ci.yml` runs
the typecheck, the Next build and a container build first, and only deploys if
all three pass — a broken build cannot become what's live. The volume is
untouched by a deploy; only the image is replaced.

`fly deploy` from a laptop still works and is the way to ship something
urgently or from a branch, but it skips those checks.

**Reading the logs** is `fly logs`, or `fly logs -a joshua-davis-photography`
from elsewhere. Rate-limited sign-ins and zip errors show up here.

**Rotating the admin password** is `fly secrets set ADMIN_PASSWORD='…'`, which
restarts the machine. This does *not* sign existing admin sessions out — those
cookies are signed with `SESSION_SECRET`, not the password. To end them too,
rotate `SESSION_SECRET` as well, and read the warning in step 2 first.

**Getting at the files** — the store is plain JSON and JPEGs:

```bash
fly ssh console
ls /data /data/uploads
```

**Backups are not done by this step.** `snapshot_retention` in `fly.toml` sets
nightly volume snapshots kept a fortnight, which is a floor and not a backup:
they sit on the same provider as the disk they copy. Roadmap step 2 is a copy
of `DATA_DIR` somewhere else entirely, and it should happen before a real
client is handed a word.

## Do not scale this to two machines

`lib/store.ts` is process-local — it serialises its own writes, but a second
instance would neither see the first's records nor share its uploads
directory, and `lib/rate-limit.ts` counts sign-in attempts in memory. One
machine is the design.

`fly.toml` doesn't set a count, so `fly deploy` keeps one. If a second is ever
wanted, it means moving the store to a database and the uploads to object
storage first — the same work path B in `ROADMAP.md` describes.

For the same reason `auto_stop_machines` is `off`: a stopped machine is a cold
start in front of whoever just clicked the link.

## Running the image locally

Useful for reproducing a production-only problem, since `NODE_ENV=production`
is what turns on the secret guards and the `Secure` cookie flag:

```bash
docker build -t jd-photo .
docker run --rm -p 3000:3000 \
  -v "$PWD/data:/data" \
  -e SESSION_SECRET=0123456789abcdef0123456789abcdef \
  -e ADMIN_PASSWORD=lamplight \
  jd-photo
```

Note that with `Secure` cookies on and no HTTPS, sign-in won't hold over
`http://localhost` in some browsers — that's the flag working, not a bug.

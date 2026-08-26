# Backups

Everything the site cannot recreate lives in one directory on one disk:
`DATA_DIR` holds the album records, the client-gallery records, the edited
copy, and every uploaded photograph. The albums are Joshua's own work and the
copy is in git, but **a family's session exists once**. That is what this is
for.

`fly.toml` asks Fly for nightly volume snapshots kept a fortnight. Those are a
floor, not a backup — they sit on the same provider as the disk they copy, and
they go when the account goes. This is the copy that lives somewhere else.

## How it runs

`restic` backs `DATA_DIR` up to an S3-compatible bucket, roughly daily, from
inside the app machine — the volume can only be mounted by one machine, so the
thing backing it up has to live there too.

| Piece | What it does |
| --- | --- |
| `scripts/backup.sh` | One run: initialise if needed, back up, prune to the retention policy, record the outcome. |
| `scripts/backup-daemon.sh` | Every 15 minutes, asks whether the last **good** backup is over 20 hours old, and runs one if so. |
| `docker-entrypoint.sh` | Starts the daemon, but only when `RESTIC_REPOSITORY` is set. |
| `/api/health` | Reports when the backup last succeeded and whether it has gone stale. |

**Not cron, deliberately.** The container restarts on every deploy, and a cron
entry set for 03:15 is simply missed by a machine that restarted at 03:14 —
silently, which is the worst way for a backup to fail. Asking "is the last good
backup old?" every quarter hour is self-correcting across restarts and cannot
skip a day because a deploy landed at an awkward moment. A failed run is not
counted as a backup, so a failure retries in fifteen minutes rather than
waiting a day.

**Nothing is stopped to take a backup.** The JSON store writes to a temp file
and renames, so every record on disk is a complete one, and photographs are
content-addressed and never rewritten. A backup taken while the site is serving
is consistent.

**Retention** is 14 daily, 5 weekly, 12 monthly — about a year. A deleted
photograph is usually noticed within days; a corrupted record might not be.
Override with `BACKUP_KEEP_DAILY`, `BACKUP_KEEP_WEEKLY`, `BACKUP_KEEP_MONTHLY`.

## Setting it up

**1. Make a bucket.** Backblaze B2 is the recommendation: this workload writes
nightly and reads essentially never, so B2's cheaper storage matters and R2's
zero-egress does not. Either works — restic speaks S3 to both.

- Private, not public.
- **Object Lock on**, governance mode, ~30 days. This is the part that matters:
  the backup credentials live on the same machine as the data they protect, so
  a machine compromise is exactly when an attacker would delete the backups.
  Object Lock means the bucket refuses, whatever the key says.
- An **application key scoped to that one bucket** — not a master key.

**2. Pick a repository password**, and understand what it is. restic encrypts
the repository with it, and Backblaze cannot recover it. **Lose this and the
backups are unreadable — the bucket is full of ciphertext.** Generate it, and
write it down somewhere that is not this server and not that bucket:

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
```

**3. Set the Fly secrets:**

```bash
fly secrets set \
  RESTIC_REPOSITORY='s3:https://s3.us-west-004.backblazeb2.com/your-bucket-name' \
  RESTIC_PASSWORD='<the password from step 2>' \
  AWS_ACCESS_KEY_ID='<the application key id>' \
  AWS_SECRET_ACCESS_KEY='<the application key>'
```

Use the endpoint your bucket's own page shows — the region number varies.
`AWS_*` is not a mistake: that is what restic reads for any S3-compatible
store.

Setting secrets restarts the machine, which starts the daemon, which runs the
first backup within fifteen minutes.

**4. Prove it ran:**

```bash
fly ssh console -C /usr/local/bin/backup.sh    # run one now rather than waiting
curl https://photography.fly.dev/api/health
```

Healthy looks like `"backup":{"configured":true,"ran":true,"ok":true,
"ageHours":0.2,"stale":false}`.

## Watching it

`/api/health` carries the backup's state, with no paths, repository or
credentials in it:

| Field | Meaning |
| --- | --- |
| `configured: false` | No repository set. **Nothing is being backed up.** |
| `ran: false` | Configured, but no run has recorded a result yet. |
| `ok: false` | The most recent run failed. `fly logs` has the reason. |
| `stale: true` | Over 48 hours since the last good one. Something has stopped. |

A stale or failing backup deliberately does **not** make the site unhealthy.
Taking the machine out of rotation over it would turn a backup problem into an
outage.

## Restoring

The procedure below has been run end to end against a test repository:
snapshot, restore, and `diff -r` plus SHA-256 of every photograph against the
originals — identical.

**See what you have:**

```bash
fly ssh console
restic snapshots
```

**Restore everything, in place.** restic stores absolute paths, so a target of
`/` puts `/data` back exactly where it was:

```bash
fly ssh console
restic restore latest --target /
```

**Restore one thing** without touching the live directory — the safer move when
you only need a file back:

```bash
restic restore latest --target /tmp/restore
ls /tmp/restore/data/uploads
cp /tmp/restore/data/uploads/<id>.jpg /data/uploads/
```

**Restore to a new machine** — the disaster case, where the Fly app is gone.
The bucket, the repository password and this repository are all you need:

```bash
fly apps create <new-name>          # and update `app =` in fly.toml
fly volumes create jd_data --region dfw --size 10
fly secrets set SESSION_SECRET=... ADMIN_PASSWORD=... \
                RESTIC_REPOSITORY=... RESTIC_PASSWORD=... \
                AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=...
fly deploy
fly ssh console -C "restic restore latest --target /"
```

`SESSION_SECRET` must be the **same value as before** or every gallery
passphrase becomes unreadable in the admin listing. The galleries still open —
that check goes through the hash — but Joshua can no longer see the word he
gave a client. This is why step 2 of the setup says to write it down.

**Check a restore is intact** without trusting the copy:

```bash
restic check              # repository structure
restic check --read-data  # every byte, slow, worth doing once or twice a year
```

## Worth doing once a year

Actually restore. A backup nobody has restored from is a hypothesis, not a
backup — `restic restore latest --target /tmp/restore-test` and look at a
photograph costs five minutes.

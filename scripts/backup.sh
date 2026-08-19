#!/bin/sh
#
# One backup run: DATA_DIR -> a restic repository somewhere that is not this
# machine. Safe to run by hand at any time:
#
#   fly ssh console -C /usr/local/bin/backup.sh
#
# Nothing needs to be stopped first. The JSON store writes to a temp file and
# renames, so every record on disk is a complete one, and photographs are
# content-addressed and never rewritten — so a backup taken while the site is
# serving is consistent without quiescing anything.

set -eu

DATA_DIR="${DATA_DIR:-/data}"
STATUS_FILE="$DATA_DIR/.backup-status.json"

# Kept about a year: a fortnight of dailies, five weeks of weeklies, a year of
# monthlies. A deleted photograph is usually noticed within days; a corrupted
# record might not be.
KEEP_DAILY="${BACKUP_KEEP_DAILY:-14}"
KEEP_WEEKLY="${BACKUP_KEEP_WEEKLY:-5}"
KEEP_MONTHLY="${BACKUP_KEEP_MONTHLY:-12}"

log() { echo "[backup] $*"; }

now() { date -u +%Y-%m-%dT%H:%M:%SZ; }

write_status() {
  # ok, then a message. Written even on failure — a backup that stopped
  # working is only useful information if something records that it stopped.
  tmp="$STATUS_FILE.tmp"
  printf '{"at":"%s","ok":%s,"message":"%s"}\n' "$(now)" "$1" "$2" > "$tmp"
  mv "$tmp" "$STATUS_FILE"
}

fail() {
  log "FAILED: $1"
  write_status false "$1"
  exit 1
}

if [ -z "${RESTIC_REPOSITORY:-}" ]; then
  log "RESTIC_REPOSITORY is not set — backups are not configured. See docs/BACKUP.md."
  exit 0
fi

if [ -z "${RESTIC_PASSWORD:-}" ]; then
  fail "RESTIC_PASSWORD is not set; the repository cannot be opened"
fi

if [ ! -d "$DATA_DIR" ]; then
  fail "DATA_DIR $DATA_DIR does not exist"
fi

# `cat config` is the cheapest proof the repository exists and the password
# opens it. A fresh bucket needs init once; anything else is a real error and
# must not be papered over by initialising on top of it.
# `cat config` is the cheapest proof the repository exists and the password
# opens it. A fresh bucket needs init once; anything else is a real error and
# must not be papered over.
if ! restic cat config >/dev/null 2>&1; then
  log "repository not readable — trying to initialise"
  init_output=$(restic init 2>&1) || {
    # Two very different problems land here, and telling them apart matters:
    # an empty bucket needs initialising, while a repository that already
    # exists and will not open means the password is wrong — and a wrong
    # password is an unreadable backup, which is worth naming precisely.
    case "$init_output" in
      *"already exists"*|*"already initialized"*)
        fail "the repository exists but RESTIC_PASSWORD does not open it — the backups are there, the password is wrong"
        ;;
      *)
        log "$init_output"
        fail "restic init failed — check the bucket name, the endpoint and the keys"
        ;;
    esac
  }
  log "initialised a new repository"
fi

log "backing up $DATA_DIR"
restic backup "$DATA_DIR" \
  --tag scheduled \
  --exclude "$STATUS_FILE" \
  --exclude "$DATA_DIR/.health.*" \
  --exclude "$DATA_DIR/*.tmp" \
  || fail "restic backup failed"

log "pruning old snapshots"
restic forget \
  --tag scheduled \
  --keep-daily "$KEEP_DAILY" \
  --keep-weekly "$KEEP_WEEKLY" \
  --keep-monthly "$KEEP_MONTHLY" \
  --prune \
  || fail "restic forget/prune failed"

write_status true "ok"
log "done"

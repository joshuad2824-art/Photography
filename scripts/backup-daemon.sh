#!/bin/sh
#
# Keeps DATA_DIR backed up roughly daily, from inside the app machine.
#
# Not cron. The container restarts on every deploy, and a cron entry set for
# 03:15 would simply be missed by a machine that happened to restart at 03:14 —
# silently, which is the worst way for a backup to fail. This instead asks a
# different question every quarter of an hour: is the last good backup older
# than a day? That is self-correcting across restarts, needs no clock
# arithmetic, and cannot skip a day just because a deploy landed at the wrong
# moment.
#
# Started by docker-entrypoint.sh, and only when a repository is configured.

set -u

DATA_DIR="${DATA_DIR:-/data}"
STATUS_FILE="$DATA_DIR/.backup-status.json"

CHECK_EVERY="${BACKUP_CHECK_SECONDS:-900}"     # 15 minutes
MAX_AGE="${BACKUP_MAX_AGE_SECONDS:-72000}"     # 20 hours

log() { echo "[backup-daemon] $*"; }

last_success_epoch() {
  [ -f "$STATUS_FILE" ] || { echo 0; return; }
  # Only a successful run counts as a backup having happened.
  grep -q '"ok":true' "$STATUS_FILE" 2>/dev/null || { echo 0; return; }
  stamp=$(sed -n 's/.*"at":"\([^"]*\)".*/\1/p' "$STATUS_FILE" 2>/dev/null)
  [ -n "$stamp" ] || { echo 0; return; }
  date -u -d "$stamp" +%s 2>/dev/null || echo 0
}

log "watching $DATA_DIR; a backup runs when the last good one is over $((MAX_AGE / 3600))h old"

while true; do
  age=$(( $(date -u +%s) - $(last_success_epoch) ))
  if [ "$age" -ge "$MAX_AGE" ]; then
    log "last good backup is ${age}s old — running"
    /usr/local/bin/backup.sh || log "backup run failed; will try again in $((CHECK_EVERY / 60))m"
  fi
  sleep "$CHECK_EVERY"
done

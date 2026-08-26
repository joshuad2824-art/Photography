#!/bin/sh
set -e

# DATA_DIR is a mounted volume — the album and gallery records, the edited
# copy, and every uploaded photograph. Fly hands a fresh volume to root, so
# claim it for the app user once, then run the server unprivileged.
if [ "$(id -u)" = "0" ]; then
  mkdir -p "$DATA_DIR"
  if [ "$(stat -c %u "$DATA_DIR")" != "$(id -u node)" ]; then
    chown -R node:node "$DATA_DIR"
  fi

  # The volume can only be mounted by one machine, so the thing that backs it
  # up has to live here rather than on a machine of its own. Started only when
  # a repository is configured, so an unconfigured deploy runs the site
  # normally and says so once in the log rather than failing.
  if [ -n "${RESTIC_REPOSITORY:-}" ]; then
    gosu node /usr/local/bin/backup-daemon.sh &
  else
    echo "[backup] RESTIC_REPOSITORY is not set — nothing is being backed up. See docs/BACKUP.md."
  fi

  exec gosu node "$@"
fi

exec "$@"

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
  exec gosu node "$@"
fi

exec "$@"

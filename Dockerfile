# syntax=docker/dockerfile:1

# Node on Debian slim rather than Alpine: sharp's prebuilt binaries
# (@img/sharp-linux-x64) are glibc and carry their own libvips, so nothing
# else has to be installed for uploads to work.
ARG NODE_VERSION=22

# --- dependencies ----------------------------------------------------------
FROM node:${NODE_VERSION}-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- build -----------------------------------------------------------------
FROM node:${NODE_VERSION}-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Both variables are read at request time, never at build time — these
# placeholders only satisfy the production guards in lib/crypto.ts and
# lib/auth.ts while pages are rendered. The real values are host secrets and
# are never baked into the image.
RUN SESSION_SECRET=build-only-placeholder-not-a-secret \
    ADMIN_PASSWORD=build-only-placeholder \
    npm run build

# --- run -------------------------------------------------------------------
FROM node:${NODE_VERSION}-slim AS runner
WORKDIR /app

# gosu drops from root to `node` in the entrypoint, after the mounted volume
# has been given to the app user. restic backs that volume up to object
# storage off this machine — see docs/BACKUP.md.
RUN apt-get update \
 && apt-get install -y --no-install-recommends gosu restic ca-certificates \
 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATA_DIR=/data

# `output: "standalone"` traces the server and only the node_modules it
# reaches; static assets and /public are copied alongside it.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
COPY scripts/backup.sh scripts/backup-daemon.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
             /usr/local/bin/backup.sh \
             /usr/local/bin/backup-daemon.sh

EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]

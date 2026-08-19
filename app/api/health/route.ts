import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Liveness for the host's health check (see fly.toml).
 *
 * The one failure this site cannot survive quietly is DATA_DIR not being
 * writable — the volume unmounted, the disk full, the wrong path in the
 * environment. The app would still serve pages and then lose every edit and
 * every upload, so the check writes a byte and removes it rather than just
 * answering 200 from memory.
 *
 * It also reports how long ago the backup last succeeded. A backup that has
 * quietly stopped is indistinguishable from a working one until the day it is
 * needed, which is the worst possible day to find out — so the age is served
 * here, where it can be watched.
 *
 * Nothing here is secret: no paths, no repository, no credentials — a
 * timestamp and an age in hours.
 */

export const dynamic = "force-dynamic";

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");

/** Written by scripts/backup.sh after every run, successful or not. */
type BackupStatus = { at?: string; ok?: boolean; message?: string };

async function backupReport() {
  if (!process.env.RESTIC_REPOSITORY) return { configured: false } as const;

  let status: BackupStatus;
  try {
    status = JSON.parse(
      await readFile(path.join(DATA_DIR, ".backup-status.json"), "utf8"),
    ) as BackupStatus;
  } catch {
    // Configured but nothing recorded yet: the first run is still pending, or
    // the daemon never started. Both are worth seeing.
    return { configured: true, ran: false } as const;
  }

  const at = status.at ? Date.parse(status.at) : NaN;
  const ageHours = Number.isNaN(at)
    ? null
    : Math.round(((Date.now() - at) / 3_600_000) * 10) / 10;

  return {
    configured: true,
    ran: true,
    ok: status.ok === true,
    at: status.at ?? null,
    ageHours,
    // A day is the schedule; two days means something stopped.
    stale: ageHours === null || ageHours > 48,
  } as const;
}

export async function GET() {
  const started = Date.now();
  try {
    await mkdir(DATA_DIR, { recursive: true });
    const probe = path.join(DATA_DIR, `.health.${process.pid}`);
    await writeFile(probe, "ok", "utf8");
    await unlink(probe);
  } catch {
    return Response.json(
      { ok: false, store: "unwritable" },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }

  // A stale or failing backup does not make the site unhealthy — taking the
  // machine out of rotation over it would turn a backup problem into an
  // outage. It is reported, not enforced.
  return Response.json(
    {
      ok: true,
      store: "writable",
      backup: await backupReport(),
      ms: Date.now() - started,
    },
    { headers: { "cache-control": "no-store" } },
  );
}

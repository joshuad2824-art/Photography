import { mkdir, unlink, writeFile } from "node:fs/promises";
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
 * Nothing here is secret: the body is a status and a duration, no paths and
 * no configuration.
 */

export const dynamic = "force-dynamic";

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");

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

  return Response.json(
    { ok: true, store: "writable", ms: Date.now() - started },
    { headers: { "cache-control": "no-store" } },
  );
}

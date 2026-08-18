import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * A tiny JSON-file store.
 *
 * The handoff flags cross-device persistence as the thing localStorage could
 * not do. A file on the server fixes that without committing the client to a
 * database before they've picked one — every read and write goes through here,
 * so swapping in Postgres/S3 later is a single-module change.
 */

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");

const writeQueues = new Map<string, Promise<unknown>>();

async function ensureDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

export async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(path.join(DATA_DIR, file), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Serialised read-modify-write. Concurrent callers queue behind each other so
 * two admins saving at once cannot clobber one another's edit.
 */
export async function updateJson<T>(
  file: string,
  fallback: T,
  mutate: (current: T) => T | Promise<T>,
): Promise<T> {
  const previous = writeQueues.get(file) ?? Promise.resolve();
  const next = previous
    .catch(() => undefined)
    .then(async () => {
      const current = await readJson(file, fallback);
      const updated = await mutate(current);
      await ensureDir();
      const target = path.join(DATA_DIR, file);
      const temp = `${target}.${process.pid}.tmp`;
      await writeFile(temp, JSON.stringify(updated, null, 2), "utf8");
      await rename(temp, target);
      return updated;
    });

  writeQueues.set(file, next);
  return next;
}

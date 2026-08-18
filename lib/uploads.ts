import "server-only";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/**
 * Photograph uploads.
 *
 * Joshua works off a MacBook a few times a year, 20–40 frames at a time,
 * straight off the card. Originals are large, so each one is re-encoded down
 * to a sane long edge on the way in — the web sizes get made for him, as the
 * upload zone promises. Files are content-addressed, so the same frame
 * uploaded twice costs one file.
 */

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");

const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

/** Long edge kept for delivery. Enough for a full-screen lightbox on a 5K panel. */
const MAX_EDGE = 3200;
export const MAX_UPLOAD_BYTES = 40 * 1024 * 1024;

export const ACCEPTED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
  "image/tiff",
]);

export type StoredUpload = {
  /** File name inside the upload directory; also the public id. */
  id: string;
  width: number;
  height: number;
  bytes: number;
  /** CSS aspect-ratio for the print's mat. */
  ratio: string;
};

export function uploadPath(id: string): string {
  // Ids are generated here and never come from a request path.
  return path.join(UPLOAD_DIR, path.basename(id));
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** "3 / 2" where it lands neatly, otherwise the raw pixel ratio. */
function ratioOf(width: number, height: number): string {
  const divisor = gcd(width, height) || 1;
  const w = width / divisor;
  const h = height / divisor;
  return w <= 32 && h <= 32 ? `${w} / ${h}` : `${width} / ${height}`;
}

export async function storeUpload(file: File): Promise<StoredUpload> {
  const input = Buffer.from(await file.arrayBuffer());

  const pipeline = sharp(input, { failOn: "none" }).rotate();
  const meta = await pipeline.metadata();
  const longEdge = Math.max(meta.width ?? 0, meta.height ?? 0);

  const output = await (longEdge > MAX_EDGE
    ? pipeline.resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside" })
    : pipeline
  )
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });

  const id = `${createHash("sha256").update(output.data).digest("hex").slice(0, 16)}.jpg`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(uploadPath(id), output.data);

  return {
    id,
    width: output.info.width,
    height: output.info.height,
    bytes: output.data.length,
    ratio: ratioOf(output.info.width, output.info.height),
  };
}

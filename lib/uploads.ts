import "server-only";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { isHeicName, isRawName, MAX_UPLOAD_BYTES } from "./photo-files";

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

export { MAX_UPLOAD_BYTES };

/**
 * Whether this build's decoder can read what an iPhone calls a photograph.
 * The prebuilt binaries ship without the HEIF licence, so asking is the only
 * way to know — and the answer decides whether Joshua is told to export or
 * left staring at a frame that never arrives.
 */
export const HEIC_READABLE: boolean =
  sharp.format.heif?.input?.fileSuffix?.includes(".heic") ?? false;

/**
 * Why a frame the decoder refused couldn't be read. The reason goes back to
 * the upload zone as it is, so it says what to do rather than only that
 * something went wrong.
 */
export function unreadableReason(name: string): string {
  const file = name || "That file";
  if (isRawName(file)) {
    return `${file} is a RAW file — export it as a JPEG and it'll go up`;
  }
  if (isHeicName(file) && !HEIC_READABLE) {
    return `${file} is HEIC — in Photos, File › Export › JPEG, then try again`;
  }
  return `${file} wouldn't open — the file may be truncated`;
}

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

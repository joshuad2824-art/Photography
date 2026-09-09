/**
 * What counts as a photograph on the way in — the one set of rules the upload
 * zone and the upload route both answer to.
 *
 * The browser is an unreliable witness here. A frame dragged off a card, or
 * picked out of a folder the Mac has no opinion about, arrives with an empty
 * `type`, so nothing is turned away for that alone: the only honest judge of
 * whether bytes are a photograph is the decoder on the server. What can be
 * judged before then — size, emptiness, and the formats no decoder here will
 * ever read — lives here, so the answer is the same on both sides of the wire.
 */

/** Per frame. A full-size JPEG off a 45MP body lands well inside this. */
export const MAX_UPLOAD_BYTES = 40 * 1024 * 1024;

/**
 * One request's worth. The zone sends in batches; this is the backstop for a
 * stale tab that still tries to put forty frames in a single body, which the
 * server has to hold in memory whole before it can read any of them.
 */
export const MAX_REQUEST_BYTES = 120 * 1024 * 1024;

/** Bytes the zone puts in one request before starting another. */
export const BATCH_BYTES = 24 * 1024 * 1024;

/** …and frames, whichever comes first. */
export const BATCH_FILES = 4;

/**
 * Camera RAW. Nothing on the server can develop these, and they're the one
 * kind of file worth naming before it goes up: a 60 MB NEF costs a minute of
 * Joshua's upload to be told no.
 */
const RAW_SUFFIXES = new Set([
  ".3fr", ".arw", ".cr2", ".cr3", ".crw", ".dcr", ".dng", ".erf", ".iiq",
  ".k25", ".kdc", ".mef", ".mos", ".mrw", ".nef", ".nrw", ".orf", ".pef",
  ".raf", ".raw", ".rw2", ".rwl", ".sr2", ".srf", ".srw", ".x3f",
]);

export function suffixOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot < 1 ? "" : name.slice(dot).toLowerCase();
}

export function isRawName(name: string): boolean {
  return RAW_SUFFIXES.has(suffixOf(name));
}

export function isHeicName(name: string): boolean {
  const suffix = suffixOf(name);
  return suffix === ".heic" || suffix === ".heif";
}

/** Just enough of a File to judge it, so the server can use this too. */
export type IncomingFile = { name: string; type: string; size: number };

/**
 * Why a file can't be sent, in Joshua's words — or null if it can. Every
 * refusal names the file: a count on its own tells him nothing about which
 * frame to go back for.
 */
export function whyNotSendable(file: IncomingFile): string | null {
  const name = file.name || "That file";
  if (isRawName(name)) {
    return `${name} is a RAW file — export it as a JPEG and it'll go up`;
  }
  // An empty type means the browser didn't recognise the file, not that the
  // file is wrong. Those go to the decoder, which reads the bytes themselves.
  if (file.type && !file.type.startsWith("image/")) {
    return `${name} isn't a photograph`;
  }
  if (!file.size) return `${name} came through empty`;
  if (file.size > MAX_UPLOAD_BYTES) {
    return `${name} is over 40 MB — ${Math.round(file.size / (1024 * 1024))} MB, in fact`;
  }
  return null;
}

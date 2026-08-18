import "server-only";
import { stat } from "node:fs/promises";
import path from "node:path";
import {
  constantTimeEquals,
  hashPassphrase,
  newSalt,
  seal,
  unseal,
} from "./crypto";
import { readJson, updateJson } from "./store";
import { uploadPath } from "./uploads";

/**
 * Client galleries — a record per shoot.
 *
 * Who it was for, when, the word that opens it, its own photographs, and the
 * date the files come down. The word is checked against a salted hash; a
 * sealed copy rides along only so the admin page can show Joshua what he sent.
 */

export type SessionPhoto = {
  id: string;
  /** Path under /public for the seeded set, or an upload id. */
  file: string;
  uploaded: boolean;
  plate: string;
  ratio: string;
  pos: string;
  bytes?: number;
};

export type ClientSession = {
  id: string;
  name: string;
  /** Hand-written line beside the name. Edited in place on the gallery. */
  hand: string;
  /** ISO date of the shoot. */
  shotOn: string;
  /** ISO date the files come down, or null for "no expiry". */
  expiresOn: string | null;
  salt: string;
  /** Salted hashes of every word that opens this gallery. */
  passphraseHashes: string[];
  /** Sealed copy of the primary word, for the admin listing only. */
  sealedWord: string;
  /** Ids of the photographs the client has marked to print. */
  kept: string[];
  photos: SessionPhoto[];
};

/** What a client's browser is allowed to see. No salt, no hashes, no word. */
export type PublicClientSession = {
  id: string;
  name: string;
  hand: string;
  shoot: string;
  archiveSize: string;
  expiryLabel: string;
  kept: string[];
  photos: Array<Omit<SessionPhoto, "file" | "uploaded" | "bytes"> & { src: string }>;
};

const FILE = "client-sessions.json";
const PUBLIC_ROOT = path.join(process.cwd(), "public");

type SeedGallery = {
  id: string;
  name: string;
  hand: string;
  shotOn: string;
  expiresOn: string;
  passphrases: string[];
  photos: Array<Omit<SessionPhoto, "uploaded">>;
};

const seedPhoto = (
  id: string,
  file: string,
  plate: string,
  ratio: string,
  pos: string,
): Omit<SessionPhoto, "uploaded"> => ({ id, file, plate, ratio, pos });

/**
 * Seed data, matching the galleries drawn in the admin handoff so a fresh
 * deploy shows the same three shoots. `hartley` stays on the Hartleys record
 * because the original prototypes handed that word out.
 */
const seed: SeedGallery[] = [
  {
    id: "hartley-2026-08",
    name: "The Hartleys",
    hand: "an hour before dark, out at Turkey Mountain",
    shotOn: "2026-08-09",
    expiresOn: "2026-10-08",
    passphrases: ["cottonwood", "hartley"],
    photos: [
      seedPhoto("4412", "photos/street-02-grin.jpg", "IMG 4412", "4 / 5", "50% 28%"),
      seedPhoto("4418", "photos/street-01-crossing.jpg", "IMG 4418", "2 / 3", "50% 35%"),
      seedPhoto("4427", "photos/high-country.jpg", "IMG 4427", "3 / 2", "50% 55%"),
      seedPhoto("4431", "photos/street-03-walking.jpg", "IMG 4431", "3 / 4", "50% 45%"),
      seedPhoto("4440", "photos/street-02-grin.jpg", "IMG 4440", "1 / 1", "50% 26%"),
      seedPhoto("4446", "photos/the-gap.jpg", "IMG 4446", "2 / 3", "50% 30%"),
      seedPhoto("4452", "photos/street-01-crossing.jpg", "IMG 4452", "4 / 5", "50% 40%"),
      seedPhoto("4459", "photos/street-03-walking.jpg", "IMG 4459", "2 / 3", "50% 50%"),
    ],
  },
  {
    id: "renner-mae-2026-07",
    name: "Renner + Mae",
    hand: "the good hour, just before the wind picked up",
    shotOn: "2026-07-19",
    expiresOn: "2026-09-17",
    passphrases: ["fellowship"],
    photos: [
      seedPhoto("5101", "photos/the-gap.jpg", "IMG 5101", "2 / 3", "50% 40%"),
      seedPhoto("5108", "photos/high-country.jpg", "IMG 5108", "3 / 2", "50% 50%"),
      seedPhoto("5114", "photos/street-03-walking.jpg", "IMG 5114", "3 / 4", "50% 45%"),
      seedPhoto("5119", "photos/street-01-crossing.jpg", "IMG 5119", "2 / 3", "50% 35%"),
      seedPhoto("5126", "photos/street-02-grin.jpg", "IMG 5126", "4 / 5", "50% 28%"),
      seedPhoto("5133", "photos/high-country.jpg", "IMG 5133", "3 / 2", "50% 60%"),
    ],
  },
  {
    id: "okerlund-2026-05",
    name: "The Okerlunds",
    hand: "everybody in the kitchen, nobody sitting still",
    shotOn: "2026-05-30",
    expiresOn: "2026-07-29",
    passphrases: ["sycamore"],
    photos: [
      seedPhoto("6201", "photos/high-country.jpg", "IMG 6201", "3 / 2", "50% 50%"),
      seedPhoto("6207", "photos/street-01-crossing.jpg", "IMG 6207", "2 / 3", "50% 40%"),
      seedPhoto("6212", "photos/the-gap.jpg", "IMG 6212", "2 / 3", "50% 50%"),
      seedPhoto("6218", "photos/street-02-grin.jpg", "IMG 6218", "1 / 1", "50% 28%"),
    ],
  },
];

function seeded(): ClientSession[] {
  return seed.map(({ passphrases, photos, ...rest }) => {
    const salt = newSalt();
    return {
      ...rest,
      salt,
      passphraseHashes: passphrases.map((word) => hashPassphrase(word, salt)),
      sealedWord: seal(passphrases[0]!),
      kept: [],
      photos: photos.map((photo) => ({ ...photo, uploaded: false })),
    };
  });
}

/**
 * Brings a record written by the first build up to the current shape.
 *
 * That version stored a pre-rendered "March 2026 · 24 frames" string and a
 * frame count rather than the shoot date, and carried the scatter geometry on
 * each photograph. The word itself was only ever hashed, so a migrated record
 * shows no word until Joshua sets a new one.
 */
function migrate(record: ClientSession & Record<string, unknown>): ClientSession {
  if (record.shotOn && record.sealedWord !== undefined) return record;

  const legacyShoot = typeof record.shoot === "string" ? record.shoot : "";
  const monthYear = legacyShoot.match(/^([A-Za-z]+)\s+(\d{4})/);
  const monthIndex = monthYear
    ? MONTHS.findIndex((m) => monthYear[1]!.toLowerCase().startsWith(m.toLowerCase()))
    : -1;

  const shotOn =
    monthYear && monthIndex >= 0
      ? `${monthYear[2]}-${String(monthIndex + 1).padStart(2, "0")}-01`
      : (record.expiresOn ?? new Date().toISOString().slice(0, 10));

  return {
    ...record,
    shotOn,
    sealedWord: typeof record.sealedWord === "string" ? record.sealedWord : "",
    hand: record.hand ?? "",
    kept: record.kept ?? [],
    photos: (record.photos ?? []).map((photo) => ({
      id: photo.id,
      file: photo.file,
      uploaded: photo.uploaded ?? false,
      plate: photo.plate,
      ratio: photo.ratio,
      pos: photo.pos,
      ...(photo.bytes ? { bytes: photo.bytes } : {}),
    })),
  };
}

/** Reads the store, writing the seed on first run so a fresh deploy works. */
export async function loadSessions(): Promise<ClientSession[]> {
  const existing = await readJson<ClientSession[] | null>(FILE, null);
  if (existing) return existing.map(migrate);
  return updateJson<ClientSession[]>(FILE, [], (current) =>
    current.length ? current : seeded(),
  );
}

export function isExpired(session: ClientSession, now = new Date()): boolean {
  if (!session.expiresOn) return false;
  // Expiry is inclusive of the named day.
  return now > new Date(`${session.expiresOn}T23:59:59Z`);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Oct 8" — the shape the expiry badge was drawn with. */
export function shortDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return `${MONTHS[month - 1]} ${day}`;
}

/** "Oct 8, 2026" — the admin listing's longer form. */
export function longDate(iso: string | null): string {
  if (!iso) return "—";
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

export function expiryLabel(session: ClientSession): string {
  if (!session.expiresOn) return "Files here for now";
  return `Files here until ${shortDate(session.expiresOn)}`;
}

/** "Aug 2026 · 8 frames" */
export function shootLabel(session: ClientSession): string {
  const [year, month] = session.shotOn.split("-").map(Number);
  const when = year && month ? `${MONTHS[month - 1]} ${year}` : session.shotOn;
  const count = session.photos.length;
  return `${when} · ${count} ${count === 1 ? "frame" : "frames"}`;
}

/** Absolute path of a photograph's original file. */
export function photoPath(photo: SessionPhoto): string {
  return photo.uploaded
    ? uploadPath(photo.file)
    : path.join(PUBLIC_ROOT, photo.file);
}

/** Rough archive size for the "download all" message. */
export async function archiveSize(session: ClientSession): Promise<string> {
  let bytes = 0;
  for (const photo of session.photos) {
    if (photo.bytes) {
      bytes += photo.bytes;
      continue;
    }
    const info = await stat(photoPath(photo)).catch(() => null);
    bytes += info?.size ?? 0;
  }
  if (!bytes) return "a few megabytes";
  const mb = bytes / (1024 * 1024);
  return mb >= 1000
    ? `about ${(mb / 1024).toFixed(1)} GB`
    : `about ${Math.round(mb)} MB`;
}

export async function findByPassphrase(
  word: string,
): Promise<ClientSession | null> {
  const trimmed = word.trim().toLowerCase();
  if (!trimmed) return null;
  const sessions = await loadSessions();
  for (const session of sessions) {
    const candidate = hashPassphrase(trimmed, session.salt);
    if (session.passphraseHashes.some((h) => constantTimeEquals(h, candidate))) {
      return session;
    }
  }
  return null;
}

export async function getSession(id: string): Promise<ClientSession | null> {
  const sessions = await loadSessions();
  return sessions.find((s) => s.id === id) ?? null;
}

/**
 * The word Joshua sent, for his eyes only. Empty when the record predates the
 * sealed copy — only the hash was ever kept, and a hash doesn't read back.
 */
export function revealWord(session: ClientSession): string {
  return unseal(session.sealedWord) ?? "";
}

export async function toPublic(
  session: ClientSession,
): Promise<PublicClientSession> {
  return {
    id: session.id,
    name: session.name,
    hand: session.hand,
    shoot: shootLabel(session),
    archiveSize: await archiveSize(session),
    expiryLabel: expiryLabel(session),
    kept: session.kept,
    photos: session.photos.map((photo) => ({
      id: photo.id,
      plate: photo.plate,
      ratio: photo.ratio,
      pos: photo.pos,
      // Always through the gated route: a client's photographs are never
      // reachable without the cookie, and never cached by a shared proxy.
      src: `/api/session/photo/${photo.id}?view=1`,
    })),
  };
}

/* --- Writes ---------------------------------------------------------------- */

export async function saveSessions(
  mutate: (sessions: ClientSession[]) => ClientSession[],
): Promise<ClientSession[]> {
  return updateJson<ClientSession[]>(FILE, [], (current) =>
    mutate(current.length ? current.map(migrate) : seeded()),
  );
}

/** Persists a "keep this one" toggle so Joshua sees the picks, not just the client. */
export async function setKept(
  id: string,
  photoId: string,
  kept: boolean,
): Promise<string[]> {
  let result: string[] = [];
  await saveSessions((sessions) =>
    sessions.map((session) => {
      if (session.id !== id) return session;
      const has = session.kept.includes(photoId);
      const next = kept
        ? has
          ? session.kept
          : [...session.kept, photoId]
        : session.kept.filter((k) => k !== photoId);
      result = next;
      return { ...session, kept: next };
    }),
  );
  return result;
}

export function makePassphrase(word: string, salt: string) {
  return {
    salt,
    passphraseHashes: [hashPassphrase(word, salt)],
    sealedWord: seal(word.trim().toLowerCase()),
  };
}

export { newSalt };

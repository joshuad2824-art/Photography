import "server-only";
import { constantTimeEquals, hashPassphrase, newSalt } from "./crypto";
import { readJson, updateJson } from "./store";

/**
 * Client galleries — the "biggest gap" in the handoff.
 *
 * A record per shoot: who it was for, when, the word that opens it, its own
 * photographs, and the date the files come down. Passphrases are stored as
 * salted hashes and checked on the server, so the word list never reaches the
 * browser bundle.
 */

export type SessionPhoto = {
  id: string;
  src: string;
  /** Original file to serve for downloads (relative to /public). */
  file: string;
  plate: string;
  ratio: string;
  pos: string;
  w: string;
  ml: string;
  rot: string;
};

export type ClientSession = {
  id: string;
  /** Shown as the H1 once the drawer is open. */
  name: string;
  /** Hand-written line beside the name. */
  hand: string;
  /** Dark badge: "March 2026 · 24 frames". */
  shoot: string;
  /** Total frames delivered, used by the "Download all" message. */
  frameCount: number;
  /** Rough archive size, e.g. "about 480 MB". */
  archiveSize: string;
  /** ISO date the files come down, or null for "no expiry". */
  expiresOn: string | null;
  salt: string;
  /** Salted hashes of every word that opens this gallery. */
  passphraseHashes: string[];
  /** Ids of the photos the client has marked to print. */
  kept: string[];
  photos: SessionPhoto[];
};

/** What the browser is allowed to see. Note: no salt, no hashes. */
export type PublicClientSession = {
  id: string;
  name: string;
  hand: string;
  shoot: string;
  frameCount: number;
  archiveSize: string;
  expiryLabel: string;
  kept: string[];
  photos: SessionPhoto[];
};

const FILE = "client-sessions.json";

/**
 * Seed data. Mirrors the prototype's single demo gallery so the design reads
 * exactly as handed off; add a record per real shoot as Joshua books them.
 */
const seed: Array<Omit<ClientSession, "salt" | "passphraseHashes"> & {
  passphrases: string[];
}> = [
  {
    id: "hartley-2026-03",
    name: "The Hartleys",
    hand: "an hour before dark, out at Turkey Mountain",
    shoot: "March 2026 · 24 frames",
    frameCount: 24,
    archiveSize: "about 480 MB",
    expiresOn: "2026-10-03",
    passphrases: ["hartley", "cottonwood", "fellowship"],
    kept: [],
    photos: [
      { id: "4412", src: "/photos/street-02-grin.jpg", file: "photos/street-02-grin.jpg", plate: "IMG 4412", ratio: "4 / 5", pos: "50% 28%", w: "100%", ml: "0", rot: "1.1deg" },
      { id: "4418", src: "/photos/street-01-crossing.jpg", file: "photos/street-01-crossing.jpg", plate: "IMG 4418", ratio: "2 / 3", pos: "50% 35%", w: "94%", ml: "6%", rot: "-1.4deg" },
      { id: "4427", src: "/photos/high-country.jpg", file: "photos/high-country.jpg", plate: "IMG 4427", ratio: "3 / 2", pos: "50% 55%", w: "100%", ml: "0", rot: "0.8deg" },
      { id: "4431", src: "/photos/street-03-walking.jpg", file: "photos/street-03-walking.jpg", plate: "IMG 4431", ratio: "3 / 4", pos: "50% 45%", w: "92%", ml: "4%", rot: "-1deg" },
      { id: "4440", src: "/photos/street-02-grin.jpg", file: "photos/street-02-grin.jpg", plate: "IMG 4440", ratio: "1 / 1", pos: "50% 26%", w: "100%", ml: "0", rot: "1.5deg" },
      { id: "4446", src: "/photos/the-gap.jpg", file: "photos/the-gap.jpg", plate: "IMG 4446", ratio: "2 / 3", pos: "50% 30%", w: "96%", ml: "2%", rot: "-0.7deg" },
      { id: "4452", src: "/photos/street-01-crossing.jpg", file: "photos/street-01-crossing.jpg", plate: "IMG 4452", ratio: "4 / 5", pos: "50% 40%", w: "100%", ml: "0", rot: "0.9deg" },
      { id: "4459", src: "/photos/street-03-walking.jpg", file: "photos/street-03-walking.jpg", plate: "IMG 4459", ratio: "2 / 3", pos: "50% 50%", w: "90%", ml: "6%", rot: "-1.6deg" },
    ],
  },
];

function seeded(): ClientSession[] {
  return seed.map(({ passphrases, ...rest }) => {
    const salt = newSalt();
    return {
      ...rest,
      salt,
      passphraseHashes: passphrases.map((word) => hashPassphrase(word, salt)),
    };
  });
}

/** Reads the store, writing the seed on first run so a fresh deploy works. */
export async function loadSessions(): Promise<ClientSession[]> {
  const existing = await readJson<ClientSession[] | null>(FILE, null);
  if (existing && existing.length) return existing;
  return updateJson<ClientSession[]>(FILE, [], (current) =>
    current.length ? current : seeded(),
  );
}

export function isExpired(session: ClientSession, now = new Date()): boolean {
  if (!session.expiresOn) return false;
  // Expiry is inclusive of the named day.
  return now > new Date(`${session.expiresOn}T23:59:59Z`);
}

export function expiryLabel(session: ClientSession): string {
  if (!session.expiresOn) return "Files here for now";
  const when = new Date(`${session.expiresOn}T00:00:00Z`);
  const month = when.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  return `Files here until ${month} ${when.getUTCDate()}`;
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

export function toPublic(session: ClientSession): PublicClientSession {
  return {
    id: session.id,
    name: session.name,
    hand: session.hand,
    shoot: session.shoot,
    frameCount: session.frameCount,
    archiveSize: session.archiveSize,
    expiryLabel: expiryLabel(session),
    kept: session.kept,
    photos: session.photos,
  };
}

/** Persists a "keep this one" toggle so Joshua sees the picks, not just the client. */
export async function setKept(
  id: string,
  photoId: string,
  kept: boolean,
): Promise<string[]> {
  let result: string[] = [];
  await updateJson<ClientSession[]>(FILE, [], (sessions) =>
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

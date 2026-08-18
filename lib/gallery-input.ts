import "server-only";
import { isoDate, text } from "./api";
import {
  expiryLabel,
  isExpired,
  loadSessions,
  longDate,
  makePassphrase,
  revealWord,
  shootLabel,
  type ClientSession,
  type SessionPhoto,
} from "./client-sessions";

/**
 * Turning a submitted client-gallery worksheet into a stored record, and
 * describing the drawer back to the admin page.
 */

type GalleryPhotoInput = {
  id?: string;
  file?: string;
  uploaded?: boolean;
  plate?: string;
  ratio?: string;
  pos?: string;
  bytes?: number;
};

export type GalleryInput = {
  name?: string;
  hand?: string;
  word?: string;
  shotOn?: string;
  expiresOn?: string | null;
  photos?: GalleryPhotoInput[];
};

/** What the admin listing shows for one shoot — including the word. */
export type AdminGallery = {
  id: string;
  name: string;
  hand: string;
  word: string;
  shotOn: string;
  shotLabel: string;
  expiresOn: string | null;
  expiryLabel: string;
  expiryLong: string;
  expired: boolean;
  shoot: string;
  photos: Array<{
    id: string;
    /** Stored file, so an edit can hand the same frames back. */
    file: string;
    src: string;
    plate: string;
    ratio: string;
    pos: string;
    bytes?: number;
  }>;
};

function cleanPhoto(input: GalleryPhotoInput, index: number): SessionPhoto | null {
  const file = typeof input.file === "string" ? input.file : "";
  // Either a seeded file under /public, or an upload id we minted.
  const uploaded = /^[0-9a-f]{16}\.jpg$/.test(file);
  if (!uploaded && !/^photos\/[\w.-]+$/.test(file)) return null;
  return {
    id: text(input.id, 60) || `f${index + 1}-${Date.now().toString(36)}`,
    file,
    uploaded,
    plate: text(input.plate, 80) || `IMG ${String(index + 1).padStart(4, "0")}`,
    ratio: /^[\d.]+ ?\/ ?[\d.]+$/.test(input.ratio ?? "") ? input.ratio! : "1 / 1",
    pos: /^[\d.]+% [\d.]+%$/.test(input.pos ?? "") ? input.pos! : "50% 50%",
    ...(typeof input.bytes === "number" && input.bytes > 0
      ? { bytes: Math.round(input.bytes) }
      : {}),
  };
}

export function applyGalleryInput(
  session: ClientSession,
  input: GalleryInput,
  isNew: boolean,
): { session: ClientSession } | { error: string } {
  const name = input.name === undefined ? session.name : text(input.name, 120);
  if (!name) return { error: "A name helps me find it again." };

  const word = text(input.word, 60).toLowerCase();
  if (isNew && !word) return { error: "They'll need a word to get in." };
  if (input.word !== undefined && !word) {
    return { error: "They'll need a word to get in." };
  }

  const submitted = (input.photos ?? []).map((photo, index) =>
    cleanPhoto(photo, index),
  );
  // Fail the whole worksheet rather than quietly losing a frame we can't read.
  if (submitted.some((photo) => photo === null)) {
    return { error: "One of those photographs didn't come through." };
  }
  const photos = submitted as SessionPhoto[];

  const shotOn = isoDate(input.shotOn) ?? session.shotOn;
  const expiresOn =
    input.expiresOn === undefined
      ? session.expiresOn
      : input.expiresOn === null || input.expiresOn === ""
        ? null
        : isoDate(input.expiresOn);

  // Keeps only survive on photographs that are still in the gallery.
  const ids = new Set(photos.map((photo) => photo.id));
  const kept = session.kept.filter((id) => ids.has(id));

  return {
    session: {
      ...session,
      name,
      hand: input.hand === undefined ? session.hand : text(input.hand, 300),
      shotOn,
      expiresOn,
      kept,
      photos: input.photos === undefined ? session.photos : photos,
      ...(word ? makePassphrase(word, session.salt) : {}),
    },
  };
}

export function toAdminGallery(session: ClientSession): AdminGallery {
  return {
    id: session.id,
    name: session.name,
    hand: session.hand,
    word: revealWord(session),
    shotOn: session.shotOn,
    shotLabel: longDate(session.shotOn),
    expiresOn: session.expiresOn,
    expiryLabel: expiryLabel(session),
    expiryLong: longDate(session.expiresOn),
    expired: isExpired(session),
    shoot: shootLabel(session),
    photos: session.photos.map((photo) => ({
      id: photo.id,
      file: photo.file,
      // The admin's own thumbnails come through the same gated route.
      src: `/api/admin/galleries/${session.id}/photo/${photo.id}`,
      plate: photo.plate,
      ratio: photo.ratio,
      pos: photo.pos,
      ...(photo.bytes ? { bytes: photo.bytes } : {}),
    })),
  };
}

export async function listForAdmin(): Promise<AdminGallery[]> {
  return (await loadSessions()).map(toAdminGallery);
}

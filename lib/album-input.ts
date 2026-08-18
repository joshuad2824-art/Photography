import "server-only";
import { text } from "./api";
import {
  HOME_MAX,
  countHomePicks,
  type Album,
  type AlbumPhoto,
} from "./albums";

/**
 * Turning a submitted album worksheet into a stored record: what the admin
 * page is allowed to set, and the one rule the home page imposes.
 */

type PhotoInput = {
  id?: string;
  src?: string;
  plate?: string;
  cap?: string;
  home?: boolean;
  ratio?: string;
  pos?: string;
  exif?: string;
};

export type AlbumInput = {
  name?: string;
  sub?: string;
  hand?: string;
  note?: string;
  live?: boolean;
  cover?: number;
  photos?: PhotoInput[];
};

/** Keeps a submitted photo row to the shape the store holds. */
export function cleanPhoto(input: PhotoInput, index: number): AlbumPhoto | null {
  const src = typeof input.src === "string" ? input.src : "";
  // Only our own two sources: a seeded file, or an upload we minted.
  if (!/^\/photos\/[\w.-]+$/.test(src) && !/^\/api\/photos\/[\w.]+$/.test(src)) {
    return null;
  }
  return {
    id: text(input.id, 60) || `p${index + 1}-${Date.now().toString(36)}`,
    src,
    plate: text(input.plate, 80),
    cap: text(input.cap, 300),
    home: input.home === true,
    ratio: /^[\d.]+ ?\/ ?[\d.]+$/.test(input.ratio ?? "") ? input.ratio! : "1 / 1",
    pos: /^[\d.]+% [\d.]+%$/.test(input.pos ?? "") ? input.pos! : "50% 50%",
    ...(input.exif ? { exif: text(input.exif, 80) } : {}),
  };
}

/**
 * Applies a submitted worksheet to an album, holding the home-page strip to
 * three: a fourth pick is refused rather than quietly bumping someone out.
 */
export function applyInput(
  album: Album,
  input: AlbumInput,
  others: Album[],
): { album: Album } | { error: string } {
  const submitted = (input.photos ?? album.photos) as PhotoInput[];
  const photos = submitted.map((photo, index) => cleanPhoto(photo, index));
  // Fail the whole worksheet rather than quietly losing a row we can't read.
  if (photos.some((photo) => photo === null)) {
    return { error: "One of those photographs didn't come through." };
  }

  const kept = photos as AlbumPhoto[];
  const elsewhere = countHomePicks(others);
  const here = kept.filter((photo) => photo.home).length;
  if (elsewhere + here > HOME_MAX) {
    return {
      error: "Three is all the home page has room for — take one out first.",
    };
  }

  const name = input.name === undefined ? album.name : text(input.name, 120);
  if (!name) return { error: "A pile needs a name." };

  return {
    album: {
      ...album,
      name,
      sub: input.sub === undefined ? album.sub : text(input.sub, 120),
      hand: input.hand === undefined ? album.hand : text(input.hand, 300),
      note: input.note === undefined ? album.note : text(input.note, 600),
      live: input.live === undefined ? album.live : input.live === true,
      cover:
        typeof input.cover === "number"
          ? Math.max(0, Math.min(input.cover, Math.max(0, kept.length - 1)))
          : Math.max(0, Math.min(album.cover, Math.max(0, kept.length - 1))),
      photos: kept,
    },
  };
}

/**
 * The public albums — "piles" in Joshua's language.
 *
 * The shape the admin page writes and the public pages read. Kept apart from
 * the store so client components can share it.
 */

/** The home page's "Pasted in lately" strip holds three prints. */
export const HOME_MAX = 3;

export type AlbumPhoto = {
  id: string;
  /** What the browser loads: a path under /public, or /api/photos/<id>. */
  src: string;
  /** Plate number, free text — "Plate 01 · Fifth & Boston", "IMG 4412". */
  plate: string;
  /** Hand-written caption. Empty is fine; the line just doesn't show. */
  cap: string;
  /** In the home page's "Pasted in lately" strip. */
  home: boolean;
  /** Crop, seeded from the prototypes; uploads use their natural shape. */
  ratio: string;
  pos: string;
  /** EXIF-style line under the lightbox. Seeded; not authored in the admin. */
  exif?: string;
};

export type Album = {
  id: string;
  name: string;
  /** Mono line on the index card — "Tulsa · ongoing". */
  sub: string;
  /** Hand-written line under the title on the index card. Edited in place. */
  hand: string;
  /** Hand-written note at the top of the album. Edited in place. */
  note: string;
  /** Dark chip on the index card. Seeded; not authored in the admin. */
  category?: string;
  /** Drafts are invisible to everyone but Joshua. */
  live: boolean;
  /** Index into photos. */
  cover: number;
  photos: AlbumPhoto[];
};

export function coverPhoto(album: Album): AlbumPhoto | undefined {
  return album.photos[album.cover] ?? album.photos[0];
}

/** How many photographs are already claiming a home-page slot. */
export function countHomePicks(albums: Album[]): number {
  return albums.reduce(
    (total, album) =>
      total + album.photos.filter((photo) => photo.home).length,
    0,
  );
}

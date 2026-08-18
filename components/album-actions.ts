"use client";

import type { Album } from "@/lib/albums";

/**
 * The one write the public pages make: a signed-in Joshua rewriting an album's
 * own copy by clicking it. Everything else goes through the admin page.
 */
export async function patchAlbum(
  id: string,
  patch: Partial<Album>,
): Promise<Response> {
  return fetch(`/api/admin/albums/${id}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  });
}

/** Rewrites one photograph's caption without disturbing the rest of the pile. */
export function patchCaption(album: Album, photoId: string, cap: string) {
  return patchAlbum(album.id, {
    photos: album.photos.map((photo) =>
      photo.id === photoId ? { ...photo, cap } : photo,
    ),
  });
}

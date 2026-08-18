import { NextResponse } from "next/server";
import { badRequest, notFound, readBody, requireAdmin } from "@/lib/api";
import { loadAlbums, saveAlbums } from "@/lib/albums";
import { applyInput, type AlbumInput } from "@/lib/album-input";

export const runtime = "nodejs";

/**
 * Saves a worksheet, or one field of it — the same route serves the album
 * editor, the Publish it / Take it off the site action, and a caption edited
 * by clicking it on the live page.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const input = await readBody<AlbumInput>(request);
  if (!input) return badRequest();

  const albums = await loadAlbums();
  const existing = albums.find((album) => album.id === id);
  if (!existing) return notFound("No pile by that name.");

  const result = applyInput(
    existing,
    input,
    albums.filter((album) => album.id !== id),
  );
  if ("error" in result) return badRequest(result.error);

  await saveAlbums((current) =>
    current.map((album) => (album.id === id ? result.album : album)),
  );
  return NextResponse.json({ album: result.album });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const albums = await saveAlbums((current) =>
    current.filter((album) => album.id !== id),
  );
  return NextResponse.json({ albums });
}

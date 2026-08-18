import { NextResponse } from "next/server";
import { badRequest, readBody, requireAdmin, slugId, text } from "@/lib/api";
import { loadAlbums, saveAlbums, type Album } from "@/lib/albums";
import { applyInput, type AlbumInput } from "@/lib/album-input";

export const runtime = "nodejs";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json({ albums: await loadAlbums() });
}

/** A new pile. Drafts by default — nothing reaches the site until published. */
export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const input = await readBody<AlbumInput>(request);
  if (!input) return badRequest();

  const current = await loadAlbums();
  const blank: Album = {
    id: slugId(text(input.name, 120), new Set(current.map((a) => a.id))),
    name: "",
    sub: "",
    hand: "",
    note: "",
    live: false,
    cover: 0,
    photos: [],
  };

  const result = applyInput(blank, input, current);
  if ("error" in result) return badRequest(result.error);

  await saveAlbums((albums) => [...albums, result.album]);
  return NextResponse.json({ album: result.album });
}

/** Reordering: the whole list of ids, top of the list first on Galleries. */
export async function PUT(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const input = await readBody<{ order?: string[] }>(request);
  if (!Array.isArray(input?.order)) return badRequest();

  const albums = await saveAlbums((current) => {
    const byId = new Map(current.map((album) => [album.id, album]));
    const ordered = input.order!
      .map((id) => byId.get(id))
      .filter((album): album is Album => album !== undefined);
    // Anything the client didn't mention keeps its place at the end.
    const seen = new Set(ordered.map((album) => album.id));
    return [...ordered, ...current.filter((album) => !seen.has(album.id))];
  });

  return NextResponse.json({ albums });
}

import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { loadAlbums } from "@/lib/albums";
import { isAdmin } from "@/lib/auth";
import { uploadPath } from "@/lib/uploads";

export const runtime = "nodejs";

/**
 * Uploaded album photographs.
 *
 * Only ids a published album actually references are served — a draft's
 * photographs stay Joshua's until he publishes, and an upload belonging to a
 * client's private gallery is never reachable here.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[0-9a-f]{16}\.jpg$/.test(id)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const albums = await loadAlbums();
  const admin = await isAdmin();
  const src = `/api/photos/${id}`;
  const referenced = albums.some(
    (album) => (album.live || admin) && album.photos.some((p) => p.src === src),
  );
  if (!referenced) return new NextResponse("Not found", { status: 404 });

  const file = uploadPath(id);
  const info = await stat(file).catch(() => null);
  if (!info) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(
    Readable.toWeb(createReadStream(file)) as unknown as ReadableStream<Uint8Array>,
    {
      headers: {
        "content-type": "image/jpeg",
        "content-length": String(info.size),
        // Content-addressed: these bytes never change under this id.
        "cache-control": "public, max-age=31536000, immutable",
      },
    },
  );
}

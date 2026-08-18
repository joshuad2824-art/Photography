import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { notFound, requireAdmin } from "@/lib/api";
import { getSession, photoPath } from "@/lib/client-sessions";

export const runtime = "nodejs";

/** Thumbnails for the admin's own listing, behind the same cookie. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; photoId: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id, photoId } = await params;
  const session = await getSession(id);
  const photo = session?.photos.find((candidate) => candidate.id === photoId);
  if (!photo) return notFound();

  const file = photoPath(photo);
  const info = await stat(file).catch(() => null);
  if (!info) return notFound("File is missing.");

  return new NextResponse(
    Readable.toWeb(createReadStream(file)) as unknown as ReadableStream<Uint8Array>,
    {
      headers: {
        "content-type": "image/jpeg",
        "content-length": String(info.size),
        "cache-control": "private, max-age=300",
      },
    },
  );
}

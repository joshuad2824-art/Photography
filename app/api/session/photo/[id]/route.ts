import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { currentGallery } from "@/lib/auth";
import { photoPath } from "@/lib/client-sessions";

export const runtime = "nodejs";

/**
 * One of a client's photographs — inline for the gallery itself (`?view=1`),
 * or as a download. Either way the file path comes from the gallery record,
 * never from the request, so there is nothing to traverse.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await currentGallery();
  if (!session) {
    return NextResponse.json({ message: "Drawer is closed." }, { status: 401 });
  }

  const { id } = await params;
  const photo = session.photos.find((candidate) => candidate.id === id);
  if (!photo) {
    return NextResponse.json({ message: "Not your photo." }, { status: 404 });
  }

  const file = photoPath(photo);
  const info = await stat(file).catch(() => null);
  if (!info) {
    return NextResponse.json({ message: "File is missing." }, { status: 404 });
  }

  const inline = new URL(request.url).searchParams.get("view") === "1";
  const filename = `${session.name.replace(/[^\w]+/g, "-")}-${photo.plate.replace(/\s+/g, "-")}${path.extname(file)}`;

  return new NextResponse(
    Readable.toWeb(createReadStream(file)) as unknown as ReadableStream<Uint8Array>,
    {
      headers: {
        "content-type": "image/jpeg",
        "content-length": String(info.size),
        "content-disposition": inline
          ? "inline"
          : `attachment; filename="${filename}"`,
        // Private: a shared proxy must never hold a client's photographs.
        "cache-control": inline ? "private, max-age=300" : "private, no-store",
      },
    },
  );
}

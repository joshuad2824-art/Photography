import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { currentGallery } from "@/lib/auth";

export const runtime = "nodejs";

const PHOTO_ROOT = path.join(process.cwd(), "public");

/**
 * One full-size original. The file path comes from the gallery record, never
 * from the request, so there is nothing to traverse.
 */
export async function GET(
  _request: Request,
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

  const file = path.join(PHOTO_ROOT, photo.file);
  const info = await stat(file).catch(() => null);
  if (!info) {
    return NextResponse.json({ message: "File is missing." }, { status: 404 });
  }

  const filename = `${session.name.replace(/[^\w]+/g, "-")}-${photo.plate.replace(/\s+/g, "-")}${path.extname(photo.file)}`;
  const stream = Readable.toWeb(
    createReadStream(file),
  ) as unknown as ReadableStream<Uint8Array>;

  return new NextResponse(stream, {
    headers: {
      "content-type": "image/jpeg",
      "content-length": String(info.size),
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "private, no-store",
    },
  });
}

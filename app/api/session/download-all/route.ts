import path from "node:path";
import { Readable } from "node:stream";
import { ZipArchive } from "archiver";
import { NextResponse } from "next/server";
import { currentGallery } from "@/lib/auth";
import { photoPath } from "@/lib/client-sessions";

export const runtime = "nodejs";

/**
 * Zip-on-demand for "Download all full-size".
 *
 * Photographs are already compressed, so the archive is stored rather than
 * deflated — the client gets their files without the server burning CPU.
 */
export async function GET() {
  const session = await currentGallery();
  if (!session) {
    return NextResponse.json({ message: "Drawer is closed." }, { status: 401 });
  }

  const archive = new ZipArchive({ store: true });
  const folder = session.name.replace(/[^\w]+/g, "-");

  for (const photo of session.photos) {
    archive.file(photoPath(photo), {
      name: `${folder}/${photo.plate.replace(/\s+/g, "-")}.jpg`,
    });
  }

  // Errors surface as a truncated download; log them so they aren't silent.
  archive.on("warning", (error: unknown) => console.warn("[download-all]", error));
  archive.on("error", (error: unknown) => console.error("[download-all]", error));
  void archive.finalize();

  const stream = Readable.toWeb(
    archive as unknown as Readable,
  ) as unknown as ReadableStream<Uint8Array>;

  return new NextResponse(stream, {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${folder}-full-size.zip"`,
      "cache-control": "private, no-store",
    },
  });
}

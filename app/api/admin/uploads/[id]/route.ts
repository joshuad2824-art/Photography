import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { notFound, requireAdmin } from "@/lib/api";
import { uploadPath } from "@/lib/uploads";

export const runtime = "nodejs";

/** Preview of a just-uploaded frame, before the worksheet is saved. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  if (!/^[0-9a-f]{16}\.jpg$/.test(id)) return notFound();

  const file = uploadPath(id);
  const info = await stat(file).catch(() => null);
  if (!info) return notFound();

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

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { IMAGE_IDS, type ImageId } from "@/lib/content";
import { loadImages, saveImage } from "@/lib/site-content";

export const runtime = "nodejs";

const UPLOAD_DIR = path.join(
  process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(process.cwd(), "data"),
  "uploads",
);

const MAX_BYTES = 8 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

function assertKnownId(id: string): ImageId {
  if (!(IMAGE_IDS as readonly string[]).includes(id)) {
    throw new Error("unknown image id");
  }
  return id as ImageId;
}

/** Serves the current upload for an image slot. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let imageId: ImageId;
  try {
    imageId = assertKnownId(id);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  const stored = (await loadImages())[imageId];
  if (!stored) return new NextResponse("Not found", { status: 404 });

  try {
    const bytes = await readFile(path.join(UPLOAD_DIR, stored.file));
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "content-type": stored.mime,
        // The URL carries ?v=<updatedAt>, so the bytes themselves never change.
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}

/** Replaces the photo in an image slot. Admin only. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ message: "Not signed in." }, { status: 401 });
  }

  const { id } = await params;
  let imageId: ImageId;
  try {
    imageId = assertKnownId(id);
  } catch {
    return NextResponse.json({ message: "Unknown slot." }, { status: 404 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "No photo attached." }, { status: 400 });
  }

  const extension = EXTENSIONS[file.type];
  if (!extension) {
    return NextResponse.json(
      { message: "JPEG, PNG, WebP or AVIF, please." },
      { status: 415 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { message: "That photo is over 8 MB — shrink it a little." },
      { status: 413 },
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const digest = createHash("sha256").update(bytes).digest("hex").slice(0, 12);
  const name = `${imageId.replace(/[^a-z0-9.-]/gi, "_")}-${digest}.${extension}`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), bytes);

  const updatedAt = Date.now();
  await saveImage(imageId, { file: name, mime: file.type, updatedAt });

  return NextResponse.json({ url: `/api/images/${imageId}?v=${updatedAt}` });
}

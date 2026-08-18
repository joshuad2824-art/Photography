import { NextResponse } from "next/server";
import { currentGallery } from "@/lib/auth";
import { setKept } from "@/lib/client-sessions";

export const runtime = "nodejs";

/** "Keep this one" — persisted per gallery so Joshua sees the picks too. */
export async function POST(request: Request) {
  const session = await currentGallery();
  if (!session) {
    return NextResponse.json({ message: "Drawer is closed." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    photoId?: string;
    kept?: boolean;
  } | null;

  if (!body?.photoId || typeof body.kept !== "boolean") {
    return NextResponse.json({ message: "Bad request." }, { status: 400 });
  }

  if (!session.photos.some((photo) => photo.id === body.photoId)) {
    return NextResponse.json({ message: "Not your photo." }, { status: 404 });
  }

  const kept = await setKept(session.id, body.photoId, body.kept);
  return NextResponse.json({ kept });
}

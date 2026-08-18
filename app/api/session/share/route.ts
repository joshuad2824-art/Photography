import { NextResponse } from "next/server";
import { currentGallery, makeShareToken } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * "Copy a link for family": a signed link into the same gallery, so nobody has
 * to be told the word. It expires with the gallery.
 */
export async function GET(request: Request) {
  const session = await currentGallery();
  if (!session) {
    return NextResponse.json({ message: "Drawer is closed." }, { status: 401 });
  }

  const origin = new URL(request.url).origin;
  const token = makeShareToken(session);
  return NextResponse.json({
    url: `${origin}/api/session/open?token=${encodeURIComponent(token)}`,
  });
}

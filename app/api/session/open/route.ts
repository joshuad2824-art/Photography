import { NextResponse } from "next/server";
import { openGallery, redeemShareToken } from "@/lib/auth";

export const runtime = "nodejs";

/** Redeems a family share link, then hands the visitor to the gallery page. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const session = await redeemShareToken(token);

  if (!session) {
    return NextResponse.redirect(new URL("/session?link=expired", url.origin));
  }

  await openGallery(session);
  return NextResponse.redirect(new URL("/session", url.origin));
}

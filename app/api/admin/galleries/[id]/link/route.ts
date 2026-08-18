import { NextResponse } from "next/server";
import { notFound, requireAdmin } from "@/lib/api";
import { makeShareToken } from "@/lib/auth";
import { getSession } from "@/lib/client-sessions";

export const runtime = "nodejs";

/** "Copy the link" — the family link that opens the gallery without the word. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const session = await getSession(id);
  if (!session) return notFound("No gallery by that name.");

  const origin = new URL(request.url).origin;
  const token = makeShareToken(session);
  return NextResponse.json({
    url: `${origin}/api/session/open?token=${encodeURIComponent(token)}`,
  });
}

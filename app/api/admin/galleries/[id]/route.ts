import { NextResponse } from "next/server";
import { badRequest, notFound, readBody, requireAdmin } from "@/lib/api";
import { applyGalleryInput, listForAdmin, type GalleryInput } from "@/lib/gallery-input";
import { loadSessions, saveSessions } from "@/lib/client-sessions";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const input = await readBody<GalleryInput>(request);
  if (!input) return badRequest();

  const existing = (await loadSessions()).find((session) => session.id === id);
  if (!existing) return notFound("No gallery by that name.");

  const result = applyGalleryInput(existing, input, false);
  if ("error" in result) return badRequest(result.error);

  await saveSessions((sessions) =>
    sessions.map((session) => (session.id === id ? result.session : session)),
  );
  return NextResponse.json({ galleries: await listForAdmin() });
}

/** "Take it down" — the record goes, and the word stops working straight away. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  await saveSessions((sessions) => sessions.filter((s) => s.id !== id));
  return NextResponse.json({ galleries: await listForAdmin() });
}

import { NextResponse } from "next/server";
import { badRequest, readBody, requireAdmin, slugId } from "@/lib/api";
import { applyGalleryInput, listForAdmin, type GalleryInput } from "@/lib/gallery-input";
import { loadSessions, newSalt, saveSessions, type ClientSession } from "@/lib/client-sessions";

export const runtime = "nodejs";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json({ galleries: await listForAdmin() });
}

/** A new shoot. Newest first, the way the drawer reads. */
export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const input = await readBody<GalleryInput>(request);
  if (!input) return badRequest();

  const current = await loadSessions();
  const blank: ClientSession = {
    id: slugId(
      typeof input.name === "string" ? input.name : "",
      new Set(current.map((session) => session.id)),
    ),
    name: "",
    hand: "",
    shotOn: new Date().toISOString().slice(0, 10),
    expiresOn: null,
    salt: newSalt(),
    passphraseHashes: [],
    sealedWord: "",
    kept: [],
    photos: [],
  };

  const result = applyGalleryInput(blank, input, true);
  if ("error" in result) return badRequest(result.error);

  await saveSessions((sessions) => [result.session, ...sessions]);
  return NextResponse.json({ galleries: await listForAdmin() });
}

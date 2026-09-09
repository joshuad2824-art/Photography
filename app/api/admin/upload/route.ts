import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";
import { MAX_REQUEST_BYTES, whyNotSendable } from "@/lib/photo-files";
import { storeUpload, unreadableReason, type StoredUpload } from "@/lib/uploads";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Takes photographs off the card and hands back what the editor needs.
 *
 * Nothing is judged by the MIME type the browser attached — a frame off a card
 * often arrives without one. The decoder reads the bytes, and whatever it
 * can't read comes back named, so the editor can say which frame to go back
 * for instead of falling silent.
 */
export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  // The body is buffered whole before a single frame of it can be read, so an
  // oversized one is turned away on its header. The zone sends in batches; a
  // stale tab that doesn't would otherwise take the machine down with it.
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_REQUEST_BYTES) {
    return NextResponse.json(
      {
        message:
          "That's a lot in one go — pick them in smaller handfuls and they'll all land.",
      },
      { status: 413 },
    );
  }

  const form = await request.formData().catch(() => null);
  const files = form?.getAll("files").filter((f): f is File => f instanceof File);
  if (!files?.length) {
    return NextResponse.json({ message: "No photographs attached." }, { status: 400 });
  }

  const stored: StoredUpload[] = [];
  const skipped: string[] = [];

  for (const file of files) {
    const refused = whyNotSendable(file);
    if (refused) {
      skipped.push(refused);
      continue;
    }
    try {
      stored.push(await storeUpload(file));
    } catch {
      skipped.push(unreadableReason(file.name));
    }
  }

  if (!stored.length) {
    return NextResponse.json(
      { message: skipped[0] ?? "Nothing to add.", skipped },
      { status: 415 },
    );
  }

  return NextResponse.json({ photos: stored, skipped });
}

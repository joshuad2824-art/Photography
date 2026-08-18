import { NextResponse } from "next/server";
import { openGallery } from "@/lib/auth";
import { findByPassphrase, isExpired } from "@/lib/client-sessions";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * The passphrase check, server-side. The word list never leaves this process,
 * and a wrong word is indistinguishable from an unknown one.
 */
export async function POST(request: Request) {
  const limit = rateLimit(clientKey(request, "unlock"), {
    limit: 12,
    windowMs: 10 * 60 * 1000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { message: "That's a lot of guesses. Give it a few minutes." },
      { status: 429, headers: { "retry-after": String(limit.retryAfter) } },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    passphrase?: string;
  } | null;

  const word = body?.passphrase?.trim() ?? "";
  if (!word) {
    return NextResponse.json(
      { message: "I'll need the word first." },
      { status: 400 },
    );
  }

  const session = await findByPassphrase(word);
  if (!session) {
    return NextResponse.json(
      { message: "That one doesn't open anything — try the word I sent you." },
      { status: 401 },
    );
  }

  if (isExpired(session)) {
    return NextResponse.json(
      { message: "That gallery has come down. Write to me and I'll put it back up." },
      { status: 410 },
    );
  }

  await openGallery(session);
  return NextResponse.json({ ok: true });
}

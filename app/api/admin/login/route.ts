import { NextResponse } from "next/server";
import { checkAdminPassword, signInAdmin } from "@/lib/auth";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limit = rateLimit(clientKey(request, "admin"), {
    limit: 8,
    windowMs: 10 * 60 * 1000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { message: "Too many attempts. Try again shortly." },
      { status: 429, headers: { "retry-after": String(limit.retryAfter) } },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    password?: string;
  } | null;

  if (!body?.password || !checkAdminPassword(body.password)) {
    return NextResponse.json({ message: "That isn't it." }, { status: 401 });
  }

  await signInAdmin();
  return NextResponse.json({ ok: true });
}

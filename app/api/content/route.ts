import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { saveText } from "@/lib/site-content";

export const runtime = "nodejs";

/** One edited block of copy. Admin-only; unknown ids are rejected. */
export async function PUT(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ message: "Not signed in." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    id?: string;
    value?: string;
  } | null;

  if (!body?.id || typeof body.value !== "string") {
    return NextResponse.json({ message: "Bad request." }, { status: 400 });
  }

  if (body.value.length > 4000) {
    return NextResponse.json({ message: "That's too long." }, { status: 413 });
  }

  try {
    await saveText(body.id, body.value);
  } catch {
    return NextResponse.json(
      { message: "I don't know that block." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";
import { ACCEPTED, MAX_UPLOAD_BYTES, storeUpload } from "@/lib/uploads";

export const runtime = "nodejs";
export const maxDuration = 120;

/** Takes photographs off the card and hands back what the editor needs. */
export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const form = await request.formData().catch(() => null);
  const files = form?.getAll("files").filter((f): f is File => f instanceof File);
  if (!files?.length) {
    return NextResponse.json({ message: "No photographs attached." }, { status: 400 });
  }

  const stored = [];
  const skipped: string[] = [];

  for (const file of files) {
    if (!ACCEPTED.has(file.type)) {
      skipped.push(`${file.name} isn't a photograph I can read`);
      continue;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      skipped.push(`${file.name} is over 40 MB`);
      continue;
    }
    try {
      stored.push(await storeUpload(file));
    } catch {
      skipped.push(`${file.name} wouldn't open`);
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

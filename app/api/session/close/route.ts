import { NextResponse } from "next/server";
import { closeGallery } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  await closeGallery();
  return NextResponse.json({ ok: true });
}

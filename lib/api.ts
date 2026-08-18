import "server-only";
import { NextResponse } from "next/server";
import { isAdmin } from "./auth";

/** Every admin route starts here: no cookie, no data, no hints. */
export async function requireAdmin(): Promise<NextResponse | null> {
  if (await isAdmin()) return null;
  return NextResponse.json({ message: "Not signed in." }, { status: 401 });
}

export async function readBody<T>(request: Request): Promise<T | null> {
  return (await request.json().catch(() => null)) as T | null;
}

export function badRequest(message = "Bad request.") {
  return NextResponse.json({ message }, { status: 400 });
}

export function notFound(message = "Not found.") {
  return NextResponse.json({ message }, { status: 404 });
}

/** Trims a free-text field and caps it so one paste can't fill the store. */
export function text(value: unknown, max = 400): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

/** An ISO date (YYYY-MM-DD), or null if it isn't one. */
export function isoDate(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()) ? null : value;
}

/** A url-safe id from a name, with a short suffix so two shoots can share one. */
export function slugId(name: string, existing: Set<string>): string {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "untitled";
  if (!existing.has(base)) return base;
  let n = 2;
  while (existing.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

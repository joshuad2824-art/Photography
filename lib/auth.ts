import "server-only";
import { cookies } from "next/headers";
import { constantTimeEquals, sign, verify } from "./crypto";
import { getSession, isExpired, type ClientSession } from "./client-sessions";

/**
 * Server-side auth for both doors in the site:
 *  - the admin door (one shared password, per the client's direction), and
 *  - a client's private gallery (one passphrase per shoot).
 *
 * Both issue httpOnly, signed cookies. Nothing secret ships in the bundle.
 */

export const ADMIN_COOKIE = "jd_admin";
export const SESSION_COOKIE = "jd_session";

const ADMIN_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const DEV_ADMIN_PASSWORD = "lamplight";

function adminPassword(): string {
  const fromEnv = process.env.ADMIN_PASSWORD;
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_PASSWORD must be set in production.");
  }
  return DEV_ADMIN_PASSWORD;
}

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

/* --- Admin ---------------------------------------------------------------- */

export function checkAdminPassword(candidate: string): boolean {
  return constantTimeEquals((candidate ?? "").trim(), adminPassword());
}

export async function signInAdmin(): Promise<void> {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, sign(`admin:${Date.now()}`), {
    ...cookieBase,
    maxAge: ADMIN_MAX_AGE,
  });
}

export async function signOutAdmin(): Promise<void> {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  const payload = verify(jar.get(ADMIN_COOKIE)?.value);
  return payload?.startsWith("admin:") ?? false;
}

/* --- Client galleries ----------------------------------------------------- */

function sessionMaxAge(session: ClientSession): number {
  if (!session.expiresOn) return 60 * 60 * 24 * 30;
  const ms = new Date(`${session.expiresOn}T23:59:59Z`).getTime() - Date.now();
  return Math.max(60, Math.floor(ms / 1000));
}

export async function openGallery(session: ClientSession): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, sign(`session:${session.id}`), {
    ...cookieBase,
    maxAge: sessionMaxAge(session),
  });
}

export async function closeGallery(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/** The client session this browser has open, or null. Expiry is re-checked here. */
export async function currentGallery(): Promise<ClientSession | null> {
  const jar = await cookies();
  const payload = verify(jar.get(SESSION_COOKIE)?.value);
  if (!payload?.startsWith("session:")) return null;
  const session = await getSession(payload.slice("session:".length));
  if (!session || isExpired(session)) return null;
  return session;
}

/* --- Family share links --------------------------------------------------- */

/**
 * "Copy a link for family" — a signed token that opens the same drawer without
 * the word. It carries no more access than the passphrase already granted.
 */
export function makeShareToken(session: ClientSession): string {
  return sign(`share:${session.id}`);
}

export async function redeemShareToken(
  token: string,
): Promise<ClientSession | null> {
  const payload = verify(token);
  if (!payload?.startsWith("share:")) return null;
  const session = await getSession(payload.slice("share:".length));
  if (!session || isExpired(session)) return null;
  return session;
}

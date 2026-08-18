import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Small signing helpers shared by the admin session and the client-gallery
 * cookie. Both are stateless tokens: `<payload>.<hmac>`, base64url encoded.
 */

const DEV_SECRET = "timber-and-ink-development-secret";

function secret(): string {
  const fromEnv = process.env.SESSION_SECRET;
  if (fromEnv && fromEnv.length >= 16) return fromEnv;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET must be set (32+ random characters) in production.",
    );
  }
  return DEV_SECRET;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

export function sign(payload: string): string {
  const mac = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${b64url(payload)}.${mac}`;
}

export function verify(token: string | undefined): string | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const payload = Buffer.from(token.slice(0, dot), "base64url").toString();
  const expected = createHmac("sha256", secret())
    .update(payload)
    .digest("base64url");
  if (!constantTimeEquals(token.slice(dot + 1), expected)) return null;
  return payload;
}

export function constantTimeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Salted hash for stored passphrases, so the word list is never at rest in the clear. */
export function hashPassphrase(word: string, salt: string): string {
  return createHmac("sha256", salt)
    .update(word.trim().toLowerCase())
    .digest("hex");
}

export function newSalt(): string {
  return randomBytes(16).toString("hex");
}

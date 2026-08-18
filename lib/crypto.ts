import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

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

/**
 * Reversible sealing for the one secret the admin page has to show back:
 * the word that opens a client's gallery. Verification still goes through the
 * salted hash above — this only exists so "the word is cottonwood" can be
 * printed on Joshua's own screen, and so the store on disk is not a plain
 * list of working passphrases.
 */
export function seal(text: string): string {
  const key = createHash("sha256").update(`seal:${secret()}`).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const body = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return [
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    body.toString("base64url"),
  ].join(".");
}

export function unseal(token: string | undefined): string | null {
  if (!token) return null;
  const [iv, tag, body] = token.split(".");
  if (!iv || !tag || !body) return null;
  try {
    const key = createHash("sha256").update(`seal:${secret()}`).digest();
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(iv, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(body, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}

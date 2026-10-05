import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

export const PENDING_LINE_COOKIE = "birthy_pending_line";
export const PENDING_LINE_TTL_SECONDS = 15 * 60;
export const AUTH_COOKIE = "birthy_session";
export const AUTH_TTL_SECONDS = 30 * 24 * 60 * 60;

type PendingLineSession = {
  kind: "pending-line";
  sub: string;
  name?: string;
  picture?: string;
  exp: number;
};

type AuthSession = {
  kind: "auth";
  userId: string;
  exp: number;
};

function getSessionKey(): Buffer {
  const secret = process.env.BIRTHY_SESSION_SECRET;

  if (!secret) {
    throw new Error("BIRTHY_SESSION_SECRET is not configured");
  }

  const key = Buffer.from(secret, "base64url");

  if (key.length !== 32) {
    throw new Error("BIRTHY_SESSION_SECRET must be a 32-byte base64url key");
  }

  return key;
}

function seal(payload: object): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getSessionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

function unseal<T extends { exp: number }>(token: string): T | null {
  try {
    const [ivPart, tagPart, encryptedPart] = token.split(".");
    if (!ivPart || !tagPart || !encryptedPart) return null;

    const decipher = createDecipheriv(
      "aes-256-gcm",
      getSessionKey(),
      Buffer.from(ivPart, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagPart, "base64url"));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedPart, "base64url")),
      decipher.final(),
    ]);
    const payload = JSON.parse(decrypted.toString("utf8")) as T;

    if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
export function createPendingLineSession(input: {
  sub: string;
  name?: string;
  picture?: string;
}): string {
  return seal({
    kind: "pending-line",
    ...input,
    exp: Math.floor(Date.now() / 1000) + PENDING_LINE_TTL_SECONDS,
  } satisfies PendingLineSession);
}

export function readPendingLineSession(token: string): PendingLineSession | null {
  const payload = unseal<PendingLineSession>(token);
  return payload?.kind === "pending-line" && payload.sub ? payload : null;
}

export function createAuthSession(userId: string): string {
  return seal({
    kind: "auth",
    userId,
    exp: Math.floor(Date.now() / 1000) + AUTH_TTL_SECONDS,
  } satisfies AuthSession);
}

export function readAuthSession(token: string): AuthSession | null {
  const payload = unseal<AuthSession>(token);
  return payload?.kind === "auth" && payload.userId ? payload : null;
}

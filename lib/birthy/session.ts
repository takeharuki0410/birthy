import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

export const PENDING_LINE_COOKIE = "birthy_pending_line";
export const PENDING_LINE_TTL_SECONDS = 15 * 60;

type PendingLineSession = {
  sub: string;
  name?: string;
  picture?: string;
  exp: number;
};

function getSessionKey(): Buffer {
  const secret = process.env.BIRTHY_SESSION_SECRET;

  if (!secret) {
    throw new Error("BIRTHY_SESSION_SECRET is not configured");
  }

  const key = Buffer.from(secret, "base64url");

  if (key.length !== 32) {
    throw new Error(
      "BIRTHY_SESSION_SECRET must be a 32-byte base64url key",
    );
  }

  return key;
}

export function createPendingLineSession(input: {
  sub: string;
  name?: string;
  picture?: string;
}): string {
  const payload: PendingLineSession = {
    ...input,
    exp:
      Math.floor(Date.now() / 1000) +
      PENDING_LINE_TTL_SECONDS,
  };

  const iv = randomBytes(12);

  const cipher = createCipheriv(
    "aes-256-gcm",
    getSessionKey(),
    iv,
  );

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

export function readPendingLineSession(
  token: string,
): PendingLineSession | null {
  try {
    const [ivPart, tagPart, encryptedPart] =
      token.split(".");

    if (!ivPart || !tagPart || !encryptedPart) {
      return null;
    }

    const decipher = createDecipheriv(
      "aes-256-gcm",
      getSessionKey(),
      Buffer.from(ivPart, "base64url"),
    );

    decipher.setAuthTag(
      Buffer.from(tagPart, "base64url"),
    );

    const decrypted = Buffer.concat([
      decipher.update(
        Buffer.from(encryptedPart, "base64url"),
      ),
      decipher.final(),
    ]);

    const payload = JSON.parse(
      decrypted.toString("utf8"),
    ) as PendingLineSession;

    if (
      !payload.sub ||
      !payload.exp ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
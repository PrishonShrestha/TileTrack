import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";

export const AUTH_COOKIE_NAME = "tiletrack_session";

export interface SessionPayload {
  username: string;
  role?: string;
  [key: string]: unknown;
}

function getAuthSecret(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ||
    "tiletrack-default-secret-key-at-least-32-chars-long";
  const encoded = new TextEncoder().encode(secret);
  return new Uint8Array(encoded);
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  const secret = getAuthSecret();
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const secret = getAuthSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export function getAdminCredentials() {
  return {
    username: process.env.AUTH_USERNAME || "admin",
    password: process.env.AUTH_PASSWORD || "admin",
  };
}

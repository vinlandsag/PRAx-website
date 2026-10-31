/**
 * src/lib/auth/session.ts
 *
 * Secure stateless session management for Next.js App Router.
 * Signs and verifies tamper-proof session tokens using HMAC-SHA256.
 * Uses timing-safe comparisons and enforces session expiration.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import type { SessionPayload, SessionUser } from "./types";

export const SESSION_COOKIE_NAME = "prax_session";
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSecretKey(): string {
  const secret = env.sessionSecret;
  if (secret.length < 32)
    throw new Error("A SESSION_SECRET of at least 32 characters is required.");
  return secret;
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf-8");
}

export function signSession(
  user: SessionUser,
  ttlMs: number = SESSION_DURATION_MS,
  options: { developmentOnly?: boolean } = {}
): string {
  if (options.developmentOnly && process.env.NODE_ENV !== "development")
    throw new Error("Development sessions cannot be created outside development.");
  const now = Date.now();
  const payload: SessionPayload = {
    user,
    ...(options.developmentOnly ? { developmentOnly: true as const } : {}),
    issuedAt: now,
    expiresAt: now + ttlMs,
  };

  const payloadJson = JSON.stringify(payload);
  const encodedPayload = base64UrlEncode(payloadJson);

  const signature = createHmac("sha256", getSecretKey()).update(encodedPayload).digest("base64url");

  return `${encodedPayload}.${signature}`;
}

export function verifySession(token: string | null | undefined): SessionPayload | null {
  if (!token || typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [encodedPayload, providedSignature] = parts;

  try {
    const expectedSignature = createHmac("sha256", getSecretKey())
      .update(encodedPayload)
      .digest("base64url");

    const expectedBuffer = Buffer.from(expectedSignature);
    const providedBuffer = Buffer.from(providedSignature);

    if (
      expectedBuffer.length !== providedBuffer.length ||
      !timingSafeEqual(expectedBuffer, providedBuffer)
    ) {
      return null;
    }

    const payloadJson = base64UrlDecode(encodedPayload);
    const payload = JSON.parse(payloadJson) as SessionPayload;

    if (payload.developmentOnly && process.env.NODE_ENV !== "development") return null;

    if (!payload.user || !payload.expiresAt) {
      return null;
    }

    if (Date.now() > payload.expiresAt) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

export function getSessionFromCookieHeader(
  cookieHeader: string | null | undefined
): SessionPayload | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((c) => c.trim());
  const sessionCookie = cookies.find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));

  if (!sessionCookie) return null;

  const token = sessionCookie.substring(SESSION_COOKIE_NAME.length + 1);
  return verifySession(token);
}

export function getSessionFromRequest(request: Request): SessionPayload | null {
  const cookieHeader = request.headers.get("cookie");
  return getSessionFromCookieHeader(cookieHeader);
}

export function getSessionCookieOptions(expiresAt?: number) {
  const isProd = process.env.NODE_ENV === "production";
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt ? new Date(expiresAt) : new Date(Date.now() + SESSION_DURATION_MS),
  };
}

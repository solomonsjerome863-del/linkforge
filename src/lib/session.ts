import crypto from "crypto";
import type { NextRequest, NextResponse } from "next/server";

/**
 * Lightweight session layer for LinkForge.
 *
 * Issues a signed, httpOnly cookie at login/signup and validates it on
 * protected routes. This replaces trusting a bare userId from the client.
 *
 * Stage 1 (current): cookie-first resolution with client-supplied userId
 * fallback so existing logged-in clients keep working.
 * Stage 2 (after all active users have re-logged-in once): remove the
 * fallback everywhere and rely on the cookie exclusively.
 *
 * Env: SESSION_SECRET (recommended: 32+ random characters). If unset, a
 * per-instance random secret is used — sessions reset when the server
 * restarts or redeploys (safe by default, but users must log in again).
 */

const COOKIE_NAME = "lf_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

let bootSecret: Buffer | null = null;

function getSecret(): Buffer {
  const fromEnv = process.env.SESSION_SECRET;
  if (fromEnv && fromEnv.trim().length >= 16) {
    return Buffer.from(fromEnv.trim(), "utf8");
  }
  if (!bootSecret) {
    bootSecret = crypto.randomBytes(32);
    console.warn(
      "[Session] SESSION_SECRET not set — using a per-instance secret. Sessions reset on redeploy/restart. Set SESSION_SECRET in your environment for stable sessions."
    );
  }
  return bootSecret;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function createSessionToken(userId: string): string {
  const expiresAt = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `${userId}|${expiresAt}`;
  return `${payload}|${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const parts = token.split("|");
  if (parts.length !== 3) return null;
  const [userId, expiresAt, mac] = parts;
  const payload = `${userId}|${expiresAt}`;
  const expected = sign(payload);
  const a = Buffer.from(mac, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  if (Number(expiresAt) < Date.now()) return null;
  if (!userId) return null;
  return userId;
}

/** Resolve the authenticated userId from the session cookie (or null). */
export function getSessionUserId(request: NextRequest): string | null {
  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  return verifySessionToken(cookie);
}

/** Issue the session cookie on a success response (login/signup). */
export function applySessionCookie(response: NextResponse, userId: string): void {
  response.cookies.set({
    name: COOKIE_NAME,
    value: createSessionToken(userId),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

/**
 * Transitional helper: prefer the cookie, fall back to the client-supplied
 * id (legacy behavior) until every client has re-logged-in once.
 * Logs a warning whenever the fallback is used so we can see adoption.
 */
export function resolveUserId(
  request: NextRequest,
  clientSupplied: string | null | undefined
): string | null {
  const fromCookie = getSessionUserId(request);
  if (fromCookie) return fromCookie;
  if (clientSupplied) {
    console.warn(
      "[Session] Falling back to client-supplied userId (no valid session cookie). Ask the user to log out and back in to receive a session cookie."
    );
    return clientSupplied;
  }
  return null;
}

/**
 * Secure PIN Authentication & HMAC-SHA256 Session Token Utility
 * Uses Web Crypto API so it works identically in Next.js Edge Middleware, Node.js, and Vitest.
 */

export const PIN_SESSION_COOKIE_NAME = "casamoral_pin_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

// SHA-256 hex digest of default PIN ("115141") — avoids storing plaintext default in source
const DEFAULT_PIN_SHA256 = "6592201205df83525aafde9af5154f1e27fbedbefb2e99d945ff6a4d66f6abdf";

const encoder = new TextEncoder();

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

export function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(input));
  return bytesToHex(new Uint8Array(digest));
}

function getAuthSecret(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.CRON_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "casamoral-local-dev-auth-secret-change-in-prod"
  );
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Verify input PIN against APP_ACCESS_PIN_HASH, APP_ACCESS_PIN, or default PIN hash.
 */
export async function verifyPin(inputPin: string): Promise<boolean> {
  const normalized = inputPin.trim();
  if (!/^\d{4,12}$/.test(normalized)) {
    return false;
  }

  const inputHash = await sha256Hex(normalized);

  const envHash = process.env.APP_ACCESS_PIN_HASH?.trim().toLowerCase();
  if (envHash && /^[a-f0-9]{64}$/.test(envHash)) {
    return timingSafeEqualStr(inputHash, envHash);
  }

  const envPin = process.env.APP_ACCESS_PIN?.trim();
  if (envPin) {
    const expectedHash = await sha256Hex(envPin);
    return timingSafeEqualStr(inputHash, expectedHash);
  }

  return timingSafeEqualStr(inputHash, DEFAULT_PIN_SHA256);
}

export interface PinSessionPayload {
  sub: string;
  iat: number;
  exp: number;
}

/**
 * Create an HMAC-SHA256 signed session token.
 */
export async function createPinSessionToken(ttlSeconds = SESSION_TTL_SECONDS): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: PinSessionPayload = {
    sub: "casamoral-admin",
    iat: now,
    exp: now + ttlSeconds,
  };
  const payloadB64 = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const key = await getHmacKey(getAuthSecret());
  const sigBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadB64));
  const sigB64 = toBase64Url(new Uint8Array(sigBuffer));
  return `${payloadB64}.${sigB64}`;
}

/**
 * Verify an HMAC-SHA256 signed session token and check expiration.
 */
export async function verifyPinSessionToken(token: string | undefined | null): Promise<PinSessionPayload | null> {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return null;

  try {
    const key = await getHmacKey(getAuthSecret());
    const expectedSigBuf = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadB64));
    const expectedSigB64 = toBase64Url(new Uint8Array(expectedSigBuf));

    if (!timingSafeEqualStr(sigB64, expectedSigB64)) {
      return null;
    }

    const decoded = new TextDecoder().decode(fromBase64Url(payloadB64));
    const payload = JSON.parse(decoded) as PinSessionPayload;
    const now = Math.floor(Date.now() / 1000);

    if (!payload || typeof payload.exp !== "number" || payload.exp <= now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

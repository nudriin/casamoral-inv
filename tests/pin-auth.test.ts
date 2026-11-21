import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  verifyPin,
  createPinSessionToken,
  verifyPinSessionToken,
} from "@/lib/auth/pin-auth";
import {
  checkPinRateLimit,
  recordFailedPinAttempt,
  clearPinAttempts,
} from "@/lib/auth/rate-limit";

describe("PIN Authentication & Session Security", () => {
  const origEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...origEnv };
    delete process.env.APP_ACCESS_PIN;
    delete process.env.APP_ACCESS_PIN_HASH;
  });

  afterEach(() => {
    process.env = origEnv;
  });

  it("verifies default PIN 115141 and rejects wrong PINs", async () => {
    expect(await verifyPin("115141")).toBe(true);
    expect(await verifyPin("000000")).toBe(false);
    expect(await verifyPin("115142")).toBe(false);
    expect(await verifyPin("abc")).toBe(false);
  });

  it("supports overriding PIN via APP_ACCESS_PIN env var", async () => {
    process.env.APP_ACCESS_PIN = "987654";
    expect(await verifyPin("987654")).toBe(true);
    expect(await verifyPin("115141")).toBe(false);
  });

  it("creates and verifies HMAC-SHA256 session tokens and rejects tampered tokens", async () => {
    const token = await createPinSessionToken(3600);
    const verified = await verifyPinSessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.sub).toBe("casamoral-admin");

    // Tamper payload
    const [payload, sig] = token.split(".");
    const tampered = `${payload}x.${sig}`;
    expect(await verifyPinSessionToken(tampered)).toBeNull();
    expect(await verifyPinSessionToken("invalid")).toBeNull();
    expect(await verifyPinSessionToken(null)).toBeNull();
  });

  it("rejects expired session tokens", async () => {
    const expiredToken = await createPinSessionToken(-10);
    expect(await verifyPinSessionToken(expiredToken)).toBeNull();
  });

  it("enforces rate limiting after 5 failed attempts and resets on clear", () => {
    const ip = "127.0.0.99";
    clearPinAttempts(ip);

    for (let i = 0; i < 5; i++) {
      expect(checkPinRateLimit(ip).allowed).toBe(true);
      recordFailedPinAttempt(ip);
    }

    const blocked = checkPinRateLimit(ip);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remainingAttempts).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);

    clearPinAttempts(ip);
    expect(checkPinRateLimit(ip).allowed).toBe(true);
  });
});

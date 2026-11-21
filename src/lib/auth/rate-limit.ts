/**
 * In-memory sliding-window rate limiter to protect PIN authentication from brute-force attempts.
 */

interface AttemptRecord {
  count: number;
  resetAt: number;
}

const attempts = new Map<string, AttemptRecord>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export function checkPinRateLimit(clientKey: string): {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const record = attempts.get(clientKey);

  if (!record || now >= record.resetAt) {
    return {
      allowed: true,
      remainingAttempts: MAX_ATTEMPTS,
      retryAfterSeconds: 0,
    };
  }

  if (record.count >= MAX_ATTEMPTS) {
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((record.resetAt - now) / 1000)),
    };
  }

  return {
    allowed: true,
    remainingAttempts: MAX_ATTEMPTS - record.count,
    retryAfterSeconds: 0,
  };
}

export function recordFailedPinAttempt(clientKey: string): {
  remainingAttempts: number;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const existing = attempts.get(clientKey);

  if (!existing || now >= existing.resetAt) {
    attempts.set(clientKey, { count: 1, resetAt: now + WINDOW_MS });
    return {
      remainingAttempts: MAX_ATTEMPTS - 1,
      retryAfterSeconds: 0,
    };
  }

  const nextCount = existing.count + 1;
  attempts.set(clientKey, { count: nextCount, resetAt: existing.resetAt });

  return {
    remainingAttempts: Math.max(0, MAX_ATTEMPTS - nextCount),
    retryAfterSeconds: nextCount >= MAX_ATTEMPTS ? Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) : 0,
  };
}

export function clearPinAttempts(clientKey: string): void {
  attempts.delete(clientKey);
}

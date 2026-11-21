import { NextResponse } from "next/server";
import { z } from "zod";
import {
  PIN_SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  createPinSessionToken,
  verifyPin,
} from "@/lib/auth/pin-auth";
import {
  checkPinRateLimit,
  recordFailedPinAttempt,
  clearPinAttempts,
} from "@/lib/auth/rate-limit";

const pinSchema = z.object({
  pin: z.string().regex(/^\d{6}$/, "PIN harus terdiri dari 6 digit angka."),
});

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const rate = checkPinRateLimit(clientIp);

  if (!rate.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: `Terlalu banyak percobaan PIN salah. Coba lagi dalam ${Math.ceil(rate.retryAfterSeconds / 60)} menit.`,
        retryAfterSeconds: rate.retryAfterSeconds,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      }
    );
  }

  try {
    const body = await request.json();
    const parsed = pinSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Format PIN tidak valid." },
        { status: 400 }
      );
    }

    const isValid = await verifyPin(parsed.data.pin);
    if (!isValid) {
      const fail = recordFailedPinAttempt(clientIp);
      return NextResponse.json(
        {
          success: false,
          error:
            fail.remainingAttempts > 0
              ? `PIN salah. Sisa percobaan: ${fail.remainingAttempts} kali.`
              : `PIN salah. Akses dikunci sementara selama ${Math.ceil(fail.retryAfterSeconds / 60)} menit.`,
          remainingAttempts: fail.remainingAttempts,
        },
        { status: fail.remainingAttempts > 0 ? 401 : 429 }
      );
    }

    clearPinAttempts(clientIp);
    const token = await createPinSessionToken(SESSION_TTL_SECONDS);
    const response = NextResponse.json({ success: true });

    response.cookies.set(PIN_SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: "Permintaan tidak valid." },
      { status: 400 }
    );
  }
}

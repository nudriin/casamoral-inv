import { NextResponse } from "next/server";
import { PIN_SESSION_COOKIE_NAME } from "@/lib/auth/pin-auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(PIN_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}

import { NextResponse, type NextRequest } from "next/server";
import {
  PIN_SESSION_COOKIE_NAME,
  verifyPinSessionToken,
} from "@/lib/auth/pin-auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow cron endpoints (protected by CRON_SECRET) and auth endpoints
  if (
    pathname.startsWith("/api/cron/") ||
    pathname.startsWith("/api/auth/")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(PIN_SESSION_COOKIE_NAME)?.value;
  const session = await verifyPinSessionToken(token);

  const isLoginPage = pathname === "/login" || pathname.startsWith("/login/");

  if (!session && !isLoginPage) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    if (pathname !== "/") {
      loginUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (session && isLoginPage) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.searchParams.delete("next");
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

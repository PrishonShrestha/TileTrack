import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose/jwt/verify";

const AUTH_COOKIE_NAME = "tiletrack_session";

function getAuthSecret(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ||
    "tiletrack-default-secret-key-at-least-32-chars-long";
  return new TextEncoder().encode(secret);
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Protect /manage and /manage/*
  if (pathname === "/manage" || pathname.startsWith("/manage/")) {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;

    let isAuthenticated = false;
    if (token) {
      try {
        const secret = getAuthSecret();
        await jwtVerify(token, secret);
        isAuthenticated = true;
      } catch {
        isAuthenticated = false;
      }
    }

    if (!isAuthenticated) {
      const redirectUrl = new URL("/login", req.url);
      const fullTarget = pathname + search;
      redirectUrl.searchParams.set("redirect", fullTarget);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/manage", "/manage/:path*"],
};

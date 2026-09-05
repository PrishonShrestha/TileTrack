import { NextRequest, NextResponse } from "next/server";
import {
  signSessionToken,
  getAdminCredentials,
  AUTH_COOKIE_NAME,
} from "@/features/auth/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "");

    const admin = getAdminCredentials();

    if (username !== admin.username || password !== admin.password) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const token = await signSessionToken({ username, role: "admin" });

    const response = NextResponse.json({
      success: true,
      authenticated: true,
      username,
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("[/api/auth/login] error", error);
    return NextResponse.json(
      { error: "Internal server error during login" },
      { status: 500 }
    );
  }
}

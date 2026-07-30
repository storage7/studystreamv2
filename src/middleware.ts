import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback_secret_change_me"
);
const COOKIE_NAME = "study_session";

const PUBLIC_PATHS = ["/", "/api/auth/login", "/api/health"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow static assets immediately
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;

  // 2. FIX: If the user goes to the login page ("/") but already has a cookie,
  // verify it. If it's valid, send them straight to the dashboard.
  if (pathname === "/" && token) {
    try {
      await jwtVerify(token, SECRET);
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } catch {
      // If the token is invalid/expired, delete it and let them see the login page
      const response = NextResponse.next();
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
  }

  // 3. Allow other public paths (or "/" if they had no token)
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // 4. Protected routes enforcement
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    await jwtVerify(token, SECRET);
    return NextResponse.next();
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

import { NextRequest, NextResponse } from "next/server";

// ─── Public Routes ───────────────────────────────────────────────────────────
const PUBLIC_PAGES = [
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/verify-email",
];
const PUBLIC_API_PREFIXES = [
  "/api/auth/", // all auth endpoints (login, register, logout, otp…)
  "/api/issues", // anonymous QR issue reporting
  "/api/assets/", // public asset page fetches asset by tag
  "/api/upload", // public photo upload from QR page
];
const PUBLIC_PAGE_PATTERN = /^\/asset\/[^/]+\/public(\/.*)?$/;

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Next.js internals — always allow
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    /\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|css|js|map|json)$/.test(
      pathname,
    )
  ) {
    return NextResponse.next();
  }

  // 2. Public pages
  if (PUBLIC_PAGES.includes(pathname)) {
    return NextResponse.next();
  }

  // 3. Public QR scan page
  if (PUBLIC_PAGE_PATTERN.test(pathname)) {
    return NextResponse.next();
  }

  // 4. Public API routes
  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 5. Everything else needs the token cookie to EXIST
  //    We only check existence here (not validity) because
  //    jsonwebtoken.verify() requires Node.js crypto which is
  //    NOT available in Next.js Edge Runtime (middleware).
  //    Full token validation happens inside each API route handler.
  const token = req.cookies.get("token")?.value;

  if (!token || token.trim() === "") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized — no token" },
        { status: 401 },
      );
    }
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Token cookie exists — let the request through
  // The route handler / getCurrentUser() will verify the signature
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

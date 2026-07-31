import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "session";

function getSecretKey() {
  return new TextEncoder().encode(process.env.SESSION_SECRET);
}

// Optimistic check only: confirms a validly-signed session cookie exists so
// we can bounce anonymous visitors to /login before rendering. The real
// per-request user + membership/role lookup happens server-side in each
// layout via requireRole(), since that needs the database.
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await jwtVerify(token, getSecretKey());
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/admin/:path*", "/volunteer/:path*", "/student/:path*", "/events/:path*", "/messages/:path*"],
};

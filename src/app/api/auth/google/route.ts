import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { buildGoogleAuthUrl } from "@/lib/googleOAuth";
import { signOAuthState, type OAuthJoinIntent } from "@/lib/oauthState";
import { ROLES } from "@/lib/constants";

const STATE_COOKIE = "google_oauth_state";
const STATE_COOKIE_MAX_AGE_SECONDS = 60 * 10;

/**
 * Starts the Google sign-in flow. Optionally carries a join intent
 * (?joinCode=...&role=VOLUNTEER|STUDENT) from the /join/[code] page through
 * to the callback, so a brand-new Google user lands with their Membership
 * already created — mirrors what joinChurchAction does for email/password.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const joinCode = searchParams.get("joinCode");
  const roleParam = searchParams.get("role");

  let join: OAuthJoinIntent | undefined;
  if (joinCode) {
    const role = roleParam === ROLES.STUDENT ? ROLES.STUDENT : ROLES.VOLUNTEER;
    join = { joinCode, role };
  }

  let authUrl: string;
  let state: string;
  try {
    state = await signOAuthState(join);
    authUrl = buildGoogleAuthUrl(state);
  } catch (err) {
    // Most likely GOOGLE_CLIENT_ID/SECRET aren't configured — fail toward the
    // same generic login error page rather than an unhandled 500.
    console.error(`[google oauth] Failed to start flow: ${err}`);
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "google_oauth_failed");
    return NextResponse.redirect(url);
  }

  const response = NextResponse.redirect(authUrl);
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: STATE_COOKIE_MAX_AGE_SECONDS,
  });
  return response;
}

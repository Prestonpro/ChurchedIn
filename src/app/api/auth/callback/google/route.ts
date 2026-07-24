import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { exchangeCodeForGoogleProfile } from "@/lib/googleOAuth";
import { verifyOAuthState } from "@/lib/oauthState";
import { createSessionToken, setSessionCookie } from "@/lib/session";
import { dashboardPathForRole, type Role } from "@/lib/constants";

const STATE_COOKIE = "google_oauth_state";

function failure(request: NextRequest, reason: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", "google_oauth_failed");
  // Not shown to the user — query param is intentionally generic; this is
  // just for anyone debugging via server logs.
  console.error(`[google oauth] ${reason}`);
  const response = NextResponse.redirect(url);
  response.cookies.delete(STATE_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const stateCookie = request.cookies.get(STATE_COOKIE)?.value;

  if (searchParams.get("error")) {
    return failure(request, `Google returned an error: ${searchParams.get("error")}`);
  }
  if (!code || !stateParam) {
    return failure(request, "Missing code or state in callback");
  }
  // CSRF check: the state we get back must be the exact value we handed to
  // Google, round-tripped via a cookie only this browser could present.
  if (!stateCookie || stateCookie !== stateParam) {
    return failure(request, "State param did not match state cookie");
  }

  const verified = await verifyOAuthState(stateParam);
  if (!verified) {
    return failure(request, "State token failed signature/expiry verification");
  }

  let profile;
  try {
    profile = await exchangeCodeForGoogleProfile(code);
  } catch (err) {
    return failure(request, `Token exchange/verification failed: ${err}`);
  }

  if (!profile.emailVerified) {
    return failure(request, `Google account email is not verified: ${profile.email}`);
  }

  // Find by googleId first (returning user), then by email (link an
  // existing email/password account), then create a brand-new user.
  let user = await prisma.user.findUnique({
    where: { googleId: profile.sub },
    include: { memberships: true },
  });

  if (!user) {
    const existingByEmail = await prisma.user.findUnique({
      where: { email: profile.email },
      include: { memberships: true },
    });

    if (existingByEmail) {
      user = await prisma.user.update({
        where: { id: existingByEmail.id },
        data: { googleId: profile.sub },
        include: { memberships: true },
      });
    } else {
      user = await prisma.user.create({
        data: { email: profile.email, name: profile.name, googleId: profile.sub },
        include: { memberships: true },
      });
    }
  }

  let activeChurchId = user.memberships[0]?.churchId;
  let activeRole: Role | undefined = user.memberships[0]?.role as Role | undefined;

  if (verified.join) {
    const { joinCode, role } = verified.join;
    const church = await prisma.church.findUnique({ where: { joinCode: joinCode.toUpperCase() } });
    if (!church) {
      return failure(request, `Join code from state no longer exists: ${joinCode}`);
    }

    const existingMembership = user.memberships.find((m) => m.churchId === church.id);
    if (existingMembership) {
      activeChurchId = church.id;
      activeRole = existingMembership.role as Role;
    } else {
      const membership = await prisma.membership.create({
        data: { userId: user.id, churchId: church.id, role },
      });
      activeChurchId = church.id;
      activeRole = membership.role as Role;
    }
  }

  // Mirrors getCurrentUser()'s fallback in src/lib/auth.ts: an activeChurchId
  // that matches nothing just resolves to "no active membership" there, so
  // an empty string here safely means "authenticated, but hasn't joined a
  // church yet" — requireRole() already redirects that case to /join.
  const token = await createSessionToken({
    userId: user.id,
    activeChurchId: activeChurchId ?? "",
  });
  await setSessionCookie(token);

  const destination = activeChurchId && activeRole ? dashboardPathForRole(activeRole) : "/join";
  const response = NextResponse.redirect(new URL(destination, request.url));
  response.cookies.delete(STATE_COOKIE);
  return response;
}

// No "server-only" guard, deliberately — same call as rsvp.ts/requestState.ts:
// this only touches jose + process.env (no Next.js-bound APIs), it's only ever
// imported from Route Handlers (never bundled client-side regardless), and
// keeping it guard-free is what makes it unit-testable under Vitest.
import { SignJWT, jwtVerify } from "jose";
import { ROLES, type Role } from "@/lib/constants";

const STATE_DURATION_SECONDS = 60 * 10; // 10 minutes — long enough for the Google consent screen, short enough to limit replay window

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set");
  }
  // Distinct issuer/audience from session tokens (src/lib/session.ts) so a
  // leaked/misused state token can't be replayed as a session token or
  // vice versa, even though both happen to use the same underlying secret.
  return new TextEncoder().encode(secret);
}

export type OAuthJoinIntent = {
  joinCode: string;
  role: Extract<Role, "VOLUNTEER" | "STUDENT">;
};

/**
 * Signs the OAuth `state` param. Carries an optional join intent (church
 * code + selected role) through the Google redirect round-trip, since
 * Google's callback has no other way to preserve form context. The value
 * returned here is also stored verbatim in a short-lived httpOnly cookie
 * (see the /api/auth/google route) — the callback route requires an exact
 * match between the two as CSRF protection, not just a valid signature.
 */
export async function signOAuthState(join?: OAuthJoinIntent): Promise<string> {
  return new SignJWT({ join: join ?? null })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("church-linkedin:oauth-state")
    .setAudience("church-linkedin:oauth-callback")
    .setExpirationTime(`${STATE_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export type OAuthStateVerification = {
  /** null when the signed state carried no join intent (plain Google login, not a join-code flow). */
  join: OAuthJoinIntent | null;
};

/**
 * Returns null only when the token fails signature/issuer/audience/expiry
 * verification (a CSRF failure, or a stale token past its 10-minute window)
 * — the caller must treat that as "reject the whole callback," distinct
 * from a successfully-verified state that simply carried no join intent.
 */
export async function verifyOAuthState(token: string): Promise<OAuthStateVerification | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: "church-linkedin:oauth-state",
      audience: "church-linkedin:oauth-callback",
    });
    const join = payload.join;
    if (!join) return { join: null };
    if (typeof join !== "object") return null;

    const { joinCode, role } = join as Record<string, unknown>;
    if (typeof joinCode !== "string" || typeof role !== "string") return null;
    if (role !== ROLES.VOLUNTEER && role !== ROLES.STUDENT) return null;

    return { join: { joinCode, role } };
  } catch {
    return null;
  }
}

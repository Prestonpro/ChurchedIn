import "server-only";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { appUrl } from "@/lib/email";

const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

const googleJwks = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));

function getClientCredentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET environment variables are not set");
  }
  return { clientId, clientSecret };
}

function redirectUri(): string {
  return appUrl("/api/auth/callback/google");
}

/** Builds the URL to send the browser to for Google's consent screen. */
export function buildGoogleAuthUrl(state: string): string {
  const { clientId } = getClientCredentials();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    // Lets a user with multiple Google accounts pick, rather than silently
    // reusing whichever one they last used on this device.
    prompt: "select_account",
  });
  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
}

type GoogleTokenResponse = {
  id_token?: string;
  error?: string;
  error_description?: string;
};

export type GoogleProfile = {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
};

/**
 * Exchanges the authorization `code` for tokens, then verifies the ID
 * token's signature against Google's published JWKS and checks issuer/
 * audience/expiry — the correct way to trust claims from a Google ID
 * token, rather than trusting an unverified userinfo endpoint response.
 * Throws on any failure; callers should catch and fail the callback closed.
 */
export async function exchangeCodeForGoogleProfile(code: string): Promise<GoogleProfile> {
  const { clientId, clientSecret } = getClientCredentials();

  const tokenResponse = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
  });

  const tokenBody = (await tokenResponse.json()) as GoogleTokenResponse;
  if (!tokenResponse.ok || !tokenBody.id_token) {
    throw new Error(
      `Google token exchange failed: ${tokenBody.error ?? tokenResponse.status} ${tokenBody.error_description ?? ""}`,
    );
  }

  const { payload } = await jwtVerify(tokenBody.id_token, googleJwks, {
    issuer: GOOGLE_ISSUERS,
    audience: clientId,
  });

  const { sub, email, email_verified: emailVerified, name } = payload;
  if (typeof sub !== "string" || typeof email !== "string" || typeof name !== "string") {
    throw new Error("Google ID token is missing required claims");
  }

  return { sub, email, emailVerified: emailVerified === true, name };
}

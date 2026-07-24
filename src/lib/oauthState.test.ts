import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { SignJWT } from "jose";
import { signOAuthState, verifyOAuthState } from "./oauthState";

const TEST_SECRET = "test-secret-for-oauth-state-unit-tests";

beforeAll(() => {
  // Self-contained rather than relying on .env being loaded into process.env
  // under Vitest — signOAuthState/verifyOAuthState just need *some* secret,
  // read fresh from process.env on every call.
  process.env.SESSION_SECRET = TEST_SECRET;
});

afterEach(() => {
  process.env.SESSION_SECRET = TEST_SECRET;
});

describe("signOAuthState / verifyOAuthState", () => {
  it("round-trips a join intent (church code + role)", async () => {
    const token = await signOAuthState({ joinCode: "ABC123", role: "STUDENT" });
    const result = await verifyOAuthState(token);
    expect(result).toEqual({ join: { joinCode: "ABC123", role: "STUDENT" } });
  });

  it("round-trips a plain login with no join intent", async () => {
    const token = await signOAuthState();
    const result = await verifyOAuthState(token);
    expect(result).toEqual({ join: null });
  });

  it("rejects a garbage token", async () => {
    const result = await verifyOAuthState("not-a-real-jwt");
    expect(result).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signOAuthState({ joinCode: "XYZ999", role: "VOLUNTEER" });

    process.env.SESSION_SECRET = "a-completely-different-secret";
    const result = await verifyOAuthState(token);
    expect(result).toBeNull();
  });

  it("rejects an expired token", async () => {
    const secret = new TextEncoder().encode(TEST_SECRET);
    const expiredToken = await new SignJWT({ join: null })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
      .setIssuer("church-linkedin:oauth-state")
      .setAudience("church-linkedin:oauth-callback")
      .setExpirationTime(Math.floor(Date.now() / 1000) - 1800)
      .sign(secret);

    const result = await verifyOAuthState(expiredToken);
    expect(result).toBeNull();
  });

  it("rejects a token whose join.role is not VOLUNTEER or STUDENT", async () => {
    const secret = new TextEncoder().encode(TEST_SECRET);
    const tamperedToken = await new SignJWT({ join: { joinCode: "ABC123", role: "CHURCH_ADMIN" } })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setIssuer("church-linkedin:oauth-state")
      .setAudience("church-linkedin:oauth-callback")
      .setExpirationTime("10m")
      .sign(secret);

    const result = await verifyOAuthState(tamperedToken);
    expect(result).toBeNull();
  });
});

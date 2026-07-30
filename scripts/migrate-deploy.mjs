import "dotenv/config";
import { execSync } from "node:child_process";

// Vercel injects env vars directly (no .env file needed there), but a
// plain `node` invocation locally doesn't load .env on its own the way
// `next build`/`next dev` do — dotenv/config fills that in without
// clobbering anything Vercel already set (it skips already-present vars).
//
// DATABASE_URL is Neon's pooled (pgbouncer) connection, which doesn't
// reliably hold the advisory lock `prisma migrate deploy` needs — same
// reason e2e/global-setup.ts uses the direct connection for its own
// migrate deploy call. DIRECT_URL is the non-pooled equivalent.
execSync("npx prisma migrate deploy", {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: process.env.DIRECT_URL },
});

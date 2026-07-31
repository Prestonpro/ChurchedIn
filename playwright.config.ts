import { defineConfig, devices } from "@playwright/test";
import "dotenv/config";

// e2e tests run in a dedicated Postgres *schema* within the same database
// as dev/production (there's no Neon API/branching wired up yet for a truly
// separate ephemeral database per run — see DEPLOYMENT.md), and on a
// dedicated port so they never collide with a dev server you might have
// running yourself. global-setup.ts drops and recreates this schema before
// every run, so it never accumulates stale data and never touches the
// "public" schema dev/production actually use.
export const E2E_PORT = 3100;
export const E2E_BASE_URL = `http://localhost:${E2E_PORT}`;
export const E2E_SCHEMA = "e2e_test";

function withE2eSchema(databaseUrl: string): string {
  const url = new URL(databaseUrl);
  url.searchParams.set("schema", E2E_SCHEMA);
  return url.toString();
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set (needed to derive the e2e test schema)");
}
if (!process.env.DIRECT_URL) {
  throw new Error("DIRECT_URL environment variable is not set (needed for e2e migration commands)");
}
// Pooled — what the e2e webServer (the actual running Next.js app) uses.
export const E2E_DATABASE_URL = withE2eSchema(process.env.DATABASE_URL);
// Direct/unpooled — what global-setup.ts's `prisma migrate deploy` uses.
// Migrations take a Postgres advisory lock that Neon's PgBouncer
// transaction-pooling mode can't reliably support.
export const E2E_DIRECT_URL = withE2eSchema(process.env.DIRECT_URL);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  globalSetup: require.resolve("./e2e/global-setup.ts"),
  // Default (5s) is too tight for a route/action hit for the first time on
  // a freshly-started dev server — Next.js compiles routes on demand in dev
  // mode, and that compile time counts against the assertion's wait. Not an
  // issue under `next build`/production; this only compensates for dev-mode
  // on-demand compilation in the e2e webServer below.
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: E2E_BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: `npx next dev -p ${E2E_PORT}`,
    url: E2E_BASE_URL,
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      DATABASE_URL: E2E_DATABASE_URL,
      APP_URL: E2E_BASE_URL,
      SESSION_SECRET: "e2e-test-only-secret-0123456789abcdef0123456789abcdef",
      // Blank, so sendEmail takes its console-logging branch instead of calling
      // Resend for real. Inherited from .env, every run fired live API requests
      // for @e2e.test recipients, which Resend rejected 403 ("you can only send
      // testing emails to your own address") — noise in the output, needless
      // quota burn, and a hard dependency on network access for a local run.
      RESEND_API_KEY: "",
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});

import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

// e2e tests run against a dedicated SQLite file, never the developer's own
// dev.db, and on a dedicated port so they never collide with a dev server
// you might have running yourself.
export const E2E_PORT = 3100;
export const E2E_BASE_URL = `http://localhost:${E2E_PORT}`;
export const E2E_DB_PATH = path.resolve(__dirname, "e2e/.test.db");
export const E2E_DATABASE_URL = `file:${E2E_DB_PATH}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  globalSetup: require.resolve("./e2e/global-setup.ts"),
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
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});

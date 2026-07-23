import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    // e2e/ contains Playwright specs (run via `npm run test:e2e`), not Vitest
    // unit tests — Vitest's default glob would otherwise also pick them up.
    exclude: ["**/node_modules/**", "e2e/**"],
  },
});

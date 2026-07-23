import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import { E2E_DATABASE_URL, E2E_DB_PATH } from "../playwright.config";

/** Resets the e2e SQLite file and applies migrations before the suite runs. */
export default function globalSetup() {
  for (const suffix of ["", "-journal", "-wal", "-shm"]) {
    const file = `${E2E_DB_PATH}${suffix}`;
    if (existsSync(file)) rmSync(file);
  }

  execSync("npx prisma migrate deploy", {
    cwd: path.resolve(__dirname, ".."),
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
    stdio: "inherit",
  });
}

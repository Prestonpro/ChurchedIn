import { execSync } from "node:child_process";
import path from "node:path";
import { Client } from "pg";
import { E2E_DIRECT_URL, E2E_SCHEMA } from "../playwright.config";

/**
 * Drops and recreates the e2e_test schema (never the "public" schema
 * dev/production use), then applies migrations into it — the Postgres
 * equivalent of the old "delete the SQLite file" reset. Uses the direct
 * (unpooled) connection throughout: migrations need it for advisory locks,
 * and there's no reason to use a different connection for the schema
 * reset immediately before them.
 */
export default async function globalSetup() {
  const client = new Client({ connectionString: E2E_DIRECT_URL });
  await client.connect();
  try {
    await client.query(`DROP SCHEMA IF EXISTS "${E2E_SCHEMA}" CASCADE`);
    await client.query(`CREATE SCHEMA "${E2E_SCHEMA}"`);
  } finally {
    await client.end();
  }

  execSync("npx prisma migrate deploy", {
    cwd: path.resolve(__dirname, ".."),
    env: { ...process.env, DATABASE_URL: E2E_DIRECT_URL },
    stdio: "inherit",
  });
}

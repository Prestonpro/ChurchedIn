import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Authors a new migration from the schema.prisma changes in your working tree,
 * WITHOUT connecting to any database.
 *
 * Why this exists instead of `prisma migrate dev`: this project has no separate
 * local database — `.env`'s DATABASE_URL and DIRECT_URL both point at the live
 * Neon instance. `migrate dev` would diff against production and can offer a
 * destructive reset if it detects drift, and it applies the migration
 * immediately, which is the last thing you want when `master` auto-deploys.
 *
 * Instead this diffs the *committed* schema.prisma (git HEAD) against the one in
 * your working tree. `prisma migrate diff --from-schema/--to-schema` is a pure
 * datamodel-to-datamodel comparison and, per `prisma migrate diff --help`, is
 * read-only and "does not write to your datasource(s)" — so nothing touches
 * production, and no shadow database is needed either.
 *
 * The committed schema is a valid baseline only because every migration in this
 * repo has been committed alongside its schema change. If you ever suspect the
 * two have drifted apart, reconcile them before trusting this.
 *
 * Verify the generated SQL with `npm run test:e2e`: its global-setup applies
 * every migration into the throwaway `e2e_test` schema, which exercises the SQL
 * against real Postgres before it can reach production. `npm run build` (and so
 * each deploy) is what finally applies it, via migrate-deploy.mjs.
 *
 * Usage: node scripts/migrate-new.mjs add_performance_indexes
 */

const name = process.argv[2];
if (!name || !/^[a-z0-9_]+$/.test(name)) {
  console.error("Usage: node scripts/migrate-new.mjs <snake_case_name>");
  process.exit(1);
}

const repoRoot = path.resolve(import.meta.dirname, "..");
const run = (file, args) =>
  execFileSync(file, args, {
    cwd: repoRoot,
    encoding: "utf8",
    shell: process.platform === "win32",
  });

// The baseline: schema.prisma as last committed. Written to a temp file because
// --from-schema takes a path, and it must live outside prisma/ so Prisma doesn't
// try to treat it as part of the project schema.
const tmpDir = path.join(os.tmpdir(), `churchedin-migrate-${process.pid}`);
mkdirSync(tmpDir, { recursive: true });
const baselinePath = path.join(tmpDir, "baseline.prisma");

let sql;
try {
  writeFileSync(baselinePath, run("git", ["show", "HEAD:prisma/schema.prisma"]), "utf8");
  sql = run("npx", [
    "prisma",
    "migrate",
    "diff",
    "--from-schema",
    baselinePath,
    "--to-schema",
    "./prisma/schema.prisma",
    "--script",
  ]);
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
}

// Prisma emits this comment (rather than empty output) when the two datamodels
// already agree.
if (!sql.trim() || sql.includes("This is an empty migration")) {
  console.log("schema.prisma matches the committed version — nothing to generate.");
  process.exit(0);
}

// Prisma's own directory convention, so `migrate deploy` orders it correctly.
const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
const dir = path.join(repoRoot, "prisma", "migrations", `${stamp}_${name}`);
mkdirSync(dir, { recursive: true });
const file = path.join(dir, "migration.sql");
writeFileSync(file, sql, "utf8");

console.log(`Wrote ${path.relative(repoRoot, file).replace(/\\/g, "/")}\n`);
console.log(sql);
console.log("Review the SQL above, then run `npm run test:e2e` to apply and exercise it.");

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// A `?schema=` query param isn't a real libpq connection param — the `pg`
// driver ignores it — so it has to be pulled out and passed explicitly as
// an adapter option. Used by the e2e suite to run in its own Postgres
// schema within the same database, isolated from dev/production data,
// without needing a second database or Neon's branching API.
const schema = new URL(connectionString).searchParams.get("schema") ?? undefined;

const adapter = new PrismaPg(connectionString, schema ? { schema } : undefined);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

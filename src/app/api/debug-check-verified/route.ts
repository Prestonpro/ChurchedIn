import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// TEMPORARY debug route — read-only check that the verified flags landed
// on production. No emails/passwords returned. Remove once checked.
export async function GET() {
  const users = await prisma.user.findMany({
    where: { memberships: { some: { church: { name: "St. Mary's" } } } },
    select: { name: true, verified: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ users });
}

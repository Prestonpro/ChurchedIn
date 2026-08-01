import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// TEMPORARY debug route — checks whether production has the same
// leftover-e2e-test-data pollution found in a different (non-production)
// database earlier tonight. Read-only. No emails/passwords returned.
// Delete this route once checked.
export async function GET() {
  const [totalUsers, communityMemberCount, totalChurches] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { name: { startsWith: "Community Member" } } }),
    prisma.church.count(),
  ]);

  const churches = await prisma.church.findMany({
    select: { id: true, name: true, denomination: true, _count: { select: { memberships: true } } },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  const recentUsers = await prisma.user.findMany({
    select: { name: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({
    totalUsers,
    communityMemberCount,
    totalChurches,
    mostRecentChurches: churches.map((c) => ({
      name: c.name,
      denomination: c.denomination,
      members: c._count.memberships,
    })),
    mostRecentUsers: recentUsers.map((u) => ({ name: u.name, createdAt: u.createdAt })),
  });
}

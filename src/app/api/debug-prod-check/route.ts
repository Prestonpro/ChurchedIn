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
    select: {
      id: true,
      name: true,
      denomination: true,
      address: true,
      memberships: { select: { role: true, user: { select: { name: true } } } },
    },
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
    churches: churches.map((c) => {
      const nonJunk = c.memberships.filter((m) => !/^Community Member \d+$/.test(m.user.name));
      return {
        id: c.id,
        name: c.name,
        denomination: c.denomination,
        address: c.address,
        totalMembers: c.memberships.length,
        junkMembers: c.memberships.length - nonJunk.length,
        nonJunkMembers: nonJunk.map((m) => `${m.user.name} [${m.role}]`),
      };
    }),
    mostRecentUsers: recentUsers.map((u) => ({ name: u.name, createdAt: u.createdAt })),
  });
}

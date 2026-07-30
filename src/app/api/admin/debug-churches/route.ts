import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * TEMPORARY — for a one-off production data audit/cleanup of practice
 * churches accumulated during development. Same bearer-secret pattern as
 * the cron endpoint. Remove this route (and ADMIN_DEBUG_SECRET) once that
 * cleanup is done; it has no reason to exist afterward.
 */
function checkAuth(request: Request): boolean {
  const secret = process.env.ADMIN_DEBUG_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const churches = await prisma.church.findMany({
    include: { _count: { select: { memberships: true, events: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(
    churches.map((c) => ({
      id: c.id,
      name: c.name,
      city: c.city,
      claimedAt: c.claimedAt,
      createdAt: c.createdAt,
      joinCode: c.joinCode,
      members: c._count.memberships,
      events: c._count.events,
    })),
  );
}

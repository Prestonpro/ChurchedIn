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

  const churchId = new URL(request.url).searchParams.get("churchId");
  if (churchId) {
    const members = await prisma.membership.findMany({
      where: { churchId },
      include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
    });
    return NextResponse.json(
      members.map((m) => ({ role: m.role, name: m.user.name, email: m.user.email, joinedAt: m.user.createdAt })),
    );
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

/**
 * Deletes a specific set of churches and every row that references them or
 * their now-orphaned users — a user is only fully deleted if ALL of their
 * memberships are within the target church set; a user who also belongs
 * elsewhere just loses the one membership. Requires the caller to pass the
 * exact IDs (no "delete everything" footgun) and only ever a dry run unless
 * `confirm: true` is set, so a bad request can't silently wipe data.
 */
export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const churchIds: string[] = Array.isArray(body.churchIds) ? body.churchIds : [];
  const confirm: boolean = body.confirm === true;
  if (churchIds.length === 0) {
    return NextResponse.json({ error: "churchIds must be a non-empty array" }, { status: 400 });
  }

  const memberships = await prisma.membership.findMany({
    where: { churchId: { in: churchIds } },
    select: { userId: true },
  });
  const candidateUserIds = [...new Set(memberships.map((m) => m.userId))];

  const otherMemberships = await prisma.membership.findMany({
    where: { userId: { in: candidateUserIds }, churchId: { notIn: churchIds } },
    select: { userId: true },
  });
  const usersWithOtherChurches = new Set(otherMemberships.map((m) => m.userId));
  const exclusiveUserIds = candidateUserIds.filter((id) => !usersWithOtherChurches.has(id));

  if (!confirm) {
    return NextResponse.json({
      dryRun: true,
      churchesToDelete: churchIds.length,
      usersToFullyDelete: exclusiveUserIds.length,
      usersToJustUnmember: candidateUserIds.length - exclusiveUserIds.length,
    });
  }

  await prisma.$transaction([
    prisma.eventRsvp.deleteMany({ where: { OR: [{ event: { churchId: { in: churchIds } } }, { userId: { in: exclusiveUserIds } }] } }),
    prisma.eventCohost.deleteMany({ where: { OR: [{ event: { churchId: { in: churchIds } } }, { userId: { in: exclusiveUserIds } }] } }),
    prisma.event.deleteMany({ where: { churchId: { in: churchIds } } }),
    prisma.mentorMeetingPlan.deleteMany({ where: { connection: { OR: [{ studentId: { in: exclusiveUserIds } }, { mentorId: { in: exclusiveUserIds } }] } } }),
    prisma.mentorConnection.deleteMany({ where: { OR: [{ studentId: { in: exclusiveUserIds } }, { mentorId: { in: exclusiveUserIds } }] } }),
    prisma.block.deleteMany({ where: { OR: [{ blockerId: { in: exclusiveUserIds } }, { blockedId: { in: exclusiveUserIds } }] } }),
    prisma.report.deleteMany({ where: { OR: [{ churchId: { in: churchIds } }, { reportedById: { in: exclusiveUserIds } }, { reportedUserId: { in: exclusiveUserIds } }] } }),
    prisma.rideRequest.deleteMany({ where: { OR: [{ churchId: { in: churchIds } }, { studentId: { in: exclusiveUserIds } }, { volunteerId: { in: exclusiveUserIds } }] } }),
    prisma.mentorProfile.deleteMany({ where: { userId: { in: exclusiveUserIds } } }),
    prisma.studentProfile.deleteMany({ where: { userId: { in: exclusiveUserIds } } }),
    prisma.passwordResetToken.deleteMany({ where: { userId: { in: exclusiveUserIds } } }),
    prisma.churchAdminInvite.deleteMany({ where: { churchId: { in: churchIds } } }),
    prisma.churchPartnership.deleteMany({ where: { OR: [{ requestingChurchId: { in: churchIds } }, { partnerChurchId: { in: churchIds } }] } }),
    prisma.membership.deleteMany({ where: { churchId: { in: churchIds } } }),
    prisma.user.deleteMany({ where: { id: { in: exclusiveUserIds } } }),
    prisma.church.deleteMany({ where: { id: { in: churchIds } } }),
  ]);

  return NextResponse.json({
    deleted: true,
    churchesDeleted: churchIds.length,
    usersDeleted: exclusiveUserIds.length,
  });
}

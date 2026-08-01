import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// TEMPORARY debug route — deletes leftover e2e-test "Community Member N"
// accounts from real churches on production, and records each affected
// church's pre-cleanup total as displayMemberCount (see that field's doc
// comment in schema.prisma). Only touches churches that actually have
// junk members; churches with zero junk members are left untouched
// entirely. Never deletes a Church row. POST-only, requires a confirm
// query param as a lightweight guard against accidental triggering.
// Remove this route once run.

const JUNK_NAME = /^Community Member \d+$/;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function deleteUsersCompletely(userIds: string[]) {
  if (userIds.length === 0) return;
  for (const ids of chunk(userIds, 500)) {
    const connections = await prisma.mentorConnection.findMany({
      where: { OR: [{ studentId: { in: ids } }, { mentorId: { in: ids } }] },
      select: { id: true },
    });
    const connIds = connections.map((c) => c.id);

    if (connIds.length > 0) {
      await prisma.message.deleteMany({ where: { conversation: { connectionId: { in: connIds } } } });
      await prisma.report.deleteMany({ where: { conversation: { connectionId: { in: connIds } } } });
      await prisma.conversation.deleteMany({ where: { connectionId: { in: connIds } } });
      await prisma.mentorMeetingPlan.deleteMany({ where: { connectionId: { in: connIds } } });
    }
    await prisma.mentorConnection.deleteMany({
      where: { OR: [{ studentId: { in: ids } }, { mentorId: { in: ids } }] },
    });

    await prisma.message.deleteMany({ where: { senderId: { in: ids } } });
    await prisma.report.deleteMany({
      where: { OR: [{ reportedById: { in: ids } }, { reportedUserId: { in: ids } }] },
    });
    await prisma.eventRsvp.deleteMany({ where: { userId: { in: ids } } });
    await prisma.eventCohost.deleteMany({ where: { userId: { in: ids } } });
    await prisma.rideRequest.deleteMany({
      where: { OR: [{ studentId: { in: ids } }, { volunteerId: { in: ids } }] },
    });
    await prisma.block.deleteMany({ where: { OR: [{ blockerId: { in: ids } }, { blockedId: { in: ids } }] } });
    await prisma.passwordResetToken.deleteMany({ where: { userId: { in: ids } } });
    await prisma.mentorProfile.deleteMany({ where: { userId: { in: ids } } });
    await prisma.studentProfile.deleteMany({ where: { userId: { in: ids } } });

    const createdEvents = await prisma.event.findMany({
      where: { createdById: { in: ids } },
      select: { id: true },
    });
    const createdEventIds = createdEvents.map((e) => e.id);
    if (createdEventIds.length > 0) {
      await prisma.eventRsvp.deleteMany({ where: { eventId: { in: createdEventIds } } });
      await prisma.eventCohost.deleteMany({ where: { eventId: { in: createdEventIds } } });
      await prisma.event.deleteMany({ where: { id: { in: createdEventIds } } });
    }

    await prisma.membership.deleteMany({ where: { userId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
  }
}

export async function POST(request: NextRequest) {
  const confirm = request.nextUrl.searchParams.get("confirm");
  if (confirm !== "yes-delete-production-junk") {
    return NextResponse.json(
      { error: "Missing or incorrect confirm query param — refusing to run." },
      { status: 400 },
    );
  }

  const churches = await prisma.church.findMany({
    select: {
      id: true,
      name: true,
      memberships: { select: { userId: true, user: { select: { id: true, name: true } } } },
    },
  });

  const results: { church: string; totalMembers: number; junkRemoved: number }[] = [];

  for (const church of churches) {
    const junkUserIds = church.memberships
      .filter((m) => JUNK_NAME.test(m.user.name))
      .map((m) => m.user.id);

    if (junkUserIds.length === 0) {
      continue; // real/organic church, e.g. Emmanuel's Church, St. Mary's — leave untouched
    }

    await prisma.church.update({
      where: { id: church.id },
      data: { displayMemberCount: church.memberships.length },
    });
    await deleteUsersCompletely(junkUserIds);

    results.push({
      church: church.name,
      totalMembers: church.memberships.length,
      junkRemoved: junkUserIds.length,
    });
  }

  const finalUserCount = await prisma.user.count();
  const finalJunkCount = await prisma.user.count({ where: { name: { startsWith: "Community Member" } } });

  return NextResponse.json({
    cleanedChurches: results,
    finalUserCount,
    finalJunkCount,
  });
}

import "server-only";
import { prisma } from "@/lib/prisma";
import { RSVP_STATUS, EVENT_STATUS } from "@/lib/constants";

export function listEventsForChurch(churchId: string) {
  return prisma.event.findMany({
    where: { churchId, status: EVENT_STATUS.PUBLISHED },
    orderBy: { startsAt: "asc" },
    include: {
      createdBy: { select: { id: true, name: true } },
      rsvps: { where: { status: { not: RSVP_STATUS.CANCELLED } } },
    },
  });
}

export function getEventById(eventId: string) {
  return prisma.event.findUnique({
    where: { id: eventId },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      church: true,
      rsvps: {
        where: { status: { not: RSVP_STATUS.CANCELLED } },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

/** Pairs (in either direction) count as a block, since blocking is unilateral. */
async function blockedPairUserIds(userId: string): Promise<Set<string>> {
  const blocks = await prisma.block.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
  });
  const ids = new Set<string>();
  for (const b of blocks) {
    ids.add(b.blockerId === userId ? b.blockedId : b.blockerId);
  }
  return ids;
}

export async function isBlockedPair(userAId: string, userBId: string): Promise<boolean> {
  const blocked = await blockedPairUserIds(userAId);
  return blocked.has(userBId);
}

export async function listMentorsForChurch(churchId: string, viewerId: string) {
  const excluded = await blockedPairUserIds(viewerId);

  const mentors = await prisma.mentorProfile.findMany({
    where: {
      openToMentor: true,
      user: {
        memberships: { some: { churchId } },
      },
    },
    include: { user: { select: { id: true, name: true, bio: true, photoUrl: true } } },
  });

  return mentors.filter((m) => !excluded.has(m.userId));
}

export function listConnectionsAsStudent(studentId: string) {
  return prisma.mentorConnection.findMany({
    where: { studentId },
    include: { mentor: { select: { id: true, name: true, email: true, bio: true } } },
    orderBy: { lastRequestedAt: "desc" },
  });
}

export function listConnectionsAsMentor(mentorId: string) {
  return prisma.mentorConnection.findMany({
    where: { mentorId },
    include: { student: { select: { id: true, name: true, email: true, bio: true } } },
    orderBy: { lastRequestedAt: "desc" },
  });
}

export function getChurchByJoinCode(joinCode: string) {
  return prisma.church.findUnique({ where: { joinCode: joinCode.toUpperCase() } });
}

export function listReportsForChurch(churchId: string) {
  return prisma.report.findMany({
    where: { churchId },
    include: { reportedBy: { select: { id: true, name: true } }, reportedUser: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

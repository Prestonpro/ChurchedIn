import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { RSVP_STATUS, EVENT_STATUS, ROLES, PARTNERSHIP_STATUS } from "@/lib/constants";
import { contactInfoVisible } from "@/lib/connectionState";

export function listEventsForChurch(churchId: string) {
  return prisma.event.findMany({
    where: { churchId, status: EVENT_STATUS.PUBLISHED },
    orderBy: { startsAt: "asc" },
    include: {
      createdBy: { select: { id: true, name: true } },
      // `user` selected (name only) so the feed can show a handful of
      // avatar circles for "who's going" — a plain count doesn't give
      // that same at-a-glance social-proof read.
      rsvps: {
        where: { status: { not: RSVP_STATUS.CANCELLED } },
        include: { user: { select: { name: true } } },
      },
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
      cohosts: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

/** Volunteers at a church who could be invited as a co-host — excludes the
 * event creator (already the host) and anyone already co-hosting. */
export function listCohostCandidates(churchId: string, eventId: string) {
  return prisma.user.findMany({
    where: {
      memberships: { some: { churchId, role: ROLES.VOLUNTEER } },
      eventsCreated: { none: { id: eventId } },
      cohostedEvents: { none: { eventId } },
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
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

// Both listConnections* functions strip the other party's email from
// anything not ACCEPTED before returning, rather than trusting every future
// caller to only render `.email` inside the right status branch — pushing
// the one non-negotiable safety rule (PLAN.md section 8) down into the
// query layer so it can't be bypassed by a page that forgets.
export async function listConnectionsAsStudent(studentId: string) {
  const connections = await prisma.mentorConnection.findMany({
    where: { studentId },
    include: { mentor: { select: { id: true, name: true, email: true, bio: true } } },
    orderBy: { lastRequestedAt: "desc" },
  });
  return connections.map((c) => ({
    ...c,
    mentor: { ...c.mentor, email: contactInfoVisible(c.status) ? c.mentor.email : null },
  }));
}

export async function listConnectionsAsMentor(mentorId: string) {
  const connections = await prisma.mentorConnection.findMany({
    where: { mentorId },
    include: { student: { select: { id: true, name: true, email: true, bio: true } } },
    orderBy: { lastRequestedAt: "desc" },
  });
  return connections.map((c) => ({
    ...c,
    student: { ...c.student, email: contactInfoVisible(c.status) ? c.student.email : null },
  }));
}

// Wrapped in React's cache() so generateMetadata and the page component can
// both call this for the same request without double-querying — React
// dedupes calls with the same arguments within a single render pass.
export const getChurchByJoinCode = cache((joinCode: string) => {
  return prisma.church.findUnique({ where: { joinCode: joinCode.toUpperCase() } });
});

/** True if this church has ANY published event created after `since` — or
 * any at all if `since` is null (a member who's never visited /events). */
export async function hasUnseenEvents(churchId: string, since: Date | null): Promise<boolean> {
  const count = await prisma.event.count({
    where: {
      churchId,
      status: EVENT_STATUS.PUBLISHED,
      ...(since ? { createdAt: { gt: since } } : {}),
    },
  });
  return count > 0;
}

/** Church ids this church has an ACCEPTED partnership with, in either
 * direction — used to pull in a read-only "from partner churches" section
 * on the event feed. */
export async function listAcceptedPartnerChurchIds(churchId: string): Promise<string[]> {
  const partnerships = await prisma.churchPartnership.findMany({
    where: {
      status: PARTNERSHIP_STATUS.ACCEPTED,
      OR: [{ requestingChurchId: churchId }, { partnerChurchId: churchId }],
    },
  });
  return partnerships.map((p) =>
    p.requestingChurchId === churchId ? p.partnerChurchId : p.requestingChurchId,
  );
}

/** True if churchA and churchB have an ACCEPTED partnership, in either
 * direction — gates read-only viewing of an event outside the viewer's
 * own church(es) on the event detail page. */
export async function isAcceptedPartnerChurch(churchA: string, churchB: string): Promise<boolean> {
  const row = await prisma.churchPartnership.findFirst({
    where: {
      status: PARTNERSHIP_STATUS.ACCEPTED,
      OR: [
        { requestingChurchId: churchA, partnerChurchId: churchB },
        { requestingChurchId: churchB, partnerChurchId: churchA },
      ],
    },
  });
  return !!row;
}

/** Upcoming published events from a set of (partner) churches, for the
 * event feed's read-only "from partner churches" section. */
export function listEventsForChurches(churchIds: string[]) {
  if (churchIds.length === 0) return Promise.resolve([]);
  return prisma.event.findMany({
    where: { churchId: { in: churchIds }, status: EVENT_STATUS.PUBLISHED, startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
    include: { church: { select: { id: true, name: true } } },
  });
}

/** All partnerships (pending or accepted) touching this church, each
 * resolved to "the other church" and whether this church is the recipient
 * of a still-pending request (so the UI knows to show Accept/Decline vs.
 * a waiting state). */
export async function listPartnershipsForChurch(churchId: string) {
  const rows = await prisma.churchPartnership.findMany({
    where: { OR: [{ requestingChurchId: churchId }, { partnerChurchId: churchId }] },
    include: {
      requestingChurch: { select: { id: true, name: true } },
      partnerChurch: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((p) => ({
    id: p.id,
    status: p.status,
    createdAt: p.createdAt,
    isIncoming: p.partnerChurchId === churchId,
    otherChurch: p.requestingChurchId === churchId ? p.partnerChurch : p.requestingChurch,
  }));
}

export function listReportsForChurch(churchId: string) {
  return prisma.report.findMany({
    where: { churchId },
    include: { reportedBy: { select: { id: true, name: true } }, reportedUser: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

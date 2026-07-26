import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import {
  RSVP_STATUS,
  EVENT_STATUS,
  ROLES,
  PARTNERSHIP_STATUS,
  RIDE_STATUS,
  RIDE_REQUEST_TYPE,
  VERIFICATION_STATUS,
} from "@/lib/constants";
import { contactInfoVisible } from "@/lib/connectionState";
import { rideContactVisible } from "@/lib/rideState";

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

/** OPEN ride requests at a church, for the volunteer Rides Board — no
 * student contact info here since it's not relevant until claimed (and
 * there's no volunteer assigned yet to reveal it to). */
/** OPEN rides for a church's board — every row here is pre-claim by
 * definition (status: OPEN), so FIRST_VISIT rides get the brief's "first
 * name + profile photo only until claimed" treatment applied unconditionally
 * here at the query layer, same defense-in-depth spirit as the contact-info
 * rules elsewhere. GENERAL rides keep showing the full name — that
 * restriction is specifically about a stranger visiting a church for the
 * first time, not a student already known to their own church's volunteers. */
export async function listOpenRideRequestsForChurch(churchId: string) {
  const rides = await prisma.rideRequest.findMany({
    where: { churchId, status: RIDE_STATUS.OPEN },
    include: { student: { select: { id: true, name: true, photoUrl: true } } },
    orderBy: { date: "asc" },
  });
  return rides.map((r) => ({
    ...r,
    student:
      r.type === RIDE_REQUEST_TYPE.FIRST_VISIT
        ? { ...r.student, name: r.student.name.split(" ")[0] }
        : r.student,
  }));
}

// Both listRideRequests* functions strip the other party's email from
// anything not CLAIMED/COMPLETED before returning — same query-layer
// defense-in-depth as listConnections*, pushing the safety rule down so a
// page can't leak it by rendering `.email` too early.
export async function listClaimedRideRequestsForVolunteer(volunteerId: string) {
  const rides = await prisma.rideRequest.findMany({
    where: { volunteerId },
    include: { student: { select: { id: true, name: true, email: true } } },
    orderBy: { date: "asc" },
  });
  return rides.map((r) => ({
    ...r,
    student: { ...r.student, email: rideContactVisible(r.status) ? r.student.email : null },
  }));
}

export async function listRideRequestsForStudent(studentId: string) {
  const rides = await prisma.rideRequest.findMany({
    where: { studentId },
    include: { volunteer: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  return rides.map((r) => ({
    ...r,
    volunteer: r.volunteer
      ? { ...r.volunteer, email: rideContactVisible(r.status) ? r.volunteer.email : null }
      : null,
  }));
}

/** Upcoming published events at this church that have a map pin (both
 * lat/lng set) — for /events/map. Includes RSVPs so the caller can compute
 * capacity fullness and "is this the viewer's event" without a second
 * query. */
export function listMappedEventsForChurch(churchId: string) {
  return prisma.event.findMany({
    where: {
      churchId,
      status: EVENT_STATUS.PUBLISHED,
      startsAt: { gte: new Date() },
      locationLat: { not: null },
      locationLng: { not: null },
    },
    orderBy: { startsAt: "asc" },
    include: {
      rsvps: { where: { status: { not: RSVP_STATUS.CANCELLED } } },
    },
  });
}

/**
 * All churches on the platform, for /discover — deliberately NOT scoped to
 * the viewer's own church(es), unlike almost every other query in this
 * file. This is intentional: a church's own public-facing profile info
 * (name, bio, service times, location) is meant to be found by anyone
 * looking, the same way a business listing would be. It's a different
 * category of data from the per-church-scoped operational data (events,
 * RSVPs, the friend directory) that the rest of the app keeps strictly
 * separated by tenant — nothing sensitive is exposed here.
 */
export async function listDiscoverableChurches() {
  const churches = await prisma.church.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { memberships: true, events: { where: { status: EVENT_STATUS.PUBLISHED, startsAt: { gte: new Date() } } } } },
    },
  });
  return churches.map((c) => ({
    ...c,
    memberCount: c._count.memberships,
    upcomingEventCount: c._count.events,
  }));
}

/** Full profile details for a church, plus member/vouch counts computed on
 * demand (not cached — same "just count it" convention used everywhere
 * else in this app, e.g. the admin dashboard's memberCount). */
export async function getChurchProfile(churchId: string) {
  const [church, memberCount, vouchCount] = await Promise.all([
    prisma.church.findUnique({ where: { id: churchId } }),
    prisma.membership.count({ where: { churchId } }),
    prisma.churchVouch.count({ where: { churchId } }),
  ]);
  if (!church) return null;
  return { ...church, memberCount, vouchCount };
}

/** All church ids this user has already vouched for — fetched once for
 * /discover's whole list instead of one query per card. */
export async function listVouchedChurchIds(userId: string): Promise<Set<string>> {
  const vouches = await prisma.churchVouch.findMany({ where: { userId }, select: { churchId: true } });
  return new Set(vouches.map((v) => v.churchId));
}

export async function hasUserVouchedForChurch(userId: string, churchId: string): Promise<boolean> {
  const vouch = await prisma.churchVouch.findUnique({
    where: { churchId_userId: { churchId, userId } },
  });
  return !!vouch;
}

/** True if the user belongs to a verified church other than `churchId` —
 * the "verified user" bar for being allowed to vouch for a church (brief:
 * "any verified user... can vouch for another church"). */
export async function isVerifiedElsewhere(userId: string, churchId: string): Promise<boolean> {
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      churchId: { not: churchId },
      church: {
        verificationStatus: { in: [VERIFICATION_STATUS.COMMUNITY_VERIFIED, VERIFICATION_STATUS.PASTOR_VERIFIED] },
      },
    },
  });
  return !!membership;
}

/** All members of a church with role/isPastor, for the admin settings
 * page's member list — admins first, then by join date. */
export function listMembersForChurch(churchId: string) {
  return prisma.membership.findMany({
    where: { churchId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });
}

export function listReportsForChurch(churchId: string) {
  return prisma.report.findMany({
    where: { churchId },
    include: { reportedBy: { select: { id: true, name: true } }, reportedUser: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

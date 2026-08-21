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
  REQUEST_STATUS,
  REQUEST_CATEGORY,
} from "@/lib/constants";
import { requestContactVisible } from "@/lib/requestState";
import { rideContactVisible } from "@/lib/rideState";
import { canSendMessage, canViewConversation } from "@/lib/messaging";

export function listEventsForChurch(churchId: string) {
  return prisma.event.findMany({
    where: { churchId, status: EVENT_STATUS.PUBLISHED },
    orderBy: { startsAt: "asc" },
    include: {
      createdBy: { select: { id: true, name: true } },
      // `user` selected (id + name) so the feed can show a handful of
      // avatar circles for "who's going" — a plain count doesn't give
      // that same at-a-glance social-proof read. `id` is also needed to
      // de-dupe against `cohosts` below (a cohost who never separately
      // RSVP'd as a helper shouldn't be silently dropped from the count).
      rsvps: {
        where: { status: { not: RSVP_STATUS.CANCELLED } },
        include: { user: { select: { id: true, name: true } } },
      },
      cohosts: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });
}

/** Lightweight, non-member-safe preview of a church's upcoming events for
 * its public profile page (see ChurchProfilePage) — title, date, and
 * category only. Unlike listEventsForChurch, this never includes
 * RSVPs/attendees, so it's safe to show a signed-in visitor who hasn't
 * joined the church yet. */
export function listPublicUpcomingEventsForChurch(churchId: string) {
  return prisma.event.findMany({
    where: { churchId, status: EVENT_STATUS.PUBLISHED, startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
    select: { id: true, title: true, startsAt: true, category: true },
    take: 10,
  });
}

export function getEventById(eventId: string) {
  return prisma.event.findUnique({
    where: { id: eventId },
    include: {
      // Neither the creator's email nor the church's joinCode is ever rendered
      // here, and this page is reachable by partner-church members who are not
      // members of this church at all — so selecting a foreign church's invite
      // code (or anyone's email) is the wrong default, even though nothing
      // currently forwards it to a client component.
      createdBy: { select: { id: true, name: true } },
      church: { select: { id: true, name: true } },
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

/** Pairs (in either direction) count as a block, since blocking is unilateral.
 * Also includes users with active (OPEN) reports against them, as they should be hidden
 * from the community as if they were banned. */
async function blockedPairUserIds(userId: string): Promise<Set<string>> {
  const [blocks, openReports] = await Promise.all([
    prisma.block.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
      select: { blockerId: true, blockedId: true },
    }),
    prisma.report.findMany({
      where: { status: "OPEN", reportedUserId: { not: null } },
      select: { reportedUserId: true },
    }),
  ]);
  const ids = new Set<string>();
  for (const b of blocks) {
    ids.add(b.blockerId === userId ? b.blockedId : b.blockerId);
  }
  for (const r of openReports) {
    if (r.reportedUserId && r.reportedUserId !== userId) {
      ids.add(r.reportedUserId);
    }
  }
  return ids;
}

export async function isBlockedPair(userAId: string, userBId: string): Promise<boolean> {
  const blocked = await blockedPairUserIds(userAId);
  return blocked.has(userBId);
}

/** True if `userId` is in a block pair with ANY of `otherIds` — one query
 * regardless of how many ids are checked, for the cases (an event's creator plus
 * its co-hosts) where more than one person counts as "the other side". */
export async function isBlockedPairWithAny(userId: string, otherIds: string[]): Promise<boolean> {
  if (otherIds.length === 0) return false;
  const blocked = await blockedPairUserIds(userId);
  return otherIds.some((id) => blocked.has(id));
}

/** People this user has blocked — specifically the ones THEY initiated
 * (not the reverse direction), since only the blocker can undo their own
 * block. Without this, blocking someone by mistake had no way back:
 * unblockUserAction existed but nothing in the UI ever called it. */
export function listBlockedUsers(userId: string) {
  return prisma.block.findMany({
    where: { blockerId: userId },
    include: { blocked: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

/** Every VOLUNTEER/CHURCH_ADMIN member of this church who's open to being
 * browsed in the Mentorship directory — the same population that shows up
 * in the plain church member list, driven by Membership, filtered by
 * `User.openToMentorship` (carried forward from the deleted
 * MentorProfile.openToMentor, now defaulting true on every user instead of
 * needing a profile row to exist first). Someone who has closed themselves
 * off is still shown if the viewer already has a HelpRequest targeting them
 * (any status) — otherwise closing yourself off would make an existing
 * pending/claimed/declined request vanish from the student's own page with
 * no way to see or cancel it. */
export async function listOpenMentorshipVolunteers(churchId: string, viewerId: string) {
  const excluded = await blockedPairUserIds(viewerId);

  const memberships = await prisma.membership.findMany({
    where: {
      churchId,
      role: { in: [ROLES.VOLUNTEER, ROLES.CHURCH_ADMIN] },
      user: {
        OR: [
          { openToMentorship: true },
          {
            requestsAsClaimer: {
              some: { requesterId: viewerId, category: REQUEST_CATEGORY.MENTORSHIP },
            },
          },
        ],
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          bio: true,
          photoUrl: true,
          verified: true,
          jobTitle: true,
          company: true,
          industry: true,
          languages: true,
          hobbies: true,
          interests: true,
          linkedinUrl: true,
          facebookUrl: true,
          instagramUrl: true,
        },
      },
    },
  });

  return memberships
    .filter((m) => !excluded.has(m.userId))
    .map((m) => ({
      id: m.userId,
      userId: m.userId,
      jobTitle: m.user.jobTitle,
      company: m.user.company,
      industry: m.user.industry,
      languages: m.user.languages,
      hobbies: m.user.hobbies,
      interests: m.user.interests,
      linkedinUrl: m.user.linkedinUrl,
      facebookUrl: m.user.facebookUrl,
      instagramUrl: m.user.instagramUrl,
      role: m.role,
      user: {
        id: m.user.id,
        name: m.user.name,
        bio: m.user.bio,
        photoUrl: m.user.photoUrl,
        verified: m.user.verified,
      },
      memberSince: m.createdAt,
    }));
}

// Both listRequestsFor* functions strip the other party's email from
// anything requestContactVisible doesn't allow yet, rather than trusting
// every future caller to only render `.email` inside the right status
// branch — pushing the one non-negotiable safety rule (CLAUDE.md §1) down
// into the query layer so it can't be bypassed by a page that forgets.
// Replaces listConnectionsAsStudent/listConnectionsAsMentor — now spans
// every category, not just Mentorship, since any role can be a requester or
// claimer.
export async function listRequestsForRequester(requesterId: string) {
  const requests = await prisma.helpRequest.findMany({
    where: { requesterId },
    include: {
      claimer: { select: { id: true, name: true, email: true, bio: true, photoUrl: true } },
      meetingPlan: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return requests.map((r) => ({
    ...r,
    claimer: r.claimer
      ? {
          ...r.claimer,
          email: requestContactVisible(r.status, r.respondedAt) ? r.claimer.email : null,
        }
      : null,
  }));
}

export async function listRequestsForClaimer(claimerId: string) {
  const requests = await prisma.helpRequest.findMany({
    where: { claimerId },
    include: {
      requester: { select: { id: true, name: true, email: true, bio: true, photoUrl: true } },
      meetingPlan: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return requests.map((r) => ({
    ...r,
    requester: {
      ...r.requester,
      email: requestContactVisible(r.status, r.respondedAt) ? r.requester.email : null,
    },
  }));
}

/** OPEN, untargeted requests for a church's blind-claim board (Furniture/
 * Food/Housing/Other, and any Mentorship request posted without picking
 * someone) — every row here is pre-claim by definition, modeled on
 * listOpenRideRequestsForChurch. Blocked pairs must never see each other in
 * a listing (safety rule 2), same exclusion as every other directory/board
 * in this app. */
export async function listOpenRequestsForChurch(churchId: string, viewerId: string) {
  const [requests, excluded] = await Promise.all([
    prisma.helpRequest.findMany({
      where: { churchId, status: REQUEST_STATUS.OPEN },
      include: { requester: { select: { id: true, name: true, photoUrl: true } } },
      orderBy: { createdAt: "asc" },
    }),
    blockedPairUserIds(viewerId),
  ]);
  return requests.filter((r) => !excluded.has(r.requesterId));
}

/** Every HelpRequest at this church, every status/category — for a church
 * leader's oversight view, modeled on listAllRideRequestsForChurch. A
 * leader isn't a party to a request claimed by someone else, so the
 * requester's contact info for those stays hidden; but for the one row
 * where `claimerId === viewerId` (the leader claimed it themself), that
 * row's requester contact is revealed the same way listRequestsForClaimer
 * reveals it. */
export async function listAllRequestsForChurch(churchId: string, viewerId: string) {
  const requests = await prisma.helpRequest.findMany({
    where: { churchId },
    include: {
      requester: { select: { id: true, name: true, email: true, photoUrl: true } },
      claimer: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return requests.map((r) => {
    const isMyClaim = r.claimerId === viewerId;
    return {
      ...r,
      requester: {
        ...r.requester,
        email:
          isMyClaim && requestContactVisible(r.status, r.respondedAt) ? r.requester.email : null,
      },
    };
  });
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

/** OPEN rides for a church's board — every row here is pre-claim by
 * definition (status: OPEN), so FIRST_VISIT rides get the brief's "first
 * name + profile photo only until claimed" treatment applied unconditionally
 * here at the query layer, same defense-in-depth spirit as the contact-info
 * rules elsewhere. GENERAL rides keep showing the full name — that
 * restriction is specifically about a stranger visiting a church for the
 * first time, not a student already known to their own church's volunteers. */
export async function listOpenRideRequestsForChurch(churchId: string, viewerId: string) {
  // Blocked pairs must never see each other in a listing (safety rule 2) —
  // the same exclusion listMentorsForChurch applies to the friend directory.
  // Without it a blocked volunteer could claim a blocked student's ride, and
  // claiming emails both parties their real addresses, so this board was a
  // path around both the block rule *and* the contact-info rule.
  const [rides, excluded] = await Promise.all([
    prisma.rideRequest.findMany({
      where: { churchId, status: RIDE_STATUS.OPEN },
      include: { student: { select: { id: true, name: true, photoUrl: true } } },
      orderBy: { date: "asc" },
    }),
    blockedPairUserIds(viewerId),
  ]);
  return rides
    .filter((r) => !excluded.has(r.studentId))
    .map((r) => ({
      ...r,
      student:
        r.type === RIDE_REQUEST_TYPE.FIRST_VISIT
          ? { ...r.student, name: r.student.name.split(" ")[0] }
          : r.student,
    }));
}

/** Ride overview for a church's leader — every status, at every church
 * request. A leader isn't a party to a ride claimed by someone else the way
 * the assigned volunteer is, so contact info for those still stays hidden
 * (rideContactVisible's "reveal once claimed" rule is scoped to the two
 * people actually involved). But a leader CAN claim a request themself
 * (see claimRideRequestAction) — for the one row where `volunteerId ===
 * viewerId`, they're now the assigned volunteer, so that row's student
 * contact info is revealed the same way listClaimedRideRequestsForVolunteer
 * reveals it. FIRST_VISIT rows still get the first-name-only treatment
 * regardless of status, same reasoning as listOpenRideRequestsForChurch. */
export async function listAllRideRequestsForChurch(churchId: string, viewerId: string) {
  const rides = await prisma.rideRequest.findMany({
    where: { churchId },
    include: {
      student: { select: { id: true, name: true, email: true, photoUrl: true } },
      volunteer: { select: { id: true, name: true } },
    },
    orderBy: { date: "desc" },
  });
  return rides.map((r) => {
    const isMyClaim = r.volunteerId === viewerId;
    const student =
      r.type === RIDE_REQUEST_TYPE.FIRST_VISIT
        ? { ...r.student, name: r.student.name.split(" ")[0] }
        : r.student;
    return {
      ...r,
      student: { ...student, email: isMyClaim && rideContactVisible(r.status) ? student.email : null },
    };
  });
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
  // Also fetch this student's own CLAIMED Mentorship requests with any of the
  // ride's volunteers, so a ride card can link straight to that existing
  // message thread — same lookup as before, now against HelpRequest instead
  // of the deleted MentorConnection.
  const volunteerIds = rides.map((r) => r.volunteerId).filter(Boolean) as string[];
  const claimedRequests = volunteerIds.length
    ? await prisma.helpRequest.findMany({
        where: {
          requesterId: studentId,
          claimerId: { in: volunteerIds },
          category: REQUEST_CATEGORY.MENTORSHIP,
          status: REQUEST_STATUS.CLAIMED,
        },
        select: { id: true, claimerId: true },
      })
    : [];
  const requestByVolunteer = new Map(claimedRequests.map((r) => [r.claimerId, r.id]));
  return rides.map((r) => ({
    ...r,
    volunteer: r.volunteer
      ? { ...r.volunteer, email: rideContactVisible(r.status) ? r.volunteer.email : null }
      : null,
    requestId: r.volunteerId ? (requestByVolunteer.get(r.volunteerId) ?? null) : null,
  }));
}

/** Full detail for a single ride request, for /rides/[id]. Contact info is
 * gated by the caller (the page checks `viewerIsParty` before rendering
 * email — see rideContactVisible), same defense-in-depth spirit as every
 * other ride/request query in this file, since a page render is a much
 * easier place to leak it by accident than a query already scoped to one
 * viewer. Also resolves a matching CLAIMED Mentorship HelpRequest between
 * the two parties, if any, so the page can offer the same "message via
 * your existing mentor thread" shortcut listRideRequestsForStudent does. */
export async function getRideById(rideId: string) {
  const ride = await prisma.rideRequest.findUnique({
    where: { id: rideId },
    include: {
      student: { select: { id: true, name: true, email: true, photoUrl: true } },
      volunteer: { select: { id: true, name: true, email: true, photoUrl: true } },
      church: { select: { id: true, name: true } },
    },
  });
  if (!ride) return null;

  let requestId: string | null = null;
  if (ride.volunteerId) {
    const matchingRequest = await prisma.helpRequest.findFirst({
      where: {
        requesterId: ride.studentId,
        claimerId: ride.volunteerId,
        category: REQUEST_CATEGORY.MENTORSHIP,
        status: REQUEST_STATUS.CLAIMED,
      },
      select: { id: true },
    });
    requestId = matchingRequest?.id ?? null;
  }

  return { ...ride, requestId };
}

/** Upcoming, non-cancelled ride offers at a church, for the "available
 * rides" board any church member (student or volunteer/mentor) can browse
 * and join. Same blocked-pair exclusion as listOpenRideRequestsForChurch —
 * a blocked volunteer's offer must never appear to the student they
 * blocked (or vice versa), same reasoning as every other directory/board
 * in this app. Also excludes the viewer's own offer, so a volunteer
 * browsing this board doesn't see themselves as a joinable option.
 *
 * Includes each offer's confirmed seat count, the viewer's own claim if
 * any, and — the actual point of showing group rides — the other confirmed
 * riders' names/photos, so students (and mentors riding along) can see who
 * else is in the car before or after joining, same as the doc comment on
 * `riders` explains. A blocked rider is filtered out of that list
 * individually rather than hiding the whole offer, since only one of
 * possibly several riders being blocked shouldn't take the ride away from
 * everyone else. */
export async function listActiveRideOffersForChurch(churchId: string, viewerId: string) {
  const [offers, excluded] = await Promise.all([
    prisma.rideOffer.findMany({
      where: { churchId, cancelledAt: null, date: { gte: new Date(new Date().toDateString()) } },
      include: {
        volunteer: { select: { id: true, name: true, photoUrl: true } },
        claims: {
          where: { status: { not: RSVP_STATUS.CANCELLED } },
          select: {
            studentId: true,
            status: true,
            student: { select: { id: true, name: true, photoUrl: true } },
          },
        },
      },
      orderBy: { date: "asc" },
    }),
    blockedPairUserIds(viewerId),
  ]);
  return offers
    .filter((o) => !excluded.has(o.volunteerId) && o.volunteerId !== viewerId)
    .map((o) => {
      const confirmedClaims = o.claims.filter((c) => c.status === RSVP_STATUS.CONFIRMED);
      const myClaim = o.claims.find((c) => c.studentId === viewerId) ?? null;
      return {
        ...o,
        confirmedCount: confirmedClaims.length,
        seatsLeft: Math.max(0, o.capacity - confirmedClaims.length),
        myClaimStatus: myClaim?.status ?? null,
        // "Riders" reads better than "students" now that a mentor can join
        // too — who else is confirmed for this ride, minus anyone blocked
        // by the viewer.
        riders: confirmedClaims
          .map((c) => c.student)
          .filter((rider) => !excluded.has(rider.id)),
      };
    });
}

/** A volunteer's own offered rides — active and past — with each rider's
 * contact info withheld until their claim is CONFIRMED, same
 * defense-in-depth pattern as listClaimedRideRequestsForVolunteer. */
export async function listRideOffersForVolunteer(volunteerId: string) {
  const offers = await prisma.rideOffer.findMany({
    where: { volunteerId },
    include: {
      claims: {
        where: { status: { not: RSVP_STATUS.CANCELLED } },
        include: { student: { select: { id: true, name: true, email: true, photoUrl: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { date: "desc" },
  });
  return offers.map((o) => ({
    ...o,
    claims: o.claims.map((c) => ({
      ...c,
      student: { ...c.student, email: c.status === RSVP_STATUS.CONFIRMED ? c.student.email : null },
    })),
  }));
}

/** A student's own claimed/waitlisted rides, with the volunteer's contact
 * info withheld until their claim is CONFIRMED. */
export async function listRideOfferClaimsForStudent(studentId: string) {
  const claims = await prisma.rideOfferClaim.findMany({
    where: { studentId, status: { not: RSVP_STATUS.CANCELLED } },
    include: {
      rideOffer: { include: { volunteer: { select: { id: true, name: true, email: true, photoUrl: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  return claims.map((c) => ({
    ...c,
    rideOffer: {
      ...c.rideOffer,
      volunteer: {
        ...c.rideOffer.volunteer,
        email: c.status === RSVP_STATUS.CONFIRMED ? c.rideOffer.volunteer.email : null,
      },
    },
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
      // At most one matching row, just to check "does a real (non-seed)
      // member exist" — distinguishes a church with at least one real,
      // signed-up member from one whose member count is still just a
      // map-seed estimate (see the Bryan/College Station seed's
      // placeholder accounts). Shown on the discover map as a different
      // pin color.
      memberships: {
        where: { user: { email: { not: { endsWith: "@seed.churchedin.internal" } } } },
        select: { id: true },
        take: 1,
      },
    },
  });
  return churches.map((c) => ({
    ...c,
    // displayMemberCount is a deliberate, explicit exception to "member
    // count is the trust signal" (see the field's doc comment in
    // schema.prisma) — set only for known-real churches seeded onto the
    // map ahead of real adoption. Falls back to the real computed count for
    // every other church, unchanged from the original design.
    memberCount: c.displayMemberCount ?? c._count.memberships,
    upcomingEventCount: c._count.events,
    hasRealMembers: c.memberships.length > 0,
  }));
}

/** Finds churches that might already be the one someone's about to create —
 * an exact (case-insensitive) name match, narrowed by city when the new
 * church gave one. A church with no city on file still surfaces on a
 * name-only match rather than being silently excluded, since "no city yet"
 * shouldn't read as "definitely not a match." Deliberately exact-name, not
 * a substring/fuzzy match — "First Baptist Church" fuzzy-matching every
 * other "Baptist" church in the country would be pure noise, not a useful
 * warning. Returns `claimedAt` so the caller can tell "join and claim this"
 * (unclaimed) from "ask its leader for an invite code" (claimed) apart. */
export async function findSimilarChurches(name: string, city?: string | null) {
  const trimmedName = name.trim();
  if (!trimmedName) return [];
  const trimmedCity = city?.trim();
  return prisma.church.findMany({
    where: {
      name: { equals: trimmedName, mode: "insensitive" },
      ...(trimmedCity
        ? { OR: [{ city: { equals: trimmedCity, mode: "insensitive" } }, { city: null }] }
        : {}),
    },
    select: { id: true, name: true, city: true, claimedAt: true },
    take: 5,
  });
}

/** Full profile details for a church, plus member count computed on demand
 * (not cached — same "just count it" convention used everywhere else in
 * this app, e.g. the admin dashboard's memberCount). Member count is the
 * trust signal shown to visitors — see MemberCountBadge. */
export async function getChurchProfile(churchId: string) {
  const [church, memberCount, upcomingEventCount] = await Promise.all([
    prisma.church.findUnique({ where: { id: churchId } }),
    prisma.membership.count({ where: { churchId } }),
    // Same figure listDiscoverableChurches publishes, so it's safe to show a
    // non-member. It lets the profile say "3 upcoming gatherings" without
    // exposing what or when they are, which is member-only data.
    prisma.event.count({
      where: { churchId, status: EVENT_STATUS.PUBLISHED, startsAt: { gte: new Date() } },
    }),
  ]);
  if (!church) return null;
  // See displayMemberCount's doc comment in schema.prisma — an explicit
  // override for known-real churches seeded ahead of real adoption, falling
  // back to the real computed count everywhere else.
  return { ...church, memberCount: church.displayMemberCount ?? memberCount, upcomingEventCount };
}

/** All members of a church with their role, for the admin settings
 * page's member list — admins first, then by join date. */
export function listMembersForChurch(churchId: string) {
  return prisma.membership.findMany({
    where: { churchId },
    include: { user: { select: { id: true, name: true, email: true, photoUrl: true, verified: true } } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });
}

/** Full profile for the /profile/[userId] page — includes the volunteer
 * profile fields (now directly on User, carried forward from the deleted
 * MentorProfile), student profile, and church memberships so the page can
 * verify the viewer shares a church with this person. Rendering collapses
 * to `target.studentProfile ?? target` (a student's dedicated profile takes
 * priority; otherwise the top-level User fields apply) — one fallback
 * pattern instead of branching between two profile models. */
export async function getUserProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      bio: true,
      photoUrl: true,
      verified: true,
      createdAt: true,
      jobTitle: true,
      company: true,
      industry: true,
      languages: true,
      hobbies: true,
      interests: true,
      linkedinUrl: true,
      facebookUrl: true,
      instagramUrl: true,
      openToMentorship: true,
      memberships: {
        select: { churchId: true, role: true, church: { select: { name: true } } },
      },
      studentProfile: {
        select: {
          countryOfOrigin: true,
          school: true,
          major: true,
          graduationYear: true,
          languages: true,
          hobbies: true,
          interests: true,
          careerGoals: true,
          linkedinUrl: true,
          facebookUrl: true,
          instagramUrl: true,
        },
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------

/** Every conversation `userId` is a participant in, most recently active
 * first, for /messages. `requesterId`/`claimerId` are queried directly (not
 * through `request`) since they're denormalized onto Conversation for
 * exactly this — see the model's doc comment. */
export async function listConversationsForUser(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ requesterId: userId }, { claimerId: userId }] },
    orderBy: { lastMessageAt: "desc" },
    include: {
      // Conversation only stores requesterId/claimerId as plain scalars (for
      // the filter above); the actual User rows for display come through
      // the request, which already has that relation.
      request: {
        select: {
          status: true,
          requester: { select: { id: true, name: true, photoUrl: true } },
          claimer: { select: { id: true, name: true, photoUrl: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, senderId: true, createdAt: true, readAt: true },
      },
    },
  });

  return conversations.map((c) => {
    const otherParty = c.requesterId === userId ? c.request.claimer : c.request.requester;
    return {
      id: c.id,
      requestId: c.requestId,
      requestStatus: c.request.status,
      lastMessageAt: c.lastMessageAt,
      lastMessage: c.messages[0] ?? null,
      otherParty,
    };
  });
}

/** Total unread messages across every conversation `userId` is in — the nav
 * badge's count, computed on every authenticated page render the same way
 * hasUnseenEvents already is. One join level (through `conversation`'s
 * denormalized requesterId/claimerId), not through `request`. */
export async function countUnreadMessagesForUser(userId: string): Promise<number> {
  return prisma.message.count({
    where: {
      readAt: null,
      senderId: { not: userId },
      conversation: { OR: [{ requesterId: userId }, { claimerId: userId }] },
    },
  });
}

/**
 * Loads one request's conversation for `viewerId`, enforcing every
 * messaging safety rule at the query layer (same defense-in-depth spirit as
 * listRequestsForRequester/Claimer): the viewer must be a participant, the
 * pair must not be blocked, and the request must be
 * CLAIMED/COMPLETED/CANCELLED with contact actually visible
 * (canViewConversation). Returns null rather than throwing when any of
 * those fail, so the page can render a normal "not found"/"not available"
 * state instead of a 500.
 *
 * Simpler than the old getConversationForConnection: HelpRequest carries
 * its own churchId, so lazy-creating the conversation needs no
 * membership-intersection query to find a shared church.
 */
export async function getConversationForRequest(requestId: string, viewerId: string) {
  let conversation = await prisma.conversation.findUnique({
    where: { requestId },
    include: {
      request: {
        select: {
          status: true,
          requester: { select: { id: true, name: true, photoUrl: true } },
          claimer: { select: { id: true, name: true, photoUrl: true } },
        },
      },
      messages: { orderBy: { createdAt: "asc" }, select: { id: true, body: true, senderId: true, createdAt: true, readAt: true } },
    },
  });

  if (!conversation) {
    const request = await prisma.helpRequest.findUnique({
      where: { id: requestId },
      select: {
        status: true,
        respondedAt: true,
        churchId: true,
        requesterId: true,
        claimerId: true,
      },
    });

    // Gate lazy-creation on requestContactVisible, not just claimerId being
    // set — a targeted (PENDING) request already has claimerId set before
    // the claimer ever responds, so a bare status/claimerId check would
    // wrongly let a withdrawn-before-response request create a thread with
    // someone who was never actually matched.
    if (
      request?.claimerId &&
      requestContactVisible(request.status, request.respondedAt)
    ) {
      await prisma.conversation.upsert({
        where: { requestId },
        create: {
          requestId,
          requesterId: request.requesterId,
          claimerId: request.claimerId,
          churchId: request.churchId,
          lastMessageAt: new Date(),
        },
        update: {},
      });

      conversation = await prisma.conversation.findUnique({
        where: { requestId },
        include: {
          request: {
            select: {
              status: true,
              requester: { select: { id: true, name: true, photoUrl: true } },
              claimer: { select: { id: true, name: true, photoUrl: true } },
            },
          },
          messages: { orderBy: { createdAt: "asc" }, select: { id: true, body: true, senderId: true, createdAt: true, readAt: true } },
        },
      });
    }
  }

  // TypeScript loses the deep types of conversation when we assign it inside the if block.
  // We can assert or just verify it's there.
  if (!conversation || !conversation.request || !conversation.messages) return null;
  if (conversation.requesterId !== viewerId && conversation.claimerId !== viewerId) return null;

  const isBlocked = await isBlockedPair(conversation.requesterId, conversation.claimerId);
  if (!canViewConversation(conversation.request.status, isBlocked)) return null;

  const otherParty =
    conversation.requesterId === viewerId ? conversation.request.claimer : conversation.request.requester;
  return {
    id: conversation.id,
    requestId: conversation.requestId,
    requestStatus: conversation.request.status,
    churchId: conversation.churchId,
    otherParty,
    messages: conversation.messages,
    canSend: canSendMessage(conversation.request.status, isBlocked),
  };
}

// ---------------------------------------------------------------------------
// Reports (moderation queue)
// ---------------------------------------------------------------------------

/** A church leader's moderation queue — OPEN reports first (the ones that
 * actually need action), most recent first within each status. Includes the
 * reported conversation's messages so an admin reviewing a report has the
 * actual context, not just a reason string — this is exactly the moment the
 * app's usual message-privacy stance gives way to a legitimate safety
 * review, the same reasoning contact-info reveals already operate under. */
export function listReportsForChurch(churchId: string) {
  return prisma.report.findMany({
    where: { churchId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      reportedBy: { select: { id: true, name: true } },
      reportedUser: { select: { id: true, name: true } },
      conversation: {
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            select: { id: true, body: true, senderId: true, createdAt: true },
          },
        },
      },
    },
  });
}

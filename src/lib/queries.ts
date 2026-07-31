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
  CONNECTION_STATUS,
} from "@/lib/constants";
import { contactInfoVisible } from "@/lib/connectionState";
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

/** A mentor shows up if they're currently open to mentoring, OR the viewer
 * already has a connection with them (any status) — otherwise a mentor
 * closing themselves off would make an existing pending/accepted/ended
 * connection vanish from the student's own page with no way to see or
 * cancel it. */
export async function listMentorsForChurch(churchId: string, viewerId: string) {
  const excluded = await blockedPairUserIds(viewerId);

  const mentors = await prisma.mentorProfile.findMany({
    where: {
      user: { memberships: { some: { churchId } } },
      OR: [{ openToMentor: true }, { user: { connectionsAsMentor: { some: { studentId: viewerId } } } }],
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
    include: {
      mentor: { select: { id: true, name: true, email: true, bio: true } },
      meetingPlan: true,
    },
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
    include: {
      student: { select: { id: true, name: true, email: true, bio: true } },
      meetingPlan: true,
    },
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

/** Read-only ride overview for a church's leader — every status, no
 * contact info at all (not even once claimed): an admin isn't a party to
 * the ride the way the assigned volunteer is, so this deliberately doesn't
 * reuse rideContactVisible's "reveal once claimed" rule, which is scoped to
 * the two people actually involved. FIRST_VISIT rows still get the
 * first-name-only treatment regardless of status, same reasoning as
 * listOpenRideRequestsForChurch. */
export async function listAllRideRequestsForChurch(churchId: string) {
  const rides = await prisma.rideRequest.findMany({
    where: { churchId },
    include: {
      student: { select: { id: true, name: true, photoUrl: true } },
      volunteer: { select: { id: true, name: true } },
    },
    orderBy: { date: "desc" },
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
    memberCount: c._count.memberships,
    upcomingEventCount: c._count.events,
    hasRealMembers: c.memberships.length > 0,
  }));
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
  return { ...church, memberCount, upcomingEventCount };
}

/** All members of a church with their role, for the admin settings
 * page's member list — admins first, then by join date. */
export function listMembersForChurch(churchId: string) {
  return prisma.membership.findMany({
    where: { churchId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });
}

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------

/** Every conversation `userId` is a participant in, most recently active
 * first, for /messages. `studentId`/`mentorId` are queried directly (not
 * through `connection`) since they're denormalized onto Conversation for
 * exactly this — see the model's doc comment. */
export async function listConversationsForUser(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ studentId: userId }, { mentorId: userId }] },
    orderBy: { lastMessageAt: "desc" },
    include: {
      // Conversation only stores studentId/mentorId as plain scalars (for the
      // filter above); the actual User rows for display come through the
      // connection, which already has that relation.
      connection: {
        select: {
          status: true,
          student: { select: { id: true, name: true } },
          mentor: { select: { id: true, name: true } },
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
    const otherParty = c.studentId === userId ? c.connection.mentor : c.connection.student;
    return {
      id: c.id,
      connectionId: c.connectionId,
      connectionStatus: c.connection.status,
      lastMessageAt: c.lastMessageAt,
      lastMessage: c.messages[0] ?? null,
      otherParty,
    };
  });
}

/** Total unread messages across every conversation `userId` is in — the nav
 * badge's count, computed on every authenticated page render the same way
 * hasUnseenEvents already is. One join level (through `conversation`'s
 * denormalized studentId/mentorId), not through `connection`. */
export async function countUnreadMessagesForUser(userId: string): Promise<number> {
  return prisma.message.count({
    where: {
      readAt: null,
      senderId: { not: userId },
      conversation: { OR: [{ studentId: userId }, { mentorId: userId }] },
    },
  });
}

/**
 * Loads one conversation's full thread for `viewerId`, enforcing every
 * messaging safety rule at the query layer (same defense-in-depth spirit as
 * listConnectionsAsStudent/Mentor): the viewer must be a participant, the
 * pair must not be blocked, and the connection must be ACCEPTED or ENDED
 * (canViewConversation). Returns null rather than throwing when any of
 * those fail, so the page can render a normal "not found"/"not available"
 * state instead of a 500.
 */
export async function getConversationForConnection(connectionId: string, viewerId: string) {
  let conversation = await prisma.conversation.findUnique({
    where: { connectionId },
    include: {
      connection: {
        select: {
          status: true,
          student: { select: { id: true, name: true } },
          mentor: { select: { id: true, name: true } },
        },
      },
      messages: { orderBy: { createdAt: "asc" }, select: { id: true, body: true, senderId: true, createdAt: true, readAt: true } },
    },
  });

  if (!conversation) {
    const connection = await prisma.mentorConnection.findUnique({
      where: { id: connectionId },
      include: {
        student: { select: { id: true, name: true } },
        mentor: { select: { id: true, name: true } }
      }
    });

    if (connection && (connection.status === CONNECTION_STATUS.ACCEPTED || connection.status === CONNECTION_STATUS.ENDED)) {
      const [studentMemberships, mentorMemberships] = await Promise.all([
        prisma.membership.findMany({ where: { userId: connection.studentId }, select: { churchId: true } }),
        prisma.membership.findMany({ where: { userId: connection.mentorId }, select: { churchId: true } }),
      ]);
      const mentorChurchIds = new Set(mentorMemberships.map((m) => m.churchId));
      const sharedChurchId = studentMemberships.find((m) => mentorChurchIds.has(m.churchId))?.churchId;
      
      if (sharedChurchId) {
        await prisma.conversation.upsert({
          where: { connectionId },
          create: { connectionId, studentId: connection.studentId, mentorId: connection.mentorId, churchId: sharedChurchId, lastMessageAt: new Date() },
          update: {},
        });
        
        conversation = await prisma.conversation.findUnique({
          where: { connectionId },
          include: {
            connection: {
              select: {
                status: true,
                student: { select: { id: true, name: true } },
                mentor: { select: { id: true, name: true } },
              },
            },
            messages: { orderBy: { createdAt: "asc" }, select: { id: true, body: true, senderId: true, createdAt: true, readAt: true } },
          },
        });
      }
    }
  }

  // TypeScript loses the deep types of conversation when we assign it inside the if block.
  // We can assert or just verify it's there.
  if (!conversation || !conversation.connection || !conversation.messages) return null;
  if (conversation.studentId !== viewerId && conversation.mentorId !== viewerId) return null;

  const isBlocked = await isBlockedPair(conversation.studentId, conversation.mentorId);
  if (!canViewConversation(conversation.connection.status, isBlocked)) return null;

  const otherParty = conversation.studentId === viewerId ? conversation.connection.mentor : conversation.connection.student;
  return {
    id: conversation.id,
    connectionId: conversation.connectionId,
    connectionStatus: conversation.connection.status,
    churchId: conversation.churchId,
    otherParty,
    messages: conversation.messages,
    canSend: canSendMessage(conversation.connection.status, isBlocked),
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

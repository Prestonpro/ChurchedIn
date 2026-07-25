# ChurchedIn — Build Plan

## Revision note

This plan was reviewed before implementation and revised once, executed against.
The original draft specified Supabase (hosted Postgres + Auth) as the primary
stack. That was dropped during execution because building this app requires
either Docker (for Supabase's local dev stack) or a live Supabase cloud account —
neither of which is available in the execution environment. The stack below
(Prisma + SQLite dev / Postgres prod + custom JWT auth) is what was actually
built, matching the proven pattern from the sibling `church-mobilization-platform`
project. Supabase remains a reasonable choice for a future team with a cloud
account and Docker, but is not what this codebase uses.

The review also caught several structural gaps in the original data model, folded
in below: a missing `Block` model, unspecified waitlist-promotion behavior, and an
unclear semantics for re-requesting a mentor connection after a decline.

**Later change**: email verification (confirm-your-address-before-you-can-RSVP)
was built, then removed entirely by explicit user decision — it was slowing down
manual testing (the link was only reachable via server console logs, with no UI
shortcut), and the tradeoff wasn't worth it for the current stage. There is now
no verification gate anywhere: `User.emailVerified`, the `EmailVerificationToken`
model, and the `/verify/[token]` route no longer exist. The contact-reveal safety
rule in section 8 is unaffected and remains fully enforced — if anything, it now
carries more of the trust burden, since it's the only checkpoint left between an
open signup and a student's contact info being reachable.

## 1. What this is

A warm, communal networking and scheduling platform connecting three groups around
church-based international student ministry:

- **Volunteers** — church members who host events (dinners, mentorship meetups,
  coffee chats, study groups, cultural outings, holiday celebrations) and can also
  opt in as one-on-one mentors.
- **Other volunteers** — who browse events someone else is hosting and join as
  helpers.
- **International students** — who browse/RSVP to events and can independently
  search a mentor directory to request an ongoing one-on-one connection.

Think: a profile-and-feed layer (LinkedIn) plus an events/RSVP layer (Eventbrite/
Meetup) plus a lightweight matching/request layer (mentor connections), scoped per
church, with any church able to sign up and run its own instance of the platform.

## 2. Decisions carried over from the planning conversation

- **Multi-tenant SaaS.** Any church can create an org. Data (events, profiles,
  RSVPs, mentor connections) is scoped per church/org, not global.
- **Responsive web app first.** One Next.js codebase, works on desktop and mobile
  browsers. (PWA installability was mentioned in the original planning
  conversation but is not built in this phase — no manifest/service worker exists.
  Add it as a later phase if wanted, don't assume it's already there.)
- **Open signup, no verification step.** Anyone can sign up and self-select a
  role (volunteer or student) and start using the app immediately — no email
  confirmation gate, no manual admin approval. (An earlier version of this app
  required email verification before RSVPing or messaging mentors; it was
  removed by explicit user decision — see the Revision note at the top of this
  file. Choosing not to verify accounts makes the safety rule below carry more
  weight, not less: it's now the *only* checkpoint standing between signup and
  a student's contact info being reachable.) Because the population includes
  international students interacting with people they haven't vetted, this is
  paired with one hard safety rule (section 8) that is non-negotiable
  regardless of how "open" the signup is.

## 3. Roles & permissions

| Role | Scope | Can do |
|---|---|---|
| **Church Admin** | One org | Manage church profile/settings, see all events/RSVPs/reports for their church, remove members, cancel any event. |
| **Volunteer** | One org | Build a profile, create/edit/cancel events, RSVP to help at others' events, opt in as a mentor (bio, languages, interests), accept/decline mentor connection requests. |
| **International Student** | One org (can join more than one) | Build a lightweight profile (country of origin, school, languages, interests), browse/RSVP to events, browse the mentor directory, send connection requests. |

A cross-org "Platform Owner" role was considered but dropped for this build —
with a single church admin's ability to manage their own org, a super-admin
surface isn't load-bearing for MVP and would just be unused UI. Revisit if/when
there are enough churches on the platform that cross-org abuse patterns emerge.

A user's role is chosen at signup and can be extended (a volunteer can *also* turn
on "open to mentor"), but Church Admin is a separate elevated permission granted by
another admin or claimed by whoever creates the org, not self-selected at signup.

## 4. MVP feature list

1. **Org (church) creation & join flow** — anyone can create a church org
   (becomes its first admin) or join an existing one via a join code. Simple, no
   approval step.
2. **Auth** — email + password. No email verification step (removed — see the
   Revision note above); a new account can RSVP and message mentors
   immediately after signup. Password reset is not yet built.
3. **Profiles** — photo, name, short bio; role-specific fields (volunteer:
   availability, skills/interests, "open to mentor" toggle + mentor bio/languages;
   student: country of origin, school/program, languages, interests).
4. **Events** — create (title, category, description, date/time, location or
   virtual link, optional volunteer/student capacity), edit, cancel. Categories:
   dinner, mentorship, coffee chat, study group, cultural outing, airport pickup,
   holiday celebration, other.
5. **Event feed & detail page** — filterable by category and date, upcoming vs
   past, scoped to the user's church(es).
6. **RSVP with waitlist promotion** — students RSVP as attendees, volunteers RSVP
   as helpers on someone else's event; enforce capacity with automatic
   waitlisting. When a confirmed attendee/helper cancels, the longest-waiting
   `WAITLISTED` RSVP in the same role bucket (helper vs attendee — capacities are
   independent) is auto-promoted to `CONFIRMED` and notified by email. Users can
   cancel their own RSVP; the event creator sees the full roster + waitlist.
7. **Mentor directory** — searchable/filterable list of volunteers with
   "open to mentor" on, showing bio/languages/interests but **no contact info**.
8. **Mentor connection requests** — student sends a short message; mentor
   accepts/declines. Contact info (email) is revealed to both sides **only**
   after acceptance (see section 8 for why email, not open messaging). A
   student may re-request a mentor who previously declined — this flips the
   existing row from `DECLINED` back to `PENDING` rather than creating a new
   row (the unique student/mentor pair constraint means there is only ever one
   connection record per pair); it is not blocked outright, but is subject to
   the same per-student daily rate limit as any other request, which is the
   actual anti-harassment control. Either side can end an `ACCEPTED` connection.
9. **Notifications (email)** — RSVP confirmation, waitlist promotion, new
   mentor connection request, connection accepted/declined, event cancellation.
   No in-app chat or push notifications in MVP — email is the only channel.
10. **Admin dashboard** — church admin sees all events, all RSVP counts, and a
    Reports queue.
11. **Report & block** — two separate mechanisms. **Report**: file a reason
    against a user or event; lands in the admin Reports queue for review, no
    automatic effect. **Block**: a direct, user-initiated action (no admin
    involvement) — a blocked user cannot RSVP to the blocker's events or send
    them a connection request. These are modeled as two separate tables (section
    6) because they serve different purposes: reporting asks an admin to look at
    something, blocking is immediate and unilateral.

## 5. Explicitly out of scope for MVP

- In-app real-time/threaded messaging (MVP is one request message + email after
  that).
- Native mobile app / push notifications / PWA installability.
- Recurring event series or templates.
- Automated interest-based matching/recommendations.
- Multi-language UI (i18n) — the audience needs it eventually, but MVP ships
  English-only.
- Payments/donations for event costs.
- Calendar sync (Google Calendar/ICS export).
- Cross-church mentor connections — a student can only request a mentor who
  shares at least one church membership with them (enforced in the connection
  server action, not just the UI). Revisit if multi-church students need to
  reach mentors elsewhere.

## 6. Data model (Prisma)

```prisma
enum Role {
  CHURCH_ADMIN
  VOLUNTEER
  STUDENT
}

enum EventCategory {
  DINNER
  MENTORSHIP
  COFFEE_CHAT
  STUDY_GROUP
  CULTURAL_OUTING
  AIRPORT_PICKUP
  HOLIDAY_CELEBRATION
  OTHER
}

enum EventStatus {
  PUBLISHED
  CANCELLED
}

enum RsvpRole {
  HELPER
  ATTENDEE
}

enum RsvpStatus {
  CONFIRMED
  WAITLISTED
  CANCELLED
}

enum ConnectionStatus {
  PENDING
  ACCEPTED
  DECLINED
  ENDED
}

enum ReportStatus {
  OPEN
  REVIEWED
  DISMISSED
}

model Church {
  id        String   @id @default(cuid())
  name      String
  city      String?
  joinCode  String   @unique
  createdAt DateTime @default(now())

  memberships Membership[]
  events      Event[]
  reports     Report[]
  adminInvites ChurchAdminInvite[]
  partnershipsRequested ChurchPartnership[] @relation("PartnershipsRequested")
  partnershipsReceived  ChurchPartnership[] @relation("PartnershipsReceived")
}

// Added post-redesign: cross-church collaboration ("Collaborate with
// another church" — see PLAN.md's redesign update note, which originally
// shipped this as a UI-only teaser; this is the backend). One admin
// requests by the other church's join code; either side's admin can
// decline a pending request or end an accepted one, which just deletes the
// row (no history table — same MVP-simplicity spirit as the rest of the
// app). Once ACCEPTED, each church's members can browse (read-only) the
// other's published events; RSVPs, the friend directory, and mentor
// connections stay strictly single-church — the multi-tenancy
// non-negotiable in section 8 isn't loosened for this feature.
model ChurchPartnership {
  id          String            @id @default(cuid())
  status      PartnershipStatus @default(PENDING) // PENDING | ACCEPTED
  createdAt   DateTime          @default(now())
  respondedAt DateTime?

  requestingChurchId String
  requestingChurch   Church @relation("PartnershipsRequested", fields: [requestingChurchId], references: [id])
  partnerChurchId    String
  partnerChurch      Church @relation("PartnershipsReceived", fields: [partnerChurchId], references: [id])

  @@unique([requestingChurchId, partnerChurchId])
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String
  photoUrl     String?
  bio          String?
  createdAt    DateTime @default(now())

  memberships          Membership[]
  mentorProfile        MentorProfile?
  studentProfile       StudentProfile?
  eventsCreated        Event[]            @relation("EventsCreated")
  rsvps                EventRsvp[]
  connectionsAsStudent MentorConnection[] @relation("ConnectionsAsStudent")
  connectionsAsMentor  MentorConnection[] @relation("ConnectionsAsMentor")
  reportsFiled         Report[]           @relation("ReportsFiled")
  reportsReceived      Report[]           @relation("ReportsReceived")
  blocksInitiated      Block[]            @relation("BlocksInitiated")
  blocksReceived       Block[]            @relation("BlocksReceived")
}

model Membership {
  id        String   @id @default(cuid())
  role      Role
  createdAt DateTime @default(now())
  // Added post-redesign: stamped whenever this member visits /events, so
  // the nav can show a small "something's new" dot on the Events link by
  // comparing against Event.createdAt — no separate read/unread table.
  lastSeenEventsAt DateTime?

  userId   String
  user     User   @relation(fields: [userId], references: [id])
  churchId String
  church   Church @relation(fields: [churchId], references: [id])

  @@unique([userId, churchId])
}

model MentorProfile {
  id           String  @id @default(cuid())
  languages    String?
  interests    String?
  openToMentor Boolean @default(true)

  userId String @unique
  user   User   @relation(fields: [userId], references: [id])
}

model StudentProfile {
  id              String  @id @default(cuid())
  countryOfOrigin String?
  school          String?
  languages       String?
  interests       String?

  userId String @unique
  user   User   @relation(fields: [userId], references: [id])
}

model Event {
  id           String        @id @default(cuid())
  title        String
  description  String
  category     EventCategory
  startsAt     DateTime      // stored UTC; render in the viewer's local time
  endsAt       DateTime
  location     String
  isVirtual    Boolean       @default(false)
  // Added in the ChurchedIn redesign (Phase 6): signals the host wants to
  // use the church building instead of a personal home. Just a flag for the
  // church leader to notice — no booking/reservation system behind it.
  atChurch     Boolean       @default(false)
  volunteerCap Int?
  studentCap   Int?
  status       EventStatus   @default(PUBLISHED)
  createdAt    DateTime      @default(now())

  churchId    String
  church      Church @relation(fields: [churchId], references: [id])
  createdById String
  createdBy   User   @relation("EventsCreated", fields: [createdById], references: [id])

  rsvps   EventRsvp[]
  cohosts EventCohost[]
}

model EventRsvp {
  id        String     @id @default(cuid())
  role      RsvpRole
  status    RsvpStatus @default(CONFIRMED)
  createdAt DateTime   @default(now())

  eventId String
  event   Event  @relation(fields: [eventId], references: [id])
  userId  String
  user    User   @relation(fields: [userId], references: [id])

  @@unique([eventId, userId])
}

// Added in the ChurchedIn redesign (Phase 5). A volunteer invited by the
// event's original creator to co-host: same read visibility as the
// creator, but never cancel/delete rights (creator-only, checked in
// cancelEventAction). Adding one is immediate — no accept/decline step,
// deliberately, for MVP simplicity.
model EventCohost {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())

  eventId String
  event   Event  @relation(fields: [eventId], references: [id])
  userId  String
  user    User   @relation(fields: [userId], references: [id])

  @@unique([eventId, userId])
}

// Added in the ChurchedIn redesign (Phase 9) — invites someone by email to
// become a second CHURCH_ADMIN. Same hash-at-rest / single-use / expiring
// pattern as PasswordResetToken (below), which itself predates this redesign
// but was never backfilled into this doc — noted here for completeness.
model ChurchAdminInvite {
  id        String    @id @default(cuid())
  tokenHash String    @unique
  email     String
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())

  churchId String
  church   Church @relation(fields: [churchId], references: [id])
}

// Predates the ChurchedIn redesign (added during the earlier Postgres/auth
// hardening pass) but was likewise never backfilled here. Same shape as
// ChurchAdminInvite above — hash-at-rest, single-use, expiring.
model PasswordResetToken {
  id        String    @id @default(cuid())
  tokenHash String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())

  userId String
  user   User   @relation(fields: [userId], references: [id])
}

model MentorConnection {
  id          String           @id @default(cuid())
  status      ConnectionStatus @default(PENDING)
  message     String?
  createdAt   DateTime         @default(now())
  respondedAt DateTime?

  studentId String
  student   User   @relation("ConnectionsAsStudent", fields: [studentId], references: [id])
  mentorId  String
  mentor    User   @relation("ConnectionsAsMentor", fields: [mentorId], references: [id])

  @@unique([studentId, mentorId])
}

model Block {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())

  blockerId String
  blocker   User   @relation("BlocksInitiated", fields: [blockerId], references: [id])
  blockedId String
  blocked   User   @relation("BlocksReceived", fields: [blockedId], references: [id])

  @@unique([blockerId, blockedId])
}

model Report {
  id       String       @id @default(cuid())
  reason   String
  details  String?
  status   ReportStatus @default(OPEN)
  createdAt DateTime    @default(now())

  churchId String
  church   Church @relation(fields: [churchId], references: [id])

  reportedById String
  reportedBy   User   @relation("ReportsFiled", fields: [reportedById], references: [id])

  reportedUserId String?
  reportedUser   User?   @relation("ReportsReceived", fields: [reportedUserId], references: [id])

  eventId String?
}
```

Note: `Membership` (not a role column directly on `User`) is what makes multi-org
membership possible — a student attending events at two churches is one `User`
row with two `Membership` rows. This is the one structural decision worth locking
in early since retrofitting it later is expensive.

## 7. Tech stack (as built)

- **Next.js (App Router) + TypeScript** — server actions for mutations, no
  separate REST layer.
- **Tailwind CSS v4** — utility styling; component primitives built directly
  rather than pulled from shadcn/ui, to avoid an extra dependency surface for an
  MVP-sized UI.
- **Prisma + SQLite (dev) / Postgres (prod)** — same pattern as
  `church-mobilization-platform`: zero-setup local dev, swap the datasource for a
  real deployment.
- **Custom auth**: httpOnly JWT session cookies (`jose`) + `bcryptjs` password
  hashing. No third-party auth provider — chosen because a hosted-Postgres +
  managed-auth stack (Supabase) needs either Docker or a cloud account, neither
  available here. Tenant isolation (a church's data never leaking to another
  church) is enforced in the server actions themselves — every query is scoped
  by the caller's `Membership` rows, checked explicitly in code, not by a
  database-level policy layer.
- **Email**: a `src/lib/email.ts` abstraction with a console/dev-log transport
  for local development (no external account needed to run the app), designed to
  be swapped for Resend or another provider in production by changing one file.
- **Vitest** for unit tests (RSVP capacity/waitlist, connection state machine).
  Playwright e2e and a hosted deployment are follow-up work, not part of this
  build pass — see section 10's final status.

## 8. Non-negotiable safety rule

**A student's and a volunteer/mentor's contact information is never shown to the
other party until a `MentorConnection` reaches `ACCEPTED`.** This is the one rule
in the entire app that exists specifically to protect a vulnerable population
(international students interacting with people they haven't vetted) despite the
"open signup" trust model.

The post-acceptance reveal is limited to **email address**, deliberately not an
in-app open-ended messaging surface — narrower blast radius than a full
messaging feature, and building real-time messaging is out of scope for MVP
(section 5) regardless. If a later
request asks to relax the reveal boundary itself ("just show the email on the
directory card", "let students email mentors directly without a request"), treat
that as a scope/safety decision requiring explicit confirmation from the user —
not a routine change to wave through.

Secondary safety nets: connection requests are rate-limited per student per day,
and the report/block mechanisms in section 4.11 are enforced in every relevant
server action (blocked users are filtered out of directory results and denied at
the RSVP/connection-request action itself, not just hidden in the UI).

## 9. Repo & project structure (as built)

```
church-linkedin/
  prisma/
    schema.prisma
  src/
    app/
      (public)/        landing, signup, login, join/[code], join-as-admin/[token]
      admin/            church admin dashboard (partnerships), welcome (co-leader invite), events, reports
      volunteer/         dashboard, profile, events (create/manage, cohost invite), mentor toggle
      student/            dashboard, profile, mentors (directory), connections
      events/             shared event feed (own + partner-church) + detail page (cohosts, atChurch, run-again)
    components/
      ui/                hand-built primitives (Button, Card, Field, Badge, StatCard,
                         DateBadge, AttendeeAvatars, ...)
      nav/                 AuthShell (async — computes the unseen-events nav badge), NavLinks, MobileMenu, ...
    lib/
      actions/           server actions (auth, events, rsvps, mentors, connections,
                         reports, blocks, churchInvites, churchPartnerships)
      auth.ts             session + role/membership guards
      session.ts           JWT cookie signing/verification
      password.ts           bcrypt hashing
      email.ts               dev-log transport, swappable for Resend
      emailTemplates.ts        notification + invite email bodies
      prisma.ts               Prisma client singleton
      validation.ts            zod schemas
    generated/prisma/          Prisma client output
  proxy.ts                     route protection middleware
```

## 10. Build phases and status

1. **Scaffold** — Next.js + TypeScript + Tailwind, Prisma wired to SQLite.
2. **Schema & migration** — the data model in section 6.
3. **Core libs** — password hashing, session/JWT, auth guards, validation, dev
   email transport.
4. **Auth & org join flow** — signup, login, logout, church create/join-by-code.
   (No email verification step — see the Revision note.)
5. **Domain server actions** — events CRUD, RSVP with capacity + waitlist +
   auto-promotion, mentor profiles, mentor connections (with the
   decline-then-re-request state flip), reports, blocks.
6. **UI** — landing, auth screens, event feed/detail, event create/manage,
   mentor directory, connections, profiles, admin dashboard.
7. **Unit tests** — RSVP capacity/waitlist logic and the mentor connection state
   machine specifically, since both have real edge cases.
8. **Local verification** — dev server boots, build succeeds, lint passes, core
   flows smoke-tested manually.
9. **README** — setup, architecture, the safety rule in section 8.

**Update**: Playwright e2e tests were added after this plan was first written —
see `e2e/` and the README's Testing section. Connection-request rate limiting
is also implemented (DB-backed count against `MentorConnection.lastRequestedAt`,
no external store needed). A dedicated security-review pass, Vercel
production deployment, and Resend (real API key) were all completed in a
later hardening pass, along with `error.tsx`/`global-error.tsx` boundaries
and `PasswordResetToken`-backed forgot-password flow.

**Update — ChurchedIn redesign** (10-phase visual/UX/feature pass, done after
the above): rebrand from "Church LinkedIn" (kept only as internal Prisma
model names like `MentorProfile`/`MentorConnection` — every user-facing label
now reads "friend"), new sage-teal/gold palette, CSS-only landing entrance
animation and dashboard micro-animations, `StatCard`-based dashboard
summaries, Facebook-Events-style card feed with date badges and attendee
avatars, visual event-preset picker, event co-hosting (`EventCohost` model —
see section 6), a church-building venue toggle (`atChurch` on `Event`),
rate-limited new-event email notifications to the whole church
(`notifyChurchOfNewEvent` in `src/lib/actions/events.ts`, capped at
`MAX_EVENT_NOTIFICATIONS_PER_DAY` per church per rolling 24h, serialized with
a Postgres advisory lock to close a TOCTOU race a security review flagged),
a "Run this again" duplicate-event convenience action, and a co-admin invite
flow (`ChurchAdminInvite` model — see section 6) surfaced right after church
creation via `/admin/welcome`. Full details and phase-by-phase decisions are
in `redesign_prompt.md`'s Progress Log.

**Update — post-redesign follow-up** (migration
`20260725002905_add_unseen_events_and_partnerships`): the two items below
that were deliberately skipped during the redesign were subsequently built.
- The **unseen-events nav badge**: `Membership.lastSeenEventsAt` +
  `hasUnseenEvents` query; `AuthShell` (now an async server component)
  computes it per request and threads a `hasBadge` flag through `NavLink`
  to `NavLinks`/`MobileMenu`. `/events` stamps the timestamp on view.
- **Cross-church collaboration**, for real this time: new
  `ChurchPartnership` model (section 6) + `src/lib/actions/
  churchPartnerships.ts` (request by join code, accept/decline, end).
  Deliberately scoped to **read-only shared events only** — RSVPs, the
  friend directory, and mentor connections all stay single-church, since
  loosening RSVP's same-church check would cut into the multi-tenancy
  non-negotiable more than this feature is worth. The admin dashboard's
  static teaser card was replaced with a real `PartnershipManager`.

Full details in `redesign_prompt.md`'s Progress Log (the entry right after
"Final: docs updated").

**Still not done** (call these out explicitly if picking this up later, don't
assume they're covered): the cross-church connection restriction (implemented
in `requestConnectionAction`) isn't yet covered by an automated test;
cross-church partnerships don't send an email notification when requested —
visible in-app only, an explicit MVP scope choice; scroll-triggered stagger
animation on the landing page's below-fold features grid was skipped as
out-of-scope for a CSS-only, no-animation-library constraint.

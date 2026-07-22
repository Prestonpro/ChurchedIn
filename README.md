# Church LinkedIn (working name)

A LinkedIn-style networking and scheduling platform connecting three groups
around church-based international student ministry: volunteers who host
events (dinners, mentorship meetups, coffee chats, study groups, cultural
outings, airport pickups, holiday celebrations), other volunteers who join in
to help run them, and international students who RSVP to events and
independently search a mentor directory to request an ongoing one-on-one
connection. Multi-tenant — any church can create its own space with a join
code, scoped separately from every other church on the platform.

**Naming note**: ship and test under this working codename, but don't publish
it publicly without picking a different brand name — "LinkedIn" is a
registered trademark, and pairing it with another product name in public
branding invites a takedown/legal request regardless of intent.

See [PLAN.md](./PLAN.md) for the full build plan, the roles/permissions model,
the complete data model with rationale, and what was deliberately left out of
this pass (Playwright e2e, a second security-review pass, production
deployment config, a real email provider, and persistent rate limiting — see
PLAN.md section 10 for the full list before assuming any of those exist).

## Tech stack

- **Next.js 16** (App Router, Turbopack, React 19), server actions for all
  mutations — no separate REST layer.
- **Tailwind CSS v4** — a small custom design system in `src/app/globals.css`
  (`@theme` tokens: deep indigo brand color, warm coral accent for
  mentor/connection surfaces).
- **Prisma 7** with the new `prisma-client` (query-compiler) generator.
  - Local dev: SQLite via `@prisma/adapter-better-sqlite3`.
  - Production: swap the datasource/adapter for Postgres (see below).
- **Auth**: custom session cookies (httpOnly JWT via `jose`) + `bcryptjs`
  password hashing — no third-party auth provider. Tenant isolation (one
  church's data never leaking to another) is enforced in the server actions
  themselves, by checking the caller's `Membership` rows — there is no
  database-level policy layer doing this for you.
- **Validation**: Zod.
- **Email**: `src/lib/email.ts` logs to the console in development (no
  external account needed to run the app) and is designed to be swapped for
  Resend or another provider in production by changing that one file.
- **Tests**: Vitest for the RSVP capacity/waitlist logic and the mentor
  connection state machine — both have real edge cases and are covered by
  unit tests in `src/lib/rsvp.test.ts` and `src/lib/connectionState.test.ts`.
- Route protection via `src/proxy.ts` (Next 16's renamed `middleware.ts`) plus
  server-side role guards in `src/lib/auth.ts`.

## Getting started

```bash
npm install
cp .env.example .env   # then generate a real SESSION_SECRET (see below)
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | SQLite file path in dev, e.g. `file:./dev.db` |
| `SESSION_SECRET` | Random secret used to sign session cookies (`openssl rand -hex 32`) |
| `APP_URL` | Base URL used to build links in emails (verification, etc.) |
| `RESEND_API_KEY` | Optional — set this to switch `src/lib/email.ts` from console logging to real Resend delivery |

### Database

The Prisma schema lives in `prisma/schema.prisma`. Local dev uses SQLite for a
zero-setup experience:

```bash
npx prisma migrate dev     # apply migrations + regenerate the client
npx prisma studio          # inspect data
```

To move to Postgres for a real deployment: change `datasource db { provider }`
in `schema.prisma` to `"postgresql"`, swap the adapter in `src/lib/prisma.ts`
from `@prisma/adapter-better-sqlite3` to `@prisma/adapter-pg` (or your host's
adapter), point `DATABASE_URL` at your Postgres instance, and re-run
`prisma migrate dev`.

## Roles

| Role | Can do |
|---|---|
| `CHURCH_ADMIN` | Manage church settings, see all events/RSVPs/reports for their church, cancel any event. |
| `VOLUNTEER` | Create/edit/cancel events, RSVP to help at others' events, opt in as a mentor, accept/decline mentor connection requests. |
| `STUDENT` | Browse/RSVP to events, browse the mentor directory, send connection requests. |

A user's role is per-`Membership`, not global to their account — the same
person could in principle belong to two churches with different roles, though
in practice almost everyone has exactly one membership. See PLAN.md section 6
for why this is modeled as a join table rather than a column on `User`.

## The one non-negotiable safety rule

**A student's and a volunteer/mentor's contact information is never shown to
the other party until a `MentorConnection` reaches `ACCEPTED` status.** This
exists specifically to protect a vulnerable population — international
students interacting with people they haven't vetted — despite the platform's
otherwise "open signup, light verification" trust model.

The reveal is limited to **email address**, not open-ended in-app messaging:
email at least ties the interaction to a verified, identifiable account. The
reveal happens in exactly one place in the codebase —
`respondToConnectionAction`'s `ACCEPT` branch in
`src/lib/actions/connections.ts` — and nowhere else should ever surface either
party's email before that point. If a future change asks to relax this ("just
show the email on the directory card", "let students message mentors without
a request"), treat it as a scope/safety decision requiring explicit
confirmation, not a routine refactor.

Two secondary controls back this up: connection requests are rate-limited per
student per day (`MAX_CONNECTION_REQUESTS_PER_DAY` in `src/lib/constants.ts`,
enforced by counting recent `MentorConnection.lastRequestedAt` values — no
external rate limiter needed), and the `Block`/`Report` mechanisms are
enforced inside the relevant server actions themselves (a blocked user is
rejected at the RSVP/connection-request action, not just hidden in the UI).

## Project structure

```
src/
  app/
    (public)/          landing, signup, login, verify/[token], join, join/[code]
    admin/               church admin dashboard, reports
    volunteer/           dashboard, profile (mentor toggle), events/new
    student/              dashboard, profile, mentors (directory)
    events/                shared event feed + detail page (RSVP lives here)
  components/
    ui/                   hand-built primitives (Button, Card, Field, Badge, ...)
    nav/                    AuthShell (authenticated layout), PublicHeader
    ConnectionActions.tsx    accept/decline/end buttons for mentor connections
    BlockButton.tsx
  lib/
    actions/               server actions (auth, events, rsvps, mentors, connections, reports, blocks)
    auth.ts                 session + role/membership guards
    session.ts                JWT cookie signing/verification
    password.ts                bcrypt hashing
    email.ts                    dev-log transport, swappable for Resend
    prisma.ts                     Prisma client singleton
    queries.ts                     shared read helpers (events, mentors, connections, reports)
    rsvp.ts                         pure capacity/waitlist decision logic (unit tested)
    connectionState.ts               pure connection state machine (unit tested)
    validation.ts                     zod schemas
  generated/prisma/                    Prisma client output
proxy.ts                                route protection middleware
```

## What's not done yet

Called out explicitly so a future session doesn't assume these exist:

- Playwright e2e tests for the critical flows (signup → RSVP, host event →
  another volunteer helps, student → mentor connection → contact reveal,
  blocked user is denied).
- A dedicated second-reviewer security pass.
- Production deployment config (Vercel + Postgres).
- Resend wired to a real API key (currently console-logs in dev).
- The cross-church connection restriction (a student can only request a
  mentor who shares a church with them) is enforced in
  `requestConnectionAction`, but hasn't been exercised by an automated test —
  double-check it if you touch that code path.

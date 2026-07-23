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
this pass (see "What's not done yet" below before assuming something exists).

## Tech stack

- **Next.js 16** (App Router, Turbopack, React 19), server actions for all
  mutations — no separate REST layer.
- **Tailwind CSS v4** — a small custom design system in `src/app/globals.css`
  (`@theme` tokens: deep indigo brand color, warm coral accent, plus a
  7-color event-category palette in `src/lib/eventCategoryStyle.tsx`).
  Plus Jakarta Sans (`next/font/google`) and Phosphor Icons
  (`@phosphor-icons/react`) throughout — hand-built primitives in
  `src/components/ui/`, no shadcn/ui.
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
  connection state machine (`src/lib/rsvp.test.ts`,
  `src/lib/connectionState.test.ts`), plus Playwright e2e tests for the
  critical flows against a dedicated SQLite file (`e2e/` — see Testing below).
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
| `APP_URL` | Base URL used to build links in emails (event links, etc.) |
| `RESEND_API_KEY` | Optional — set this to switch `src/lib/email.ts` from console logging to real Resend delivery |
| `EMAIL_FROM` | Optional — the "from" address Resend sends as, e.g. `Church LinkedIn <onboarding@resend.dev>` (see Email setup below) |

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

## Email setup (Resend)

The app runs fully without this — every "sent" email just prints to your
terminal (see `src/lib/email.ts`) so you can develop and test with zero
external accounts. To make emails actually arrive in an inbox:

1. **Sign up at [resend.com](https://resend.com)** — the free tier (100
   emails/day, 3,000/month) is plenty for development and small-scale use.
2. **Create an API key**: dashboard → API Keys → Create API Key. Copy it —
   you won't be able to see it again.
3. **Add it to your local `.env`** (never commit this or paste it into a
   chat — it's a real credential):
   ```
   RESEND_API_KEY="re_your_key_here"
   ```
4. **Restart `npm run dev`.** That's it — `src/lib/email.ts` automatically
   switches from console-logging to actually calling Resend's API once the
   key is present. No other code changes needed.

**The domain catch** (this is the part that surprises people): until you
verify your own sending domain in Resend, you're on their shared test domain
(`onboarding@resend.dev`), and Resend will only actually *deliver* to the
email address on your own Resend account — every other recipient gets
silently accepted by the API but never delivered. That's fine for solo
testing (sign up/RSVP with your own email and you'll see it land), but for
real users to receive real emails, you need to:

5. **Verify a domain you own**: dashboard → Domains → Add Domain, then add
   the DNS records Resend gives you (a few TXT/CNAME records at your domain
   registrar). This usually takes a few minutes to propagate.
6. **Update `EMAIL_FROM`** in `.env` to use that domain, e.g.
   `EMAIL_FROM="Church LinkedIn <hello@yourdomain.org>"`.

Until then, `EMAIL_FROM` must stay on `onboarding@resend.dev` or Resend will
reject the send entirely.

## Deployment (Vercel)

**Why Vercel, not Cloudflare**: this app needs a real Node.js server (server
actions, `bcryptjs`, native SQLite bindings in dev) — Cloudflare Workers/Pages
run a more restricted edge runtime without native modules or a writable
filesystem, so it can't run this as-is without a real rework (swapping to
Cloudflare D1, adjusting the Prisma adapter, reworking anything that assumes
Node APIs). Vercel runs Node.js natively, which is a much smaller lift from
what's already built.

**Also important**: SQLite (the local dev database) will not work in
production on Vercel — serverless functions get a fresh, throwaway filesystem
per invocation, so a SQLite file wouldn't persist between requests. A real
deployment needs Postgres. This isn't optional polish, it's a hard
requirement before anyone's data would reliably survive a page reload.

Steps, in order:

1. **Provision a Postgres database.** Easiest paths: Vercel's own Postgres
   integration (via Neon, added from your Vercel project's Storage tab), or
   a free tier elsewhere (Neon, Supabase, Railway all work) — you just need
   a `postgresql://...` connection string.
2. **Switch the schema to Postgres**:
   - In `prisma/schema.prisma`, change `datasource db { provider = "sqlite" }`
     to `provider = "postgresql"`.
   - Install the Postgres adapter: `npm install @prisma/adapter-pg`.
   - In `src/lib/prisma.ts`, swap `PrismaBetterSqlite3` for `PrismaPg` (from
     `@prisma/adapter-pg`) — same shape, just a different constructor.
   - This is a real branch point: your local dev environment will also need
     to point at a Postgres database from here on (or keep a separate
     branch/schema for local SQLite dev — your call).
3. **Push the schema to your production database**: with `DATABASE_URL`
   pointed at the new Postgres instance, run `npx prisma migrate deploy`
   (applies existing migrations; doesn't prompt interactively, safe for
   scripted/CI use unlike `migrate dev`).
4. **Already configured**: `package.json` has a `postinstall: "prisma generate"`
   script, so the Prisma client regenerates automatically on every deploy's
   `npm install` — Vercel needs this since it doesn't otherwise know to
   regenerate the client from the schema.
5. **Import the repo into Vercel**: [vercel.com/new](https://vercel.com/new)
   → import `Prestonpro/church-linkedin` from GitHub. Vercel auto-detects
   Next.js; no custom build command needed beyond step 4.
6. **Set environment variables** in the Vercel project's Settings →
   Environment Variables (production values, not your local `.env`):
   `DATABASE_URL` (your Postgres connection string), `SESSION_SECRET` (a
   fresh `openssl rand -hex 32` — don't reuse your local dev one),
   `APP_URL` (your real deployed URL, e.g. `https://your-app.vercel.app`),
   and `RESEND_API_KEY`/`EMAIL_FROM` if you've set up email per the section
   above.
7. **Deploy.** Vercel builds and deploys on every push to `main` once
   connected.

## Testing

```bash
npm run test        # Vitest — pure logic: RSVP capacity/waitlist, connection state machine
npm run test:e2e     # Playwright — critical flows, real browser, real (temporary) database
```

The e2e suite (`e2e/`) runs against its own dedicated SQLite file
(`e2e/.test.db`) and its own dev server port (3100), so it never touches your
real `dev.db` or collides with a `npm run dev` you might have running on
3000 — **Next.js only allows one dev instance per project directory**, though,
so if you have your own `npm run dev` running, stop it first or the e2e
server will fail to start.

Four specs cover the flows in section 8's threat model plus the core
scheduling mechanics: signup → host an event; RSVP capacity waitlisting a
second helper and auto-promoting them when the first cancels; a mentor
connection request being invisible-until-accepted, then revealing contact
info; and a blocked mentor disappearing from the student's directory.

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
otherwise "open signup, no verification" trust model. There is no email
verification step at all (it was built, then deliberately removed — see
PLAN.md's Revision note), which makes this rule carry *more* weight, not
less: it's the only checkpoint left between an open signup and a student's
contact info being reachable.

The reveal is limited to **email address**, not open-ended in-app messaging —
narrower blast radius than a full messaging surface would be. The reveal
happens in exactly one place in the codebase —
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
e2e/                                    Playwright specs + helpers (own SQLite file, own port)
src/
  app/
    (public)/          landing, signup, login, join, join/[code]
    admin/               church admin dashboard, reports
    volunteer/           dashboard, profile (mentor toggle), events/new
    student/              dashboard, profile, mentors (directory)
    events/                shared event feed + detail page (RSVP lives here)
  components/
    ui/                   hand-built primitives (Button, Card, Field, Badge, Avatar,
                           CapacityBar, EmptyState, CopyButton, SubmitButton, ...)
    nav/                    AuthShell (authenticated layout + top nav), AuthPageLayout
                            (split-panel auth screens), NavLinks, ChurchSwitcher
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
    eventCategoryStyle.tsx            category → icon/color mapping
    validation.ts                     zod schemas
  generated/prisma/                    Prisma client output
proxy.ts                                route protection middleware
```

## What's not done yet

Called out explicitly so a future session doesn't assume these exist:

- Email verification and password reset — neither exists. Any email/password
  works at signup with no confirmation step; there's no "forgot password"
  flow if someone loses their password.
- A dedicated second-reviewer security pass.
- Not actually deployed yet — the Deployment section above has the exact
  steps, but nobody's run them (no Postgres provisioned, no Vercel project
  created, schema is still `sqlite`).
- Not actually wired to a real Resend account yet — the Email setup section
  above has the exact steps, but no API key has been added.
- The cross-church connection restriction (a student can only request a
  mentor who shares a church with them) is enforced in
  `requestConnectionAction`, but isn't covered by the e2e suite yet — double
  check it if you touch that code path.
- The e2e suite covers the four critical flows in the Testing section above,
  not every edge case (e.g. email/RSVP rate limiting, multi-church
  membership switching, report filing) — extend it as new flows matter.

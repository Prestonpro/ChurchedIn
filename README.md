# ChurchedIn

A warm, communal networking and scheduling platform connecting three groups
around church-based international student ministry: volunteers who plan
gatherings (dinners, friend/guide chats, coffee chats, study groups, cultural
outings, airport pickups, holiday celebrations), other volunteers who join in
to help run them, and international students who RSVP to gatherings and
independently browse a directory of friends/guides to reach out for an
ongoing one-on-one connection. Multi-tenant — any church can create its own
space with a join code, scoped separately from every other church on the
platform.

See [PLAN.md](./PLAN.md) for the full build plan, the roles/permissions model,
the complete data model with rationale, and what was deliberately left out of
this pass (see "What's not done yet" below before assuming something exists).

## Tech stack

- **Next.js 16** (App Router, Turbopack, React 19), server actions for all
  mutations — no separate REST layer (except the Google OAuth redirect/
  callback routes under `src/app/api/auth/`, which have to be real HTTP
  routes since Google redirects a browser to them).
- **Tailwind CSS v4** — a small custom design system in `src/app/globals.css`
  (`@theme` tokens: deep indigo brand color, warm coral accent, plus a
  7-color event-category palette in `src/lib/eventCategoryStyle.tsx`).
  Plus Jakarta Sans (`next/font/google`) and Phosphor Icons
  (`@phosphor-icons/react`) throughout — hand-built primitives in
  `src/components/ui/`, no shadcn/ui. Responsive down to 320px, with a
  hamburger/drawer nav below the `lg` breakpoint (`src/components/nav/
  MobileMenu.tsx`) and PWA support (`public/manifest.json`, app icons).
- **Prisma 7** with the new `prisma-client` (query-compiler) generator,
  Postgres via `@prisma/adapter-pg`. See [DEPLOYMENT.md](./DEPLOYMENT.md) for
  provisioning a database (Neon recommended). Model names predate the
  ChurchedIn rebrand and stay as-is internally (`MentorProfile`,
  `MentorConnection`) even though every user-facing label now reads "friend"
  — see PLAN.md's redesign update note.
- **Event co-hosting & venue toggle**: the event creator can add other
  volunteers as co-hosts (`EventCohost`, immediate add, no accept step —
  `src/lib/actions/events.ts`), who get full RSVP visibility and edit rights
  but never cancel rights. Events can also be flagged `atChurch` to show an
  "(at church)" badge — a signal for the church leader, not a booking system.
- **New-event email notifications**: publishing an event emails every other
  church member ("New gathering at ..."), rate-limited to
  `MAX_EVENT_NOTIFICATIONS_PER_DAY` per church per rolling 24h window,
  serialized with a Postgres advisory lock (`pg_advisory_xact_lock`) so
  concurrent event creation can't bypass the cap.
- **Co-admin invites**: a church admin can invite a second `CHURCH_ADMIN` by
  email right after creating their church (`/admin/welcome`), via the same
  hash-at-rest/single-use/expiring token pattern as password reset
  (`ChurchAdminInvite`, `src/lib/actions/churchInvites.ts`).
- **Cross-church collaboration**: an admin can request a partnership with
  another church by its join code (`ChurchPartnership`, `src/lib/actions/
  churchPartnerships.ts`); once accepted, `/events` shows a read-only "From
  partner churches" section and the event detail page allows a read-only
  view for the partner church's members. RSVPs, the friend directory, and
  mentor connections all stay strictly single-church — this feature only
  ever loosens read access to already-published event data.
- **Unseen-events nav badge**: `Membership.lastSeenEventsAt` + a small dot
  on the Events nav link when the church has events created since the
  member's last visit — clears the next time they visit `/events`.
- **Rides board**: students ask for a ride (`RideRequest`, `/student/rides`)
  and any volunteer at the same church can claim it (`/volunteer/rides`,
  `src/lib/actions/rides.ts`). Same contact-reveal-only-after-claim safety
  rule as mentor connections and cross-church partnerships — see
  `rideContactVisible()` in `src/lib/rideState.ts`.
- **Semester calendar**: `/events/calendar`, a CSS-grid monthly view (no
  calendar library) with category and "my RSVP'd events" filters, linked to
  and from the existing event feed (`/events`).
- **Interactive event map**: `/events/map` — a full-screen Leaflet map
  (`leaflet` + `react-leaflet`, free CartoDB/OSM tiles, no API key) with
  color-coded pins (blue = you RSVP'd, green/yellow/red by capacity), a
  filterable sidebar, and glassmorphism popups with a working RSVP button.
  The event detail page shows a small mini-map + "Get directions" link when
  an event has coordinates, and the creation form has an optional
  click-to-drop-a-pin location picker. See `src/lib/eventMapStatus.ts` for
  the pin-color logic and `src/lib/leafletPin.ts` for the shared marker
  helper.
- **Auth**: custom session cookies (httpOnly JWT via `jose`) + `bcryptjs`
  password hashing, plus a hand-rolled Google OAuth flow (no NextAuth — see
  `PLAN.md` for the reasoning) — `src/lib/googleOAuth.ts`,
  `src/lib/oauthState.ts`, `src/app/api/auth/`. Tenant isolation (one
  church's data never leaking to another) is enforced in the server actions
  themselves, by checking the caller's `Membership` rows — there is no
  database-level policy layer doing this for you.
- **Validation**: Zod.
- **Email**: Resend (`src/lib/email.ts`), with branded HTML templates
  (`src/lib/emailLayout.ts`, `src/lib/emailTemplates.ts`) sent alongside a
  plain-text fallback. Logs to the console instead of calling Resend when
  `RESEND_API_KEY` isn't set, so the app is fully testable with zero external
  accounts. A delivery failure is logged, never thrown — it can't crash the
  action (RSVP, connection request, etc.) that triggered it. Covers RSVP
  confirmation/waitlist/promotion, event cancellation, the full mentor
  connection lifecycle, password reset, new-event notifications, and
  co-admin invites.
- **Tests**: Vitest for the RSVP capacity/waitlist logic and the mentor
  connection state machine (`src/lib/rsvp.test.ts`,
  `src/lib/connectionState.test.ts`), plus Playwright e2e tests for the
  critical flows against a dedicated Postgres schema (`e2e/` — see Testing
  below).
- Route protection via `src/proxy.ts` (Next 16's renamed `middleware.ts`) plus
  server-side role guards in `src/lib/auth.ts`.
- Error boundaries (`src/app/error.tsx`, `global-error.tsx`, `not-found.tsx`)
  and per-route `loading.tsx` fallbacks for every data-fetching page.
- SEO: per-page metadata, Open Graph/Twitter cards on the landing page,
  `robots.ts` excluding the authenticated app routes from crawling, and a
  `sitemap.ts` for the public pages.

## Getting started

```bash
npm install
cp .env.example .env   # then fill in real values — see below
npx prisma migrate dev
npm run dev
```

You'll need a Postgres database even for local dev — there's no zero-setup
SQLite fallback. The fastest path is a free [Neon](https://neon.tech) project
(see [DEPLOYMENT.md](./DEPLOYMENT.md) step 1). Google OAuth and Resend are
both optional for local dev (see the env var table below) — everything else
works without them.

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string (pooled, if your provider distinguishes) — see [DEPLOYMENT.md](./DEPLOYMENT.md) |
| `DIRECT_URL` | Direct/unpooled Postgres connection string, used only for `prisma migrate` commands (see DEPLOYMENT.md for why) |
| `SESSION_SECRET` | Random secret used to sign session cookies (`openssl rand -hex 32`) |
| `APP_URL` | Base URL used to build links in emails and the Google OAuth redirect URI |
| `RESEND_API_KEY` | Optional — set this to switch `src/lib/email.ts` from console logging to real Resend delivery |
| `EMAIL_FROM` | Optional — the "from" address Resend sends as, e.g. `ChurchedIn <onboarding@resend.dev>` (see Email setup below) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional — set both to enable "Continue with Google". Without them, the button redirects back to login with a generic error (fails closed, doesn't crash). See DEPLOYMENT.md step 3. |

### Database

The Prisma schema lives in `prisma/schema.prisma`, Postgres-only:

```bash
npx prisma migrate dev     # apply migrations + regenerate the client
npx prisma studio          # inspect data
```

Migrations from before this app ran on Postgres are preserved for reference
under `prisma/migrations.sqlite-archive/` — not applied by anything, just
history.

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
   `EMAIL_FROM="ChurchedIn <hello@yourdomain.org>"`.

Until then, `EMAIL_FROM` must stay on `onboarding@resend.dev` or Resend will
reject the send entirely.

## Deployment

Live at **https://church-linkedin.vercel.app** (the Vercel project/domain
name predates the ChurchedIn rebrand and hasn't been changed — a domain
rename is a separate infra decision, not a code change), deployed on Vercel
via its GitHub integration (auto-deploys on every push to `master`). See
[DEPLOYMENT.md](./DEPLOYMENT.md) for the full step-by-step: provisioning
Neon Postgres, Resend, Google OAuth, importing the project into Vercel,
required environment variables, a post-deploy verification checklist, custom
domain setup, and a troubleshooting section for the gotchas actually hit
while deploying this app.

## Testing

```bash
npm run test        # Vitest — pure logic: RSVP capacity/waitlist, connection state machine
npm run test:e2e     # Playwright — critical flows, real browser, real (temporary) database
```

The e2e suite (`e2e/`) runs against a dedicated `e2e_test` Postgres schema in
the same database as `DATABASE_URL` (dropped and recreated before every run —
see `e2e/global-setup.ts`) and its own dev server port (3100), so it never
touches your real dev data or collides with a `npm run dev` you might have
running on 3000 — **Next.js only allows one dev instance per project
directory**, though, so if you have your own `npm run dev` running, stop it
first or the e2e server will fail to start.

Four specs cover the flows in section 8's threat model plus the core
scheduling mechanics: signup → host an event; RSVP capacity waitlisting a
second helper and auto-promoting them when the first cancels; a mentor
connection request being invisible-until-accepted, then revealing contact
info; and a blocked mentor disappearing from the student's directory.

## Roles

| Role | Can do |
|---|---|
| `CHURCH_ADMIN` (shown to users as "church leader") | Manage church settings, see all events/RSVPs/reports for their church, cancel any event, invite a co-leader. |
| `VOLUNTEER` | Plan/edit/cancel gatherings, co-host others' gatherings, RSVP to help, opt in as a friend, accept/decline reach-outs. |
| `STUDENT` | Browse/RSVP to gatherings, browse the friend directory, reach out to volunteers. |

A user's role is per-`Membership`, not global to their account — the same
person could in principle belong to two churches with different roles, though
in practice almost everyone has exactly one membership. See PLAN.md section 6
for why this is modeled as a join table rather than a column on `User`.

## The one non-negotiable safety rule

**A student's and a volunteer friend's contact information is never shown to
the other party until a `MentorConnection` reaches `ACCEPTED` status.** (The
model name predates the ChurchedIn rebrand and is unchanged internally — only
the user-facing "mentor" → "friend" label changed.) This
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

The reveal is enforced at the **query layer**, not just by page authors
remembering to only render `.email` inside the right status branch:
`listConnectionsAsStudent`/`listConnectionsAsMentor` in `src/lib/queries.ts`
strip the other party's email to `null` for anything not `ACCEPTED` before
the data ever reaches a page component, using `contactInfoVisible()` in
`src/lib/connectionState.ts`. A future page that mistakenly references
`.email` outside the accepted branch gets `null`, not a leak.

## Project structure

```
e2e/                                    Playwright specs + helpers (own Postgres schema, own port)
src/
  app/
    (public)/          landing, signup, login, join, join/[code], join-as-admin/[token],
                        forgot-password, reset-password/[token]
    admin/               church admin dashboard, welcome (co-leader invite prompt), reports
    volunteer/           dashboard, profile (mentor toggle), events/new (preset picker + cohost
                        invite + location picker), rides (rides board)
    student/              dashboard, profile, mentors (directory), rides (request a ride)
    events/                shared event feed (own + partner-church) + detail page (RSVP, co-hosts,
                          run-again, mini-map) + calendar (monthly grid) + map (full-screen
                          interactive map, /events/map)
    api/auth/               Google OAuth start + callback routes
    error.tsx, global-error.tsx, not-found.tsx    error/404 boundaries
    robots.ts, sitemap.ts                          SEO metadata routes
  components/
    ui/                   hand-built primitives (Button, Card, Field, Badge, Avatar,
                           CapacityBar, EmptyState, CopyButton, SubmitButton, PageLoading,
                           GoogleButton, StatCard, DateBadge, AttendeeAvatars, ...)
    nav/                    AuthShell (authenticated layout + top nav — async, computes the
                            unseen-events nav badge; `fullBleed` prop for the map page),
                            MobileMenu (hamburger/drawer below lg), AuthPageLayout (split-panel
                            auth screens), NavLinks, ChurchSwitcher
    ConnectionActions.tsx    accept/decline/end buttons for mentor connections
    RideActionButton.tsx    shared claim/complete/cancel button for the rides pages
    BlockButton.tsx
  lib/
    actions/               server actions (auth, events, rsvps, mentors, connections, reports,
                           blocks, passwordReset, churchInvites, churchPartnerships, rides)
    auth.ts                 session + role/membership guards
    session.ts                JWT cookie signing/verification
    password.ts                bcrypt hashing
    googleOAuth.ts              Google auth URL building, token exchange, ID token verification
    oauthState.ts                signed CSRF state for the OAuth redirect round-trip
    email.ts                    Resend transport (dev-log fallback if no API key)
    emailLayout.ts, emailTemplates.ts   branded HTML email templates (incl. new-event
                                        notification, co-admin invite, ride claimed)
    prisma.ts                     Prisma client singleton (Postgres via @prisma/adapter-pg)
    queries.ts                     shared read helpers (events, mentors, connections, reports,
                                    cohost candidates, ride requests, mapped events)
    rsvp.ts                         pure capacity/waitlist decision logic (unit tested)
    connectionState.ts               pure connection state machine (unit tested)
    rideState.ts                      pure ride-request state machine (unit tested)
    eventMapStatus.ts                 pure pin-color/status logic for the event map (unit tested)
    leafletPin.ts                      shared colored-circle marker helper (all 3 map surfaces)
    eventCategoryStyle.tsx              category → icon/color mapping
    validation.ts                        zod schemas
  generated/prisma/                    Prisma client output
proxy.ts                                route protection middleware
```

## What's not done yet

Called out explicitly so a future session doesn't assume these exist:

- The rides board, calendar view, and interactive event map (see PLAN.md's
  build-phases section) aren't yet covered by the Playwright e2e suite —
  verified with ad hoc smoke scripts during development instead. Add
  proper e2e specs before relying on the suite alone to catch a regression
  in any of them.
- The location picker doesn't geocode — typing an address and dropping a
  pin are independent actions. An event can end up with an address but no
  coordinates (no map pin at all) or coordinates but no address text. This
  is by design (no geocoding API, per the map feature's "no API key"
  constraint), not a bug, but worth knowing if a future change wants to
  enforce the two together.
- The Google OAuth consent screen is in Google Cloud Console's "Testing"
  publish status, which caps sign-in to test users explicitly added there —
  switch it to "Production" publish status when you're ready for anyone to
  sign in with Google.
- `npm audit` flags 3 remaining vulnerabilities nested inside Next.js's own
  bundled `postcss`/`sharp` (image optimization / CSS pipeline) and Prisma's
  optional `prisma dev` local-server tooling (`find-my-way`/`valibot`, a
  devDependency chain this app doesn't invoke). None are reachable through
  this app's actual code paths — no `next/image` usage, no untrusted CSS
  processing, no use of `prisma dev`. `npm audit fix --force` "fixes" the
  first two by downgrading Next.js 7 major versions, which is far worse than
  the vulnerabilities themselves — don't do that. Revisit when Next.js ships
  a real patch release with updated bundled dependencies.
- The cross-church connection restriction (a student can only request a
  mentor who shares a church with them) is enforced in
  `requestConnectionAction`, but isn't covered by the e2e suite yet — double
  check it if you touch that code path.
- The e2e suite covers the critical flows in the Testing section above, not
  every edge case (e.g. multi-church membership switching, report filing) —
  extend it as new flows matter.
- No rate limiting on login attempts or password reset requests beyond the
  existing per-student connection-request limit — a determined attacker
  could brute-force a password or spam reset emails. Low risk at current
  scale (single-church-per-deploy, no public signup discovery), worth adding
  before wider rollout.
- **From the ChurchedIn redesign** (see PLAN.md's redesign update note for
  full details): scroll-triggered stagger animation on the landing page's
  below-fold features grid was skipped (a CSS-only animate-on-mount would
  have already finished before a user scrolls to it, and IntersectionObserver
  felt like scope creep past the "no JS animation library" instruction). The
  in-app nav badge for unseen events and real cross-church collaboration
  backend were originally skipped/UI-only in that pass but have since been
  built (see below).
- Cross-church partnership requests don't send an email notification — only
  visible in-app on the receiving church's admin dashboard. An explicit MVP
  scope choice; add one (reusing `emailTemplates.ts`'s pattern) if partner
  churches need to be notified without checking the dashboard.

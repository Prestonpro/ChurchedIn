# ChurchedIn — Context & Instructions

> The product is ChurchedIn everywhere users can see it, and the deployed
> domain is `churchedin.vercel.app`. "Church LinkedIn" was the working name
> and survives only in the local folder name and the internal OAuth-state
> JWT issuer/audience strings in `src/lib/oauthState.ts`
> (those are opaque claim values, not URLs, so renaming them buys nothing and
> would break any OAuth handshake in flight across the deploy).

## 📌 Project Overview
A church-scoped platform connecting international students with local church
volunteers: events + RSVPs, ride coordination, mentor matching, and church
discovery.
- **Deployment:** Vercel (frontend + serverless) + Neon (PostgreSQL)
- **Live:** pushes to `master` auto-deploy. There is **no** staging environment —
  `master` is production. Verify locally before pushing.

## 🛠 Tech Stack
- **Framework:** Next.js 16 (App Router, Turbopack) + React 19
- **Database:** PostgreSQL (Neon) + Prisma 7 with the driver-adapter pattern
  (`@prisma/client` + `@prisma/adapter-pg`). See `src/lib/prisma.ts`.
- **Styling:** Tailwind CSS v4 (`@theme` tokens in `src/app/globals.css`)
- **Auth:** **Custom JWT auth** — `jose` + `bcryptjs`, plus a hand-rolled Google
  OAuth flow. **Not NextAuth.** See `src/lib/session.ts`, `src/lib/auth.ts`,
  `src/lib/googleOAuth.ts`, `src/lib/oauthState.ts`, and
  `src/app/api/auth/google/` + `src/app/api/auth/callback/google/`.
- **Icons:** Phosphor (`@phosphor-icons/react`) — import from
  `@phosphor-icons/react/dist/ssr` in server components
- **Type:** Plus Jakarta Sans (`--font-jakarta`)
- **Selects:** `react-select`'s `CreatableSelect` via
  `src/components/ui/SearchableSelect.tsx` (allows custom user-entered options)
- **Maps:** Leaflet + React-Leaflet (client-only; loaded via `MiniMapLoader`)
- **Email:** Resend via `src/lib/email.ts` (falls back to console logging when
  `RESEND_API_KEY` is unset, so every flow is testable locally).
  Templates: `emailTemplates.ts` + `emailLayout.ts`.
- **Tests:** Vitest (unit) + Playwright (e2e)

## 👥 Roles & Membership Model
`Role` enum: `CHURCH_ADMIN` | `VOLUNTEER` | `STUDENT`

**Important:** a `User` does not have a single role. Roles live on `Membership`
rows (user ↔ church), so one user can belong to several churches with a
different role in each. The session carries `activeChurchId`, and
`getCurrentUser()` resolves `activeMembership` from it. Most call sites can just
use `activeMembership`. `ChurchSwitcher` changes the active church.

A user can also exist with **no** membership at all — that's the `/browse`
"just looking around" path, which lets someone explore `/discover` before
committing to a church.

- **CHURCH_ADMIN** — church settings, members, join code, admin invites,
  partnerships, ride oversight
- **VOLUNTEER** — host events, RSVP as helper, offer rides, act as mentor
- **STUDENT** — detailed profile (country, school, major, languages, hobbies,
  career goals), RSVP, request rides, request mentors

## 🗂 Data Model (prisma/schema.prisma)
`Church`, `ChurchPartnership`, `ChurchAdminInvite`, `User`,
`PasswordResetToken`, `Membership`, `StudentProfile`, `Event`,
`EventCohost`, `EventRsvp`, `HelpRequest`, `RequestMeetingPlan`,
`RideRequest`, `Block`, `Report`

Enums: `Role`, `EventCategory`, `EventStatus`, `RsvpRole`, `RsvpStatus`,
`RequestCategory`, `RequestStatus`, `MeetingFrequency`, `ReportStatus`,
`PartnershipStatus`, `RideStatus`, `RideRequestType`

A volunteer's mentor-profile fields (job title, company, industry,
languages, hobbies, interests, social links, `openToMentorship`) live
directly on `User` — carried forward from a deleted `MentorProfile` model,
not a separate row. `/profile/[userId]` renders `target.studentProfile ??
target` as its one fallback pattern instead of branching between two
profile models.

## 🔑 Key Workflows
- **Join:** 6-char church code at `/join/[code]`, email/password or Google.
  `/browse` creates a church-less account. `/join-as-admin/[token]` accepts an
  admin invite.
- **Route protection:** `requireUser()` / `requireRole()` in `src/lib/auth.ts`
  (DB-backed). `src/proxy.ts` (Next 16's renamed middleware) does an
  *optimistic* cookie-signature check only, to bounce anonymous visitors early —
  the real authorization always happens server-side in the page/layout.
- **RSVP capacity:** pure, unit-tested logic in `src/lib/rsvp.ts`
  (`decideRsvpStatus`, `pickPromotionCandidate`) kept separate from the
  Prisma-backed actions, so capacity/waitlist rules are testable without a DB.
  Cancelling a CONFIRMED RSVP auto-promotes the longest-waiting waitlister.
- **Requests (Furniture/Food/Mentorship/Housing/Other):** state machine in
  `src/lib/requestState.ts` + `src/lib/actions/requests.ts`. One `HelpRequest`
  model covers two flows: a blind, untargeted post (OPEN → CLAIMED, any
  eligible church member may claim — Furniture/Food/Housing/Other, and
  Mentorship too if posted without picking someone) and the Mentorship
  directory's targeted pick (PENDING → CLAIMED/DECLINED, awaiting the chosen
  volunteer's response). A re-request after DECLINED/COMPLETED/CANCELLED
  creates a new row rather than reviving the old one — see
  `MAX_TARGETED_REQUESTS_PER_DAY` in `constants.ts` for the per-student rate
  limit on the targeted flow. `RideRequest` (below) stays fully separate —
  it predates this system and was deliberately not folded in.
- **Rides:** `src/lib/rideState.ts` + `src/lib/actions/rides.ts`.
- **Event reminders:** `src/lib/eventReminders.ts` +
  `src/app/api/cron/event-reminders/route.ts`.
- **Capacity of 0 is meaningful:** `0` means "not accepting this role",
  `null`/blank means uncapped. Don't collapse the two.

## 🔒 Non-Negotiable Safety Rules
1. **Never expose a requester's or claimer's contact info before a
   `HelpRequest` is `CLAIMED`** (same rule for `RideRequest` — see
   `rideContactVisible()`). `requestContactVisible()` in `requestState.ts` is
   the single source of truth — note it takes `respondedAt` as a second
   argument, not just `status`, because a targeted (PENDING) request already
   has `claimerId` set before the claimer responds, so status alone can't
   distinguish "never claimed" from "claimed, then later cancelled." This
   governs UI, emails, and messaging.
2. **Blocks are bidirectional in effect.** A blocked pair must not see each
   other in directories, must not be able to connect, RSVP to each other's
   events, or (once it exists) message each other. `blockedPairUserIds()` in
   `src/lib/queries.ts` is the helper.
3. **Church scoping.** Users only ever see/act on data within a church they hold
   a membership in. Check this on every new query and action.

## 🎨 Design System
Tailwind v4 `@theme` tokens in `globals.css` — use the semantic names, not raw
hex:
- Surfaces: `paper`, `surface`, `line`, `line-strong`
- Text: `ink`, `ink-soft`, `ink-muted`, `ink-faint`
- Brand: warm sage/teal `brand-50…900` (deliberately *not* corporate blue)
- Accent: warm gold `accent-50…900` for CTAs/highlights
- Status: `success`, `warning`, `danger` (+ `-soft` variants)
- Event categories: 8 warm hue families, `cat-*` / `cat-*-soft`, applied via
  `src/lib/eventCategoryStyle.tsx`
- Motion: `animate-fade-up`, `animate-fade-in`, `transition-brand`,
  `Reveal.tsx`, `PageTransition.tsx`

**Do not introduce another component library** (no shadcn/Chakra/MUI). Build on
the existing `src/components/ui/*` primitives (`Button`, `Card`, `Field`,
`Modal`, `Badge`, `EmptyState`, `StatCard`, `SubmitButton`, …).

## 📝 Development Notes
- **`.env` points at production.** There is no separate local database:
  `DATABASE_URL` and `DIRECT_URL` both target the live Neon instance. So
  `npx prisma migrate dev` would author against production and can offer a
  destructive reset if it sees drift. **Author migrations without touching
  `public`:**
  ```bash
  npx prisma migrate diff \
    --from-migrations prisma/migrations \
    --to-schema-datamodel prisma/schema.prisma \
    --shadow-database-url "$DIRECT_URL?schema=migrate_scratch" \
    --script > prisma/migrations/<timestamp>_<name>/migration.sql
  ```
  Then verify it by running `npm run test:e2e` — `e2e/global-setup.ts` applies
  every migration into the throwaway `e2e_test` schema, so the SQL is genuinely
  exercised against real Postgres before it can reach production.
- **Migrations:** `npm run build` runs `scripts/migrate-deploy.mjs`
  (`prisma migrate deploy`) before `next build`, so a committed migration reaches
  production automatically. You still must generate it yourself and **commit the
  `prisma/migrations/` folder** — only the *apply* step is automatic.
- **e2e is safely isolated, but only by schema.** `playwright.config.ts` appends
  `?schema=e2e_test` and `global-setup.ts` drops *only* that schema — never
  `public`. It also blanks `RESEND_API_KEY` so `sendEmail` takes its
  console-logging branch; without that, every run fired real Resend requests
  that got 403-rejected.
- **No-JS support is narrower than it looks.** The `useActionState` forms really
  do post and redirect without JavaScript (`e2e/no-js-auth.spec.ts` pins this).
  But authenticated *content* routes are streamed — the markup ships inside
  `<div hidden>` and an inline `$RC(...)` script moves it into place — so with
  scripting off the visitor is stranded on the Suspense fallback: a spinner
  where a `loading.tsx` exists, a blank page where one doesn't. Adding a
  `loading.tsx` improves perceived speed *and* makes that route's no-JS
  rendering worse; that trade is real, so decide it deliberately.
- **`react-hooks/set-state-in-effect` is an ERROR here, not a warning**, and
  ESLint errors fail the Vercel build. `SearchableSelect`'s `mounted` flag is set
  from a `setTimeout` for exactly this reason — it looks like a redundant defer
  and is not. Don't "simplify" it.
- **Lint/types gate deploys.** Vercel fails the build on ESLint or TS errors.
  Run `npx tsc --noEmit` and `npm run lint` before pushing.
- **Server Actions:** a file with `"use server"` may only export async
  functions. Put constants/types in a separate module.
- **`useActionState` + bound args:** the action signature must be
  `(boundArg, prevState, formData)`. Omitting the `prevState, formData` tail
  breaks the no-JS form-submission path (this has bitten us before).
- **Windows/dev-server gotcha:** if a restarted dev server prints
  "Port 3000 is in use … using 3001", the old process is still holding 3000 —
  find it with `netstat -ano | findstr :3000` and `taskkill /PID <pid> /F`,
  otherwise you'll be testing against stale code.

## ✅ Verification
```bash
npx tsc --noEmit      # types
npm run lint          # eslint (gates deploys)
npm test              # vitest unit tests
npm run test:e2e      # playwright e2e
npm run build         # full production build (runs migrate deploy)
```
Unit tests live beside their subject (`src/lib/*.test.ts`); e2e specs in `e2e/`.
Prefer extracting pure logic into a testable module over testing through Prisma.

## 🔐 Environment Variables
`DATABASE_URL`, `DIRECT_URL`, `SESSION_SECRET`, `APP_URL`, `RESEND_API_KEY`,
`EMAIL_FROM`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

## 🚧 Not Built Yet
- **Church announcements / bulletin** platform

## 🐛 Known gaps (audited, not yet fixed)
Findings from the full-app audit that are real but deliberately deferred:
- **`Report` is a dead model.** No action, no UI, no admin review queue;
  `REPORT_STATUS` is unreferenced. Nothing can create a row. Either build the
  reporting flow (messaging needs it) or delete the model and enum.
- **Over-fetching.** `listEventsForChurch` has no date bound and no `take`, and
  eagerly loads every RSVP and attendee for four callers — `/home` uses it to
  print one title. `listDiscoverableChurches` reads the whole church table and
  filters/sorts client-side.
- **Semantic dead ends.** A first-visit ride request created by anyone who isn't
  a STUDENT is invisible to its creator (only `/student/rides` lists them).
  `/home`'s Rides card and the Help guide both hand a church-less account links
  that bounce to `/join`. `/churches/new` works but nothing links to it. Only
  students can block anyone — volunteers and admins have no block control.
- **`page.tsx:59` overpromises**: "message only after a friend accepts" describes
  messaging, which doesn't exist yet; today acceptance reveals an email address.

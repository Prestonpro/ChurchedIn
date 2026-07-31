# ChurchedIn — Context & Instructions

> Package name is `churchedin`; "Church LinkedIn" was the working name and still
> appears in the repo name and some older comments.

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
`PasswordResetToken`, `Membership`, `MentorProfile`, `StudentProfile`, `Event`,
`EventCohost`, `EventRsvp`, `MentorConnection`, `MentorMeetingPlan`,
`RideRequest`, `Block`, `Report`

Enums: `Role`, `EventCategory`, `EventStatus`, `RsvpRole`, `RsvpStatus`,
`ConnectionStatus`, `MeetingFrequency`, `ReportStatus`, `PartnershipStatus`,
`RideStatus`, `RideRequestType`

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
- **Mentor connections:** state machine in `src/lib/connectionState.ts`
  (PENDING → ACCEPTED/DECLINED, DECLINED → PENDING re-request, ACCEPTED → ENDED),
  rate-limited per student per day.
- **Rides:** `src/lib/rideState.ts` + `src/lib/actions/rides.ts`.
- **Event reminders:** `src/lib/eventReminders.ts` +
  `src/app/api/cron/event-reminders/route.ts`.
- **Capacity of 0 is meaningful:** `0` means "not accepting this role",
  `null`/blank means uncapped. Don't collapse the two.

## 🔒 Non-Negotiable Safety Rules
1. **Never expose a student's or mentor's contact info before their
   `MentorConnection` is `ACCEPTED`.** `contactInfoVisible()` in
   `connectionState.ts` is the single source of truth. This governs UI, emails,
   and any future messaging/notification surface.
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
- **Migrations:** `npm run build` runs `scripts/migrate-deploy.mjs`
  (`prisma migrate deploy`) before `next build`, so a committed migration reaches
  production automatically. You still must generate it yourself
  (`npx prisma migrate dev`) and **commit the `prisma/migrations/` folder** —
  only the *apply* step is automatic.
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
- **Direct messaging** between mentors and students (must respect rules 1 & 2 above)
- **Church announcements / bulletin** platform

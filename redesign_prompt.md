# ChurchedIn Redesign Brief

> Saved verbatim from the user's redesign request so any session can resume
> mid-project. Progress/phase-completion notes are appended at the bottom
> under "Progress Log" — check that section first to see what's already done.

## Context
You are working inside the church-linkedin/ Next.js 16 project. Read README.md and PLAN.md for the full architecture. This is a church-based platform connecting volunteers and international students through events and mentor connections. It currently works but needs a major identity, UX, and feature redesign based on fresh user feedback. Below is a consolidated brief covering every change, grouped into themes.

Do not start from scratch. Modify the existing codebase in place. The Prisma schema, server actions, auth system, and safety rules stay as they are unless a change below explicitly touches them.

## 1. Rebrand: "Church LinkedIn" to "ChurchedIn"
Rename the app everywhere: display name, page titles, <meta> tags, the brand mark in the header, the footer tagline, README, PLAN.md, .env.example comments, email templates in src/lib/email.ts. The working-name legal disclaimer in PLAN.md and README.md can be removed since this is now an original name.

Logo/brand mark: keep the UsersThree Phosphor icon concept but restyle it to match the new color palette below. Consider making it feel more like a "gathering" icon than a corporate network icon.
Tagline suggestion: something warmer than "Where your church organizes events, volunteers, and mentors." Think along the lines of: "Your church community, gathered in one place" or "Where your church family comes together." The vibe should feel like a friend inviting you in, not a corporate tool.

## 2. Language Shift: Professional to Friendly/Communal
The current copy reads like a SaaS product ("Host events," "RSVP together," "Find a mentor"). Rewrite it to feel like a friend or community member talking to you. Specific changes:

| Current term | Replace with | Why |
|---|---|---|
| "Mentor" (throughout) | "Friend" or "Guide" | "Mentor" sounds formal and intimidating. People are more willing to be a "friend" to someone. Use "Friend" in user-facing UI; keep MentorProfile/MentorConnection as the technical model names in code so you don't break the schema. |
| "Volunteer" (in user-facing copy) | "Volunteer" is fine, but also test "Helper" in key spots | Volunteers already RSVP as HELPER in the schema. Lean into that friendlier word in the UI where it fits. |
| "Host events" | "Plan a gathering" or "Start something" | Less transactional |
| "RSVP" | Keep "RSVP" (it's universally understood) but pair it with warmer phrasing: "I'm in!" as the button label | |
| "Connection request" | "Reach out" or "Say hi" | Less LinkedIn-esque |
| "Church admin" (user-facing) | "Church leader" or just "Admin" | Keep CHURCH_ADMIN in the code |

Apply this language shift across: the landing page (src/app/page.tsx), all dashboard headers, nav labels in src/components/nav/, the event creation form, the mentor (now "friend") directory, the profile pages, and the email templates in src/lib/email.ts. Do not rename Prisma models, enum values, or internal variable names. Only user-facing strings.

## 3. New Color Palette: Warmer, Friendlier, More Inviting
The current deep-indigo + coral palette feels professional but cold. Replace it with a warmer, more community-oriented palette in src/app/globals.css (the @theme block). Design direction:

- Primary: A warm teal or sage green (think "welcoming front door," not "corporate dashboard"). Something in the hsl(160-175, 35-50%, 40-50%) range.
- Accent: A soft warm gold or amber (for CTAs, highlights, event badges).
- Background: Keep the soft paper/off-white feel but push it slightly warmer. More cream than blue-gray. The current #f6f7fc has a cold blue undertone; move toward #faf8f5 territory.
- Surface: Keep white cards but make sure they feel cozy, not clinical.
- Event category colors: Keep distinct hues for each category but re-tune them to sit comfortably in the new warmer palette.
- Avoid: Anything that looks like LinkedIn (blue), Facebook (blue), or a medical/corporate app. This should feel like a community board at a coffee shop, not a tech platform.

Update all component files that reference brand colors: Button.tsx, Badge.tsx, Card.tsx, Avatar.tsx, CapacityBar.tsx, nav components, and the landing page.

## 4. Visual Design Overhaul: Cards, Animations, Delight

### 4a. Landing page hero
- Add a subtle entrance animation to the hero text (fade-up + slight scale, staggered). Use CSS @keyframes + animation, no JS animation library needed for this.
- The hero should feel warm and inviting. Maybe a soft illustration or pattern behind the text (a subtle community/gathering motif), not just the current gradient mesh.

### 4b. Feature cards at the top of dashboards
After login, the dashboard (volunteer, student, or admin) should show summary cards at the top, like:
- "3 upcoming events" with the next one's name
- "2 friend requests waiting" (for guides/friends)
- "12 people in your church" (community size)

These cards should have hover interactions: gentle lift (translateY + shadow increase), maybe a subtle color shift on the icon. Use the existing transition-brand utility or extend it.
Cards should feel tactile. Rounded corners (use --radius-2xl), soft shadows, maybe a faint colored left-border accent per card type.

### 4c. Micro-animations throughout
- Page transitions: add a subtle fade-in when navigating between pages. A simple CSS animation: fadeIn 300ms ease on the main content wrapper is enough.
- Button interactions: the existing transition-brand is good. Make sure every interactive element uses it. Add a subtle scale-down on :active (transform: scale(0.97)).
- List items: when event cards or friend cards render, stagger their entrance with animation-delay so they cascade in rather than all appearing at once.
- Empty states: the existing EmptyState.tsx component should have a gentle bounce or pulse on its icon to draw attention.

### 4d. Make people want to explore
The current UI shows everything in a straightforward list. Redesign the information architecture to encourage wandering:
- Use a card-based feed layout for events (inspired by Facebook Events, where each event is a visual card with a category color bar, date badge, title, and a peek at who's going) rather than a plain list.
- The friend/guide directory should feel browsable. Show people as avatar cards with their interests as tags, not a table or plain list.
- Add a "Happening soon" or "This week" highlighted section at the top of the event feed that spotlights the next 1-2 events with larger, more visual cards.

## 5. Event Creation: Preset Options + Custom
Currently events have a category enum but the creation flow is a plain form. Redesign event creation to be more guided and friendly:
- Show visual preset cards the user can pick from: "Host a dinner", "Coffee chat", "Study group", "Airport pickup", "Cultural outing", "Holiday celebration". Each as a tappable card with a Phosphor icon and one-line description.
- Include a "Create your own" card at the end that lets them type a custom title and pick OTHER as the category.
- After picking a preset, pre-fill the title and category, then show the rest of the form (date, time, location, description, capacity).
- This is a UI-only change. The EventCategory enum and createEventAction server action stay the same.

## 6. Co-hosting: Invite Friends to Help Run Events
Add the ability for event creators to invite specific people to co-host.

### Data model change (Prisma)
Add a cohosts relation to Event:
```prisma
model EventCohost {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  eventId String
  event   Event  @relation(fields: [eventId], references: [id])
  userId  String
  user    User   @relation(fields: [userId], references: [id])
  @@unique([eventId, userId])
}
```
Add the back-relations to Event (cohosts) and User (cohostedEvents).

### Server action changes
- New action: inviteCohostAction(eventId, userId). Only the event creator can call this; the invited user must be a VOLUNTEER in the same church.
- Co-hosts get the same visibility as the creator: they can see the RSVP list and edit the event description/details, but cannot delete/cancel the event (only the original creator can).
- Show co-hosts on the event detail page as "Hosted by [creator] with [cohost1], [cohost2]."

### UI
- On the event creation form (and the event edit page), add an "Invite a co-host" section with a searchable dropdown of volunteers in the same church.
- Keep it simple: just a name search + add button, no complex invitation/acceptance flow for MVP. Being added as a co-host is immediate (no accept/decline step).

## 7. Church Venue Option
Add a field to events for hosting at the church building instead of a personal home:
- Add atChurch Boolean @default(false) to the Event model.
- In the event creation form, add a toggle/checkbox: "Host this at our church building". When checked, auto-fill the location field with the church's name (from Church.name) and add "(at church)" to the event card display.
- This is for people whose home isn't large enough to host. It's a signal to the church admin that this event wants to use the church space. It doesn't automatically reserve anything (no booking system needed for MVP).

## 8. Event Notifications: "Something's Happening!"
When a new event is published, members of that church should be notified. For MVP, this means:
- Email notification: when createEventAction succeeds and the event status is PUBLISHED, send an email to all members of that church (query all Membership rows for the churchId, get their User.email). Use the existing src/lib/email.ts transport.
- Email subject: something warm like "New gathering at [Church Name]: [Event Title]"
- Email body: event title, date/time, category, a short preview of the description, and a link to the event detail page.
- Rate-limit this: don't send if the church has had more than 3 event notification emails in the last 24 hours (prevent spam from an overeager volunteer creating lots of events). Store the count check in-memory or as a simple DB query, nothing heavy.
- In-app indicator (stretch, do if time permits): a small dot/badge on the "Events" nav link when there are events created since the user's last visit. Store lastSeenEventsAt on the Membership model.

## 9. Redo/Duplicate an Event
Add the ability to re-run a past event:
- On the event detail page for a past or cancelled event, add a "Run this again" button (visible only to the original creator and co-hosts).
- Clicking it opens the event creation form pre-filled with the original event's title, description, category, location, capacity, and atChurch flag, but with blank date/time fields so the user picks new ones.
- This is a UI convenience. It just pre-fills the form and calls the existing createEventAction to create a brand-new event. No "recurring event" data model needed.

## 10. Decentralized Setup: Anyone Can Start a Church Space
The current flow lets anyone create a church org. Lean into this and make it clearer in the UI that you don't need to be a pastor or official church leader:
- Landing page copy: emphasize that any member can set up their church's space. Something like: "You don't have to be a pastor. If you and a friend want to start welcoming international students, you can set it up together."
- Co-admin on creation: when someone creates a church, immediately prompt them to invite a friend as co-admin (use the existing invite/co-admin flow from church-mobilization-platform if there is one, or add a simple "Invite a co-leader" email input on the post-creation page that creates a Membership with CHURCH_ADMIN role via an invite link).
- Cross-church collaboration idea (UI-only for now, no backend): on the church admin dashboard, add a "Collaborate with another church" card/section that explains the concept (shared events, combined directories) and says "Coming soon." Don't build the backend for this, just plant the seed in the UI.

## 11. Think About the Church as a Body
The app should feel like it's about a community/body of people, not an institution:
- When displaying "Your church" in dashboards and nav, also show the member count: "Grace Community, 14 members."
- On the church admin dashboard, add a "Your community" section showing recent joins, active volunteers/friends, and students. A living snapshot of the body, not just a settings page.
- The landing page "How it works" section should frame the church as a group of people doing something together, not an organization managing a program.

## 12. UI Inspiration: Facebook Events x Community Board
The overall UX should split the difference between:
- Facebook Events: visual event cards, clear date/time, social proof ("3 friends going"), easy RSVP
- A community bulletin board: warm, slightly informal, things pinned up that catch your eye

Not like: Reddit (too text-heavy), LinkedIn (too corporate), a church management SaaS (too admin-heavy).

Specific inspiration cues:
- Event cards should show a category-colored accent (left border or top bar), a date badge (month + day in a little box), the title, a one-line description, and "X people going" with tiny avatar circles.
- The friend/guide directory should show people as cards with a warm avatar, their name, 2-3 interest tags, and languages. Browsable, not a searchable table.
- Navigation should be simple and clear. Don't show everything at once. The main nav has 3-4 items max (Dashboard, Events, Friends/Guides, Profile). Everything else is discoverable from within those sections.

## 13. Git Workflow: Commit After Every Phase
Commit after completing each phase. Each commit should be a clean, working checkpoint. Descriptive commit messages. Push to GitHub after each commit (`git push origin master`). Do not squash commits — full history wanted. Break large phases (e.g. Phase 3) into smaller commits within that phase.

## 14. Implementation Order and Skills to Invoke
Work through these in order. After each phase: verify `npm run build` succeeds, `npm run test` passes, the dev server renders correctly, then commit and push.

- Phase 1: Rebrand + color palette (sections 1, 3) — invoke ui-ux-pro-max, frontend-design
- Phase 2: Language shift (section 2) — straightforward copy pass
- Phase 3: Visual redesign (sections 4, 12) — invoke ui-ux-pro-max, frontend-design, design-spells (unavailable in this environment — handled directly)
- Phase 4: Event creation UX (section 5) — invoke ui-ux-pro-max, react-patterns (unavailable — handled directly)
- Phase 5: Co-hosting (section 6) — invoke database-migrations, backend-patterns, ui-ux-pro-max
- Phase 6: Church venue toggle (section 7) — invoke database-migrations
- Phase 7: Event redo/duplicate (section 9) — no special skill
- Phase 8: Notifications (section 8) — invoke backend-patterns, security-review
- Phase 9: Decentralized setup UX (section 10) — invoke ui-ux-pro-max
- Phase 10: Community feel (section 11) — invoke frontend-design

Final gates (after all phases): security-review (contact-reveal rule, co-host permissions, notification rate limit), code-review (full diff), docs (README.md + PLAN.md update), verify (migrations, lint, tests, build).

## Non-negotiable (do not change)
- The safety rule: contact info is never shown until a MentorConnection reaches ACCEPTED. Applies even after renaming "mentor" to "friend" in the UI.
- Prisma model names: keep MentorProfile, MentorConnection, EventRsvp, etc. as-is internally. Only user-facing labels change.
- Auth system: don't touch the session/JWT/password infrastructure.
- Multi-tenancy: all data stays scoped per church.

## Continuation note (from the user)
If a session loses track partway through: start a new session and say "Read redesign_prompt.md. Phases 1-5 are already done and committed. Pick up at Phase 6." (adjusting the phase number to whatever's actually done — check the Progress Log below).

---

## Progress Log

_(Updated as phases complete — check here first when resuming.)_

- **Phase 1: DONE** (commit `c164b32`, pushed). Renamed to ChurchedIn everywhere
  (metadata, manifest, email templates, README/PLAN/DEPLOYMENT.md, .env.example,
  package.json name). Removed the working-name trademark disclaimer. Regenerated
  PWA icons as a circular teal "gathering badge" instead of rounded-square.
  New palette in globals.css @theme: brand = warm sage-teal (hue ~170°, full
  50-900 scale), accent = warm gold/amber (full 50-900 scale), paper = warm
  cream #faf8f4, ink = warm neutral (not blue-black), 8 re-tuned event-category
  colors (terracotta/brown/rose/olive/plum/mustard/wine/neutral). Since almost
  everything used semantic Tailwind classes already, most components needed
  zero changes — only 3 files had hardcoded hex needing fixes: global-error.tsx,
  emailTemplates.ts (2 mailto link colors). New hero tagline: "Your church
  community, gathered in one place." Note: the live Vercel domain
  (church-linkedin.vercel.app) was deliberately NOT renamed — that's a separate
  infra decision, documented in README.
- **Phase 2: DONE** (pushed). Full mentor→friend language shift across every
  user-facing string: nav label ("Friends"), friend/guide directory page,
  friend-profile toggle + save button, connection-request form ("Say hi"),
  volunteer/admin/student dashboards, landing page (FEATURES/STEPS arrays,
  hero paragraph, "Contact info stays private" section), all 6 connection
  lifecycle emails in emailTemplates.ts, AuthPageLayout defaults, login/join
  page panel copy, all user-facing error strings in connections.ts/mentors.ts/
  events.ts, and the MENTORSHIP event-category display label ("Friend chat").
  "Host events"→"Plan a gathering" everywhere; "RSVP to help/attend" buttons→
  "I'm in to help!"/"I'm in!"; "Church admin"→"Church leader" in user-facing
  error strings. Left "Volunteer" as the join-flow role-picker label (an
  identity choice, not an action) since "Helper" is already well-integrated
  in RSVP contexts (CapacityBar "Helping", "confirmed as a helper", the new
  "I'm in to help!" button). Deliberately did NOT rename Prisma models, enum
  keys, internal variable/function names, or the `/student/mentors` URL path
  — those are schema/internal-identifier scope, out of bounds per the brief.
  Updated 3 e2e test files (block-enforcement, mentor-connection,
  rsvp-waitlist specs) to match new button/label text — all 4 e2e specs +
  24 unit tests pass. **Not yet done:** dashboard summary cards, card-based
  event feed, animations (Phase 3); everything else in Phases 3-10.

- **Phase 3: DONE** (4 commits, pushed: `3e9aa3e` animations, `ab63fe7`
  dashboard cards, `5c94372` event feed, `f9c378a` friend directory).
  - Animation infra: 3 keyframes in globals.css (fade-up, fade-in,
    pulse-gentle) + utility classes, all respecting prefers-reduced-motion.
    Hero text staggers in on the landing page; AuthShell's main content
    fades in on navigation; EmptyState icons pulse gently.
  - New shared `StatCard` component (icon chip + number + optional sublabel
    + colored left-border accent). All three dashboards now show 3 summary
    cards at top: admin (Members/Events/Open reports), volunteer (Upcoming
    gatherings/Friend requests waiting/People in your church), student
    (Upcoming events/Friends/People in your church).
  - Event feed (`src/app/events/page.tsx`) redesigned Facebook-Events-style:
    "Happening soon" spotlight (next 2 events, larger cards) + regular grid
    below. New `DateBadge` (month/day box) and `AttendeeAvatars` (overlapping
    circles + "N going") components. `listEventsForChurch` now selects RSVP
    user names for the avatars. Cards stagger in via fade-up.
  - Friend directory (`src/app/student/mentors/page.tsx`): languages/interests
    now render as individual pill tags (not one line of comma-joined text),
    cards got the hover-lift they were missing, staggered entrance.
  - Found and fixed a real bug along the way: mixing `weekday` with
    `timeStyle` in `toLocaleString` throws (Intl.DateTimeFormat doesn't allow
    it) — only surfaced because Section 6's error boundary caught it cleanly
    instead of an unhandled crash. Fixed with explicit hour/minute options.
  - Full verification after every sub-commit: tsc, lint, build, 24 unit
    tests, all 4 e2e specs — all green throughout.
  - Did NOT add scroll-triggered stagger to the landing page's below-fold
    FEATURES grid (would need an IntersectionObserver since CSS-only
    animations fire on mount, invisible by the time a user scrolls to it) —
    judged not worth the complexity for a marketing section; stagger was
    applied to the actual list contexts (events, friends) instead.
  **Not yet done:** Phases 4-10 + final gates.

- **Phase 4: DONE** (pushed). Event creation form now opens with a preset
  picker: 7 category cards (Host a dinner/Coffee chat/Study group/Airport
  pickup/Cultural outing/Holiday celebration/Friend chat — added Friend chat
  for MENTORSHIP since the brief's example list didn't include it but the
  category still needs to be reachable) + a dashed "Create your own" card
  (→ OTHER category, blank title). Picking one pre-fills category + a
  starting title (via key={category} remount trick since Field is an
  uncontrolled input) and reveals the full form below; a "Change type" link
  goes back. EventCategory enum and createEventAction untouched — UI-only.
  Updated rsvp-waitlist.spec.ts (previously skipped the preset step
  entirely) to click "Coffee chat" first. signup-and-host-event.spec.ts's
  existing `getByRole("button", {name: "Dinner"})` still matches "Host a
  dinner" unmodified (Playwright's default string matching is substring +
  case-insensitive). All 4 e2e specs + 24 unit tests pass.

- **Phase 5: DONE** (pushed). New `EventCohost` model (migration
  `20260724222655_add_event_cohost`, additive-only, applied to dev DB — see
  below re: production). `inviteCohostAction`/`removeCohostAction` in
  events.ts: creator-only, invitee must be a VOLUNTEER in the same church,
  immediate add (upsert, no accept/decline). New `CohostManager` client
  component (search-filter over a pre-fetched candidate list + add/remove
  buttons) shown on the event detail page, creator-only. "Hosted by X with
  Y, Z" line added under the event title. `getEventById` now includes
  cohosts; new `listCohostCandidates` query excludes the creator and
  existing cohosts. All 4 e2e specs (migration applied cleanly to the e2e_test
  schema too) + 24 unit tests pass; visually verified end-to-end (invite,
  persisted after reload, remove button present).
  **IMPORTANT — production migration debt:** this migration (and Phase 6's)
  have only been applied to the dev database, NOT the separate production
  Neon database from Section 5. Before/at final verification, run
  `DATABASE_URL="<production DIRECT connection string>" npx prisma migrate
  deploy` against production, or the live site will error on any co-host or
  atChurch code path. Get the production direct connection string from the
  user if it's not already in hand (never hardcode/guess it).
  **Not yet done:** Phases 6-10 + final gates.

- **Phase 6: DONE** (pushed). `atChurch Boolean @default(false)` added to
  Event (migration `20260724232601_add_event_at_church`, applied to dev —
  still owes production, see above). EventForm gained a "Host this at our
  church building" checkbox; checking it auto-fills the (now controlled,
  was uncontrolled) Location field with the church's name via a
  `churchName` prop threaded from the page down. "(at church)" badge shown
  on event-feed cards (both spotlight and regular grid) and the event
  detail page's location line. No booking/reservation system, per the
  brief — just a visible signal. All 4 e2e specs + 24 unit tests pass;
  visually verified the auto-fill.
  **Not yet done:** Phases 7-10 + final gates.

- **Phase 7: DONE** (pushed). "Run this again" link on the event detail
  page, shown to the creator or a co-host when the event is cancelled or
  in the past. Links to `/volunteer/events/new?from=<eventId>`; the page
  fetches that event server-side, verifies the current user is still the
  creator or a co-host AND it's the same church (re-checked server-side,
  not just a UI-visibility rule), then passes a `prefill` object into
  EventForm. EventForm skips the preset picker when prefill is present and
  pre-fills category/title/description/location/isVirtual/atChurch/
  capacities — Starts/Ends stay blank so the user picks a new date. Reuses
  createEventAction unchanged; this is purely a pre-fill convenience, no
  recurring-event data model. Verified visually end-to-end (past event →
  "Run this again" → correctly prefilled form). All 4 e2e specs + 24 unit
  tests pass.
  **Not yet done:** Phases 8-10 + final gates.

- **Phase 8: DONE** (pushed). New `newEventNotificationEmail` template
  ("Something's happening!" / "New gathering at [Church]: [Title]", with
  category, date/time, a truncated description preview, and a link).
  `createEventAction` emails every church member after publishing, via a
  new `notifyChurchOfNewEvent` helper. Rate limit: counts *other* events
  created by the church in the last 24h (excluding the just-created one) —
  if that count is already > `MAX_EVENT_NOTIFICATIONS_PER_DAY` (3), skips
  sending. No new tracking table — reuses Event.createdAt since there's a
  1:1 mapping between "event created" and "notification batch". Skipped
  the explicitly-marked stretch goal (in-app nav badge for unseen events)
  to prioritize the remaining phases and final gates. All 4 e2e specs
  (notification email correctly fires, only rejected by Resend's
  test-domain restriction like every other test email) + 24 unit tests
  pass. The rate-limit logic and email-recipient-leak question are
  earmarked for the final security review pass rather than re-litigated
  here.
  **Not yet done:** Phases 9-10 + final gates.

- **Phase 9: DONE** (pushed). New `ChurchAdminInvite` model (migration
  `20260724234634_add_church_admin_invite`, applied to dev — still owes
  production along with Phases 5/6's migrations). New
  `src/lib/actions/churchInvites.ts`: `inviteCoAdminAction` (admin-only,
  same hash-at-rest/single-use/7-day-expiry pattern as password reset),
  `checkCoAdminInvite`, `acceptNewCoAdminAction` (creates account +
  CHURCH_ADMIN membership together for a brand-new email),
  `acceptExistingCoAdminAction` (just adds the membership for an
  already-logged-in matching email). Church creation now redirects to a
  new `/admin/welcome` page (instead of straight to the dashboard)
  prompting "invite a co-leader" with a skip link. New public
  `/join-as-admin/[token]` page branches three ways: invalid/expired token,
  existing account (told to log in then revisit), or new account (signup
  form). Landing page gained a new section using the brief's exact
  suggested copy ("You don't have to be a pastor..."). Admin dashboard
  gained a dashed "Collaborate with another church" teaser card with a
  "Coming soon" badge — UI only, no backend, as specified.
  Updated e2e/helpers.ts's `signupChurch` to wait for `/admin/welcome`
  instead of `/admin/dashboard` (the redirect target changed) — all 4 e2e
  specs + 24 unit tests still pass after the fix. Visually verified the
  welcome page, invite form, and dashboard teaser card.
  **Not yet done:** Phase 10 + final gates.

- **Phase 10: DONE** (pushed). Student/volunteer/admin dashboard subtitles
  now read "{church name}, N members" (student/volunteer) or "N members —
  church leader overview" (admin) instead of just the bare church name.
  Admin dashboard gained a new "Your community" card: role-breakdown pills
  (church leaders / volunteers / students, via `prisma.membership.groupBy`)
  and a "Recently joined" list (last 6 memberships, avatar + name + role
  badge) — a living snapshot rather than just a settings page. Landing
  page's "How it works" section retitled to "People, doing this together"
  with people-first framing instead of a numbered-steps/program feel.
  Visually verified end-to-end with a 3-person church (admin + volunteer +
  student) showing correct counts and the recently-joined list. All 4 e2e
  specs + 24 unit tests pass.
  **Not yet done:** final gates (security review, code review, docs update,
  verify) — this is the last content phase.

- **Production migration debt resolved.** Every push since Phase 5 had
  auto-deployed code referencing `EventCohost`/`atChurch`/`ChurchAdminInvite`
  to Vercel without those migrations ever being applied to the production
  database — `prisma migrate dev` had only ever been run against dev. Caught
  this myself (not user-reported) before final gates. Ran `prisma migrate
  deploy` against production with the direct connection string and verified
  via a live Playwright smoke test (signup → `/admin/welcome` → create an
  `atChurch` event → detail page renders with the badge and Co-hosts section,
  no crash).

- **Final: security review — DONE, no CRITICAL/HIGH.** Reviewed the 5 areas
  called out in the brief: (1) contact-info reveal rule still gated
  correctly by `contactInfoVisible()`/`ACCEPTED` at both the action and
  query layer, no new leak in any Phase 3/10 surface; (2) co-host
  permissions confirmed creator-only for invite/remove, `cancelEventAction`
  correctly still excludes co-hosts, invitee role re-validated server-side
  independent of the client-supplied candidate list; (3) event-notification
  rate limiter had two real findings — an off-by-one (`>` should have been
  `>=`/`<`, actual cap was 4/day not 3) and a TOCTOU race (concurrent event
  creation could each see a stale low count and all slip past the cap since
  the count-then-decide wasn't serialized) — both fixed by wrapping the
  count+decision in a `prisma.$transaction` holding a
  `pg_advisory_xact_lock(hashtext(churchId))` for the transaction's
  lifetime; (4) `ChurchAdminInvite` flow confirmed correctly scoped
  (invite-side and accept-side both re-check church/email), same
  hash-at-rest/single-use/expiring pattern as password reset; (5)
  `/admin/welcome` and `/join-as-admin/[token]` confirmed properly gated,
  the "account already exists" reveal on the invite-acceptance page judged
  acceptable since it requires possession of a random 32-byte token (not an
  open enumeration oracle like the password-reset case).

- **Final: code review — DONE, 0 CRITICAL, 2 HIGH (fixed), 3 MEDIUM, 2 LOW.**
  Reviewed the full diff from before Phase 1 through Phase 10.
  - Fixed (HIGH): `EventForm` had no `key` tied to its prefill source, so
    Next.js could reuse the same client component instance across two
    different "Run this again" navigations (e.g. via back/forward) and
    silently keep showing the first source event's data. Fixed by adding
    `key={from ?? "blank"}` on `<EventForm>` in `new/page.tsx`.
  - Fixed (HIGH): `CohostManager` discarded `inviteCohostAction`/
    `removeCohostAction`'s return value, so a rejected add/remove (e.g.
    "That person isn't a volunteer at this church") looked identical to
    success — no error ever surfaced. Fixed by capturing the result and
    rendering it via the existing `FormError` component, matching the
    pattern already used in `RsvpControls`.
  - Fixed (MEDIUM): `AttendeeAvatars` could show "0 + N more going" when an
    event had confirmed helpers but zero attendees, since `attendeeInfo`
    only collected attendee names but passed a combined attendee+helper
    count as `totalCount`. Fixed by collecting names from both confirmed
    roles so the list length always matches the count.
  - Fixed (LOW): `notifyChurchOfNewEvent` emailed the event's own creator
    about their own new event. Fixed by excluding `event.createdById` from
    the recipient query.
  - Deliberately NOT fixed, judged acceptable for this pass: (MEDIUM)
    `createEventAction` awaits the notification send before returning,
    which can add latency on a slow Resend call or a large church —
    considered making this fire-and-forget, but on Vercel's serverless
    runtime an un-awaited promise can be killed before it completes once
    the response is sent (no `waitUntil`/`@vercel/functions` dependency in
    this project), so awaiting it is the more reliable trade-off for an
    MVP; (MEDIUM) the three dashboards (`admin`, `volunteer`, `student`)
    each duplicate a ~15-line "next upcoming event" row and sort/filter
    logic — a real dedup opportunity but a refactor-only, no-bug-risk
    cleanup, left for a future pass rather than expanding this redesign's
    diff further.

- **Final: docs updated.** `PLAN.md` section 6 gained `EventCohost` and
  `ChurchAdminInvite` model blocks plus `atChurch` on the documented `Event`
  model (and, as a bonus fix, backfilled the never-documented
  `PasswordResetToken` model from an earlier session); section 9's project
  structure and section 10's build-phases/status were updated, including
  correcting the stale "Still not done" list (it still listed security
  review/Vercel/Resend as outstanding from *before* this redesign even
  started). `README.md` picked up the same: tech-stack bullets for
  co-hosting/atChurch/notifications/co-admin-invite, project-structure
  additions, a friend-language pass on the roles table and safety-rule
  section, and new "what's not done yet" entries for the two deliberately
  UI-only/skipped items (cross-church collab teaser, unseen-events nav
  badge stretch goal).

- **Post-redesign follow-up: the two deliberately-skipped items, built.**
  The user asked why these were skipped, then asked for both — clarified
  that neither was a capability limit, just scope decisions (one an
  explicit brief instruction to keep UI-only, one an explicit stretch
  goal), and built both:
  - **Unseen-events nav badge** (the Phase 8 stretch goal). Added
    `lastSeenEventsAt DateTime?` to `Membership`. New `hasUnseenEvents`
    query (any published event created after that timestamp, or any at all
    if null). `AuthShell` is now an async server component that computes
    this per-request and passes a `hasBadge` flag through the shared
    `NavLink` type; `NavLinks`/`MobileMenu` render a small dot on the
    Events icon. `/events` stamps `lastSeenEventsAt = now` on page view
    (alongside its other reads, not gating render on it) — the badge
    clears on the *next* navigation, same as most "mark as read" UIs, not
    instantly on the same render.
  - **Cross-church collaboration backend** (Phase 10's "Coming soon"
    teaser, now real). New `ChurchPartnership` model (`PENDING`/`ACCEPTED`,
    unique per church pair) + `src/lib/actions/churchPartnerships.ts`
    (`requestPartnershipAction` by the other church's join code,
    `respondToPartnershipAction`, `endPartnershipAction` — always deletes
    on decline/end, no history kept). Deliberately scoped to **read-only
    event visibility only** — RSVPs, the friend directory, and mentor
    connections stay strictly single-church, since loosening
    `rsvpToEventAction`'s same-church membership check would touch the
    multi-tenancy non-negotiable more than this feature is worth. Once
    ACCEPTED, `/events` shows a "From partner churches" section (via
    `listAcceptedPartnerChurchIds` + `listEventsForChurches`), and the
    event detail page's hard church-membership gate now also allows a
    read-only view for an accepted partner church's members (RSVP/cancel/
    cohost-manager/run-again all hidden in that view, gated on the same
    `isPartnerView` flag the gate itself computes — no separate trust
    decision to keep in sync). Replaced the admin dashboard's static
    teaser card with a real `PartnershipManager` client component: a
    join-code request form plus incoming/outgoing/accepted partnership
    lists with Accept/Decline/End actions. No email notification for
    partnership requests — visible in-app only, an explicit MVP scope
    choice matching this feature's overall simplicity level.
  - Migration `20260725002905_add_unseen_events_and_partnerships`,
    additive-only, applied to dev. **Owes production** — same pattern as
    Phases 5/6/9, needs `prisma migrate deploy` against the production
    direct connection string before this is live. (Session note: the
    production credential from the earlier Phase-5 fix wasn't recoverable
    after a context compaction — no file/env had it — so it had to be
    re-requested from the user rather than assumed lost/forgotten.)
  - Verified with a dedicated Playwright smoke script covering both
    features end-to-end (two churches, an event, a partnership
    request/accept, badge-before/after-visit, partner event visible
    read-only with RSVP hidden) — 3/3 clean runs. Two earlier runs
    false-alarmed on the nav-badge check because of the same
    loading.tsx-Suspense-race class of flakiness already diagnosed
    elsewhere in this project; fixed the *test script* (wait for the real
    nav link, not just networkidle), not the app.
  - tsc/lint/build/unit tests (24/24) all green after both features. Full
    e2e suite re-run pending as of this note.
  - Full e2e suite (4/4) confirmed passing afterward, and both features
    verified live on production after `prisma migrate deploy` (production
    connection string re-supplied by the user after a context compaction —
    it isn't recoverable from files/env, only from the conversation or the
    user re-pasting it).

---

## "Community Needs" phase (new brief, separate from the 10-phase redesign
above): a Rides Board and a Semester Calendar view. Three commits, each
verified (tsc/lint/build/unit tests, plus a manual Playwright smoke script)
and pushed individually per the brief's own git-workflow instructions.
Two factual corrections applied silently rather than followed literally:
the brief said `npx prisma db push` on "the local SQLite database" — this
project is Postgres via Neon and has used `prisma migrate dev`/`deploy`
exclusively all along, so `migrate dev` was used instead to keep migration
history intact; the brief said `git push origin main` — this repo's default
branch is `master`, confirmed by every prior push in this project.

- **Schema (commit `38d417a`)**: new `RideRequest` model + `RideStatus` enum
  (`OPEN`/`CLAIMED`/`COMPLETED`/`CANCELLED`), migration
  `20260725052546_add_ride_request`. Back-relations added to `User`
  (`rideRequestsAsStudent`/`rideRequestsAsVolunteer`) and `Church`
  (`rideRequests`). Applied to production proactively, right after the dev
  migration and before any code referencing the table was pushed — avoiding
  a repeat of the earlier production-migration-debt mistake from the main
  redesign.

- **Rides board (commit `6dafd2e`)**: `src/lib/rideState.ts` — a pure,
  unit-tested state machine (OPEN→CLAIMED→COMPLETED, or →CANCELLED from
  either of the first two) plus `rideContactVisible()`, mirroring
  `connectionState.ts` exactly since this is the same trust problem (a
  vulnerable population coordinating with someone unvetted). Actions in
  `src/lib/actions/rides.ts`: `createRideRequestAction` (student-only),
  `claimRideRequestAction` (volunteer, same-church only, reveals contact
  info to both sides via `rideClaimedForStudentEmail`/
  `rideClaimedForVolunteerEmail` — the one place either email is ever
  surfaced), `completeRideRequestAction` (either participant),
  `cancelRideRequestAction` (student/creator only). UI: `/student/rides`
  (request form + their requests, cancel/complete buttons) and
  `/volunteer/rides` (open board with Claim buttons + "rides you're
  giving" section). New shared `RideActionButton` client component
  (`src/components/RideActionButton.tsx`) that captures and surfaces the
  action's error instead of discarding it — applying the lesson from the
  main redesign's code review (CohostManager originally swallowed errors)
  from the start instead of repeating it. No new nav items — both pages
  are reachable from a new dashboard StatCard each ("Rides needing a
  volunteer" / "Active ride requests"), keeping the student nav at its
  already-at-cap 4 items per the redesign's own "3-4 items max" rule.
  Verified end-to-end with a Playwright smoke script covering the full
  loop, including the safety-critical check that the student's email is
  absent from the open rides board (pre-claim) and present on both sides
  only after claiming.

- **Calendar view (commit `b8b022e`)**: `/events/calendar`, a CSS-grid
  monthly view — explicitly no calendar/charting library, per the brief.
  Reuses `listEventsForChurch` (no new query); month navigation, day
  selection, and category/"my RSVP'd events" filters are all plain
  `<Link>`s and a `<form method="get">` reading `searchParams`, so none of
  it needs client-side JavaScript. `categoryStyle()` gained a `dot` field
  (solid, non-"-soft" background class) for the day-cell event markers,
  since the existing pale "-soft" tones don't read at that size. A
  reciprocal "List view" / "Calendar view" toggle link connects it with
  the existing `/events` feed. Verified with a Playwright smoke script
  (month heading correct, event's day cell shows a dot, clicking a day
  lists that day's events, category filter persists across the GET form
  submit).

- **Known gap, called out rather than silently left**: neither the rides
  board nor the calendar view is covered by the Playwright e2e suite yet —
  only by the ad hoc smoke scripts run during development (not committed,
  since they're throwaway verification scripts, not permanent test specs).
  Documented in README.md's "What's not done yet".

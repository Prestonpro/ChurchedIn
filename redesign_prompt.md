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

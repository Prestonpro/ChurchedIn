# Church LinkedIn (Working Name) - Context & Instructions

## 📌 Project Overview
A church-scoped events, RSVP, ride-coordination, and mentor-matching platform designed for international student ministry.
- **Goal:** Connect international students with local church volunteers for mentorship, events, and community support.
- **Deployment:** Vercel (Frontend & Serverless Functions) + Neon (PostgreSQL Database).

## 🛠 Tech Stack
- **Framework:** Next.js 16 (App Router) + React 19
- **Database:** PostgreSQL (hosted on Neon) + Prisma ORM (`@prisma/client` & `@prisma/adapter-pg`)
- **Styling:** Tailwind CSS v4
- **UI Components:** 
  - Icons: Phosphor Icons (`@phosphor-icons/react`)
  - Typography: Plus Jakarta Sans
  - Dropdowns: `react-select` (using `CreatableSelect` for custom inputs)
- **Authentication:** Custom JWT-based auth using `jose` and `bcryptjs`.
- **Mapping:** Leaflet & React-Leaflet for event maps.

## 👥 User Roles
1. **CHURCH_ADMIN (Church Leader):**
   - Can manage church settings, view members, and manage the join code.
   - Can create and manage events.
   - Can oversee ride coordination.
2. **VOLUNTEER:**
   - Can RSVP to events (as a helper or attendee).
   - Can offer rides for events or general requests.
   - Mentorship matching.
3. **STUDENT (International Student):**
   - Fills out a comprehensive profile (Country of Origin, School, Major, Languages, Hobbies, Career Goals).
   - Can RSVP to events.
   - Can request rides (General or First Visit).
   - Can request/accept mentorship connections.

## 🔑 Key Workflows & Logic
- **Join Flow:** Users must join a specific church using a 6-character code (e.g., `/join/[code]`). They can sign up with email/password or Google OAuth.
- **Authentication:** Handled via cookies. The `requireUser` and `requireRole` helpers in `src/lib/auth.ts` enforce route protection.
- **Profiles:** Students have detailed profiles to facilitate better mentor matching. Dropdowns for predefined lists (countries, schools, majors, languages) use `CreatableSelect` to allow custom user inputs.
- **Events & Rides:** Events have categories (Dinner, Coffee Chat, etc.) with a specific color system. Rides can be requested independently or attached to events.

## 📝 Development Notes
- **Database Changes:** `npm run build` (`scripts/migrate-deploy.mjs`) now runs `prisma migrate deploy` automatically before `next build`, so a committed migration reaches production on its own — no manual `db push` step needed before deploying. Still generate the migration yourself (`npx prisma migrate dev`) and commit the resulting `prisma/migrations/` folder; only the *apply* step is automatic.
- **Linting:** Vercel strictly enforces ESLint and TypeScript checks during the `next build` phase. Always ensure `npm run lint` passes before pushing.

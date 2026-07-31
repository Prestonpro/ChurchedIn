# Prompt: Seed Safety-Testing Data for User Interviews

> Saved verbatim so any session can resume. Copy and paste everything below
> the line into Claude (in your terminal session running in `church-linkedin/`).

---

## The Prompt

I need you to write and run a Prisma seed script that populates the database with test data for **user testing interviews about perceived safety**. Use the **existing test St. Mary's church** that's already in the database (look it up by name — it already has some test data in it, so just add to it rather than recreating it).

The goal: when I sit down with an interviewee and walk them through the app as a student, they'll encounter a variety of **trust and safety signals** (and anti-signals) on real profiles, events, and connections — so I can observe what makes them feel safe or unsafe.

### Pre-requisite: Schema migration for social media fields

Before running the seed script, add `facebookUrl` and `instagramUrl` as optional String fields to both `MentorProfile` and `StudentProfile` in `prisma/schema.prisma`. These sit alongside the existing `linkedinUrl` field. Then run `npx prisma migrate dev --name add_social_media_urls` to create and apply the migration. The UI doesn't need to render these yet — this seed is just planting the data so we can surface them later.

```prisma
// Add to MentorProfile (alongside existing linkedinUrl):
  facebookUrl  String?
  instagramUrl String?

// Add to StudentProfile (alongside existing linkedinUrl):
  facebookUrl  String?
  instagramUrl String?
```

### What to create

**1. The interviewer's test account (the "interviewee" perspective)**
- Name: "Test Student" / email: `test-student@test.com` / password: `password123`
- Role: STUDENT at St. Mary's
- StudentProfile: country "South Korea", school "Texas A&M University", languages "Korean, English", major "Computer Science", grad year "2027", hobbies "Cooking, Photography", interests "Career advice, cultural adjustment", careerGoals "Software engineering internship", linkedinUrl "https://linkedin.com/in/test-student", instagramUrl "https://instagram.com/teststudent"
- Created 2 months ago (backdate `createdAt`)

**2. Volunteers/Mentors (create ~12–15 with intentional variation across these safety dimensions):**

| Safety Dimension | "Feels Safe" Example | "Feels Less Safe" Example |
|---|---|---|
| **Profile completeness** | Full bio, photo URL, job title, company, LinkedIn, Facebook, Instagram, languages, hobbies, interests | Blank bio, no photo, no job info, no social links, just a name |
| **Social media presence** | LinkedIn + Instagram + Facebook all filled in (dummy URLs) | No social links at all, or only one partially filled |
| **Tenure / time on platform** | `createdAt` set 6+ months ago | `createdAt` set 1–2 days ago |
| **Shared language** | Speaks Korean + English (matches interviewee) | Only speaks English or a language the interviewee doesn't speak |
| **Shared interests/hobbies** | Overlapping hobbies (Cooking, Photography) and interests | Completely different hobbies/interests, or none listed |
| **Professional credibility** | "Software Engineer at Google", LinkedIn URL filled in | No job info at all, or vague like "Self-employed" |
| **Connection activity** | Has an ACCEPTED MentorConnection with Test Student (so email is visible) | Has a PENDING or DECLINED connection |
| **Event participation** | Has RSVP'd (as HELPER) to multiple upcoming events | Has never RSVP'd to anything |
| **Ride history** | Has COMPLETED ride requests as a volunteer driver | No ride history |
| **Bio tone** | Warm, personal: "Hi! I moved here from Korea 5 years ago and love helping students adjust. Let's grab coffee!" | Generic or slightly off-putting: "Looking to network." or completely empty |
| **Google-linked account** | Has a `googleId` set (suggesting identity verification) | No `googleId` (email/password only) |

Here are the specific volunteer personas to create (all at St. Mary's, role VOLUNTEER, with MentorProfiles):

1. **Sarah Chen** — The "ideal safe mentor." Joined 8 months ago. Google-linked. Full profile: "Software Engineer at Microsoft", speaks Korean + English, hobbies: Cooking, Photography, Hiking. Warm bio. LinkedIn: `https://linkedin.com/in/sarahchen`. Facebook: `https://facebook.com/sarah.chen.volunteering`. Instagram: `https://instagram.com/sarahchen_`. Has an ACCEPTED connection with Test Student. Has RSVP'd as HELPER to 3 events. Has 2 COMPLETED rides.

2. **David Kim** — Very established, long tenure. Joined 1 year ago. Google-linked. "Senior Product Manager at Dell Technologies". Speaks Korean + English + Japanese. Bio about helping international students. LinkedIn: `https://linkedin.com/in/davidkim-pm`. Instagram: `https://instagram.com/davidkim_tech`. No Facebook. ACCEPTED connection. 5 event RSVPs.

3. **Emily Rodriguez** — Different background but warm. Joined 6 months ago. Google-linked. "Teacher at Bryan ISD". Speaks English + Spanish. Hobbies: Art, Music, Cooking. Friendly bio. LinkedIn: `https://linkedin.com/in/emilyrodriguez-teach`. Facebook: `https://facebook.com/emily.rodriguez.teacher`. No Instagram. Has a PENDING connection from Test Student. 2 event RSVPs.

4. **James Wilson** — Moderately filled profile. Joined 4 months ago. No Google. "Accountant at KPMG". English only. Brief bio. LinkedIn: `https://linkedin.com/in/jameswilson-cpa`. No Facebook, no Instagram. No connection to Test Student. 1 event RSVP.

5. **Michael Brown** — Bare minimum profile. Joined 3 days ago. No Google. No job title, no company, no bio, no hobbies, no interests, no LinkedIn, no Facebook, no Instagram. English only. No connections. No RSVPs. No rides.

6. **Jennifer Taylor** — New but enthusiastic. Joined 1 week ago. Google-linked. "Graduate Student at Texas A&M". Speaks English + Mandarin. Full hobbies/interests. Warm bio. Instagram: `https://instagram.com/jenn.taylor`. No LinkedIn, no Facebook. No connections yet. 1 event RSVP.

7. **Robert Martinez** — Long tenure, sparse profile. Joined 10 months ago. No Google. "Retired" as job title. No company. Very short bio: "Here to help." English only. No LinkedIn, no Facebook, no Instagram. DECLINED a connection from Test Student. No RSVPs.

8. **Lisa Wang** — Shared background. Joined 5 months ago. Google-linked. "Data Analyst at Amazon". Speaks Korean + English + Mandarin. Cooking, Gaming hobbies. Detailed bio about her own experience as an international student. LinkedIn: `https://linkedin.com/in/lisawang-data`. Facebook: `https://facebook.com/lisa.wang.da`. Instagram: `https://instagram.com/lisawang_`. PENDING connection. 3 event RSVPs. 1 COMPLETED ride.

9. **Tom Harris** — Active in rides but sparse profile. Joined 7 months ago. No Google. "Uber Driver" as job title (no company). English only. No bio. No LinkedIn, no Facebook, no Instagram. No connection. 0 event RSVPs but 4 COMPLETED rides.

10. **Amanda Foster** — Filled profile, no activity. Joined 2 months ago. Google-linked. "Marketing Manager at HEB". English + Spanish. Full bio, hobbies, interests. LinkedIn: `https://linkedin.com/in/amandafoster-mktg`. Facebook: `https://facebook.com/amanda.foster`. Instagram: `https://instagram.com/amandafoster`. But: 0 connections, 0 RSVPs, 0 rides — zero engagement despite the nice profile.

11. **Kevin Nguyen** — Similar name/background to interviewee. Joined 9 months ago. Google-linked. "PhD Student at Texas A&M". Speaks Vietnamese + English + Korean. Photography, Gaming. Bio about being a former international student. LinkedIn: `https://linkedin.com/in/kevinnguyen-phd`. Instagram: `https://instagram.com/kev.nguyen`. No Facebook. ACCEPTED connection. 2 RSVPs.

12. **Pastor Rachel Adams** — Church leader role (CHURCH_ADMIN). Joined 1 year ago. Google-linked. Bio as "Lead Pastor at St. Mary's International Ministry." All fields filled. LinkedIn: `https://linkedin.com/in/racheladams-pastor`. Facebook: `https://facebook.com/stmarys.ministry`. No Instagram. Shows institutional backing.

**3. Events (create 5–6 upcoming events at St. Mary's, varied):**
- "Weekly Korean-American Dinner" — DINNER, created by Sarah Chen, 20 RSVPs (mix of HELPER/ATTENDEE), at church. Recurring feel.
- "Coffee Chat: Career Advice for CS Students" — COFFEE_CHAT, created by David Kim, 5 RSVPs. At a coffee shop.
- "Airport Pickup for New Students" — AIRPORT_PICKUP, created by Pastor Rachel Adams, 8 RSVPs. Institutional.
- "Study Group: Algorithms" — STUDY_GROUP, created by Kevin Nguyen, 3 RSVPs. At the library.
- "Cultural Outing: State Fair" — CULTURAL_OUTING, created by Emily Rodriguez, 12 RSVPs. Off-campus.
- "Holiday Celebration: Chuseok" — HOLIDAY_CELEBRATION, created by Lisa Wang, 15 RSVPs. At church.

**4. Ride requests (seed some completed ones):**
- 2 COMPLETED rides where Sarah Chen was the volunteer driver for Test Student
- 1 COMPLETED ride where Tom Harris was the volunteer driver for a different student
- 1 OPEN ride request from Test Student (destination: "HEB on Texas Ave", date: next week)

**5. Block only (no seeded reports):**
- Test Student has blocked one volunteer (Michael Brown — the bare minimum profile).
- Do **NOT** seed any Report rows. The report *button* (ReportButton component) should still be visible and functional in the UI — students can always file a report — but there should be no pre-existing reports in the test data. The rationale: students should never encounter users who have active reports against them, because in a real deployment those users would have already been reviewed and removed by an admin. Seeding reports would create an unrealistic scenario where a reported person is still browsing around. We want to test whether the interviewee *notices* the report button and feels empowered to use it, not whether they react to seeing flagged users.

### Technical requirements
- Use `npx tsx prisma/seed-safety.ts` or a standalone script approach
- Use the Prisma client from `@/generated/prisma` (import path: `../src/generated/prisma`)
- Backdate `createdAt` fields using `new Date('2026-01-15')` style dates to simulate tenure
- Set `googleId` to a fake but unique string like `google-sarah-chen-123` for Google-linked accounts
- Hash a dummy password for all accounts: use bcryptjs to hash `"password123"`
- Make sure the script is idempotent (use `upsert` where possible, or delete + recreate)
- Populate the new `facebookUrl` and `instagramUrl` fields on MentorProfile/StudentProfile for the personas listed above
- After running, confirm the data looks right with a few spot-check queries
- **Push the seed script to git so we have it for future test resets**

### Important context
- The Prisma schema is at `prisma/schema.prisma`
- The Prisma config uses `prisma.config.ts` for the datasource URL
- The app uses `@prisma/adapter-pg` with Neon PostgreSQL
- MentorProfile is the volunteer's profile (job, company, languages, etc.)
- StudentProfile is the student's profile (country, school, major, etc.)
- MentorConnection links a student to a mentor (PENDING/ACCEPTED/DECLINED/ENDED)
- Rides use the RideRequest model with RideStatus (OPEN/CLAIMED/COMPLETED/CANCELLED)
- Events use EventRsvp with RsvpRole (HELPER/ATTENDEE) and RsvpStatus

Run the script and confirm it works. Then do `git add . && git commit -m "seed: safety testing data for user interviews" && git push`.

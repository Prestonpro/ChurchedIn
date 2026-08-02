import { pathToFileURL } from "node:url";
import { prisma } from "../src/lib/prisma";

/**
 * Seeds a spread of ride offers (volunteer -> church, with seats) onto the
 * safety-testing personas created by seed-safety.ts, so interviewees can
 * compare perceived safety across offers with different trust signals: a
 * fully-fleshed-out, popular ride vs. a sparse profile with an empty ride,
 * a high-authority host (the pastor) with a waitlist, a fully-booked ride,
 * and one from a volunteer the test student has blocked (to confirm blocked
 * offers never surface to them). Idempotent — skips an offer if one already
 * exists for that volunteer at that date/time, and upserts claims by their
 * (rideOfferId, studentId) unique constraint.
 */
export async function seedRideOffers() {
  console.log("Seeding ride-offer test data...");

  const church = await prisma.church.findFirst({ where: { name: "St. Mary's" } });
  if (!church) {
    console.log("St. Mary's not found — run seedSafetyData() first. Skipping.");
    return;
  }
  const churchId = church.id;

  async function findUser(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }
  async function findUserByName(name: string) {
    return prisma.user.findFirst({ where: { name } });
  }

  const [sarahChen, tomHarris, rachelAdams, michaelBrown, kevinNguyen, testStudent] = await Promise.all([
    findUser("sarah.chen@example.com"),
    findUser("tom.harris@example.com"),
    findUser("rachel.adams@example.com"),
    findUser("michael.brown@example.com"),
    findUser("kevin.nguyen@example.com"),
    findUser("test-student@test.com"),
  ]);

  if (!sarahChen || !tomHarris || !rachelAdams || !michaelBrown || !kevinNguyen || !testStudent) {
    console.log("One or more safety-testing personas not found — run seedSafetyData() first. Skipping.");
    return;
  }

  // Opportunistic extra riders — present on production's organic St. Mary's
  // membership but not on every environment, so each is looked up
  // individually and filtered out if absent rather than required.
  const extraStudentNames = ["Wei Zhang", "Priya Sharma", "Carlos Mendes", "Fatima Al-Sayed", "Minji Park", "Diego Torres"];
  const extraStudents = (await Promise.all(extraStudentNames.map(findUserByName))).filter(
    (u): u is NonNullable<typeof u> => u !== null,
  );
  const rider = (i: number) => extraStudents[i % Math.max(extraStudents.length, 1)] ?? null;

  const daysFromNow = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

  async function upsertOffer(opts: {
    volunteerId: string;
    date: Date;
    time: string;
    capacity: number;
    notes: string | null;
  }) {
    const existing = await prisma.rideOffer.findFirst({
      where: { volunteerId: opts.volunteerId, date: opts.date, time: opts.time },
    });
    if (existing) return existing;
    return prisma.rideOffer.create({ data: { churchId, ...opts } });
  }

  async function upsertClaim(rideOfferId: string, studentId: string, status: "CONFIRMED" | "WAITLISTED") {
    await prisma.rideOfferClaim.upsert({
      where: { rideOfferId_studentId: { rideOfferId, studentId } },
      update: {},
      create: { rideOfferId, studentId, status },
    });
  }

  // 1. Sarah Chen — strong profile (job, all 3 socials, 8mo tenure), ride
  //    nearly full: high trust signals + high demand.
  const sarahOffer = await upsertOffer({
    volunteerId: sarahChen.id,
    date: daysFromNow(3),
    time: "9:00 AM",
    capacity: 3,
    notes: "Leaving from the HEB on Texas Ave, plenty of trunk space.",
  });
  await upsertClaim(sarahOffer.id, testStudent.id, "CONFIRMED");
  const extra1 = rider(0);
  if (extra1) await upsertClaim(sarahOffer.id, extra1.id, "CONFIRMED");

  // 2. Tom Harris — sparse profile (one line of content, minimal tags),
  //    ride wide open: weak trust signals + low demand.
  await upsertOffer({
    volunteerId: tomHarris.id,
    date: daysFromNow(3),
    time: "9:15 AM",
    capacity: 4,
    notes: null,
  });

  // 3. Pastor Rachel Adams — highest-authority host (church admin, 1yr
  //    tenure), ride full with a waitlist forming.
  const rachelOffer = await upsertOffer({
    volunteerId: rachelAdams.id,
    date: daysFromNow(4),
    time: "10:30 AM",
    capacity: 1,
    notes: "Sunday service carpool — meet at the north parking lot.",
  });
  const extra2 = rider(1);
  if (extra2) {
    await upsertClaim(rachelOffer.id, extra2.id, "CONFIRMED");
    const extra3 = rider(2);
    if (extra3 && extra3.id !== extra2.id) await upsertClaim(rachelOffer.id, extra3.id, "WAITLISTED");
  } else {
    await upsertClaim(rachelOffer.id, testStudent.id, "CONFIRMED");
  }

  // 4. Kevin Nguyen — moderate profile (grad student, partial socials),
  //    completely full (capacity 1, 1 confirmed) — tests the "full,
  //    waitlist-only" join state.
  const kevinOffer = await upsertOffer({
    volunteerId: kevinNguyen.id,
    date: daysFromNow(5),
    time: "8:45 AM",
    capacity: 1,
    notes: "Quick trip, leaving right at 8:45 — please be on time.",
  });
  const extra4 = rider(3);
  if (extra4) await upsertClaim(kevinOffer.id, extra4.id, "CONFIRMED");

  // 5. Michael Brown — the persona blocked by Test Student in
  //    seedSafetyData(). This offer should never appear on Test Student's
  //    "available rides" board — confirms the blocked-pair exclusion in
  //    listActiveRideOffersForChurch actually holds for ride offers too.
  await upsertOffer({
    volunteerId: michaelBrown.id,
    date: daysFromNow(3),
    time: "9:30 AM",
    capacity: 2,
    notes: null,
  });

  console.log("Seeded ride-offer test data.");
}

const isDirectRun = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;
if (isDirectRun) {
  seedRideOffers()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

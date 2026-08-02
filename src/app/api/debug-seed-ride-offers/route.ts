import { NextRequest, NextResponse } from "next/server";
import { seedRideOffers } from "../../../../prisma/seed-ride-offers";

// TEMPORARY debug route — runs the ride-offer safety-testing seed script
// against whichever database this deployment's DATABASE_URL points to
// (i.e. production, when deployed). Idempotent (skips an offer that
// already exists for that volunteer/date/time; upserts claims by their
// unique constraint), safe to call more than once. POST-only, requires a
// confirm query param. Remove this route once run.
export async function POST(request: NextRequest) {
  const confirm = request.nextUrl.searchParams.get("confirm");
  if (confirm !== "yes-seed-ride-offers") {
    return NextResponse.json(
      { error: "Missing or incorrect confirm query param — refusing to run." },
      { status: 400 },
    );
  }

  await seedRideOffers();

  return NextResponse.json({ ok: true, message: "Ride-offer test data seeded." });
}

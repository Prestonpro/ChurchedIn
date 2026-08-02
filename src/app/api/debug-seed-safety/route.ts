import { NextRequest, NextResponse } from "next/server";
import { seedSafetyData } from "../../../../prisma/seed-safety";

// TEMPORARY debug route — re-runs the safety-testing seed script against
// production to apply the new verified-badge assignments (Sarah Chen,
// Pastor Rachel Adams, Kevin Nguyen). Idempotent (upsert/skipDuplicates +
// updateMany), safe to call more than once. POST-only, requires a
// confirm query param. Remove this route once run.
export async function POST(request: NextRequest) {
  const confirm = request.nextUrl.searchParams.get("confirm");
  if (confirm !== "yes-seed-safety-data") {
    return NextResponse.json(
      { error: "Missing or incorrect confirm query param — refusing to run." },
      { status: 400 },
    );
  }

  await seedSafetyData();

  return NextResponse.json({ ok: true, message: "Safety-testing personas seeded/updated." });
}

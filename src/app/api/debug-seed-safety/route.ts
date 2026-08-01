import { NextRequest, NextResponse } from "next/server";
import { seedSafetyData } from "../../../../prisma/seed-safety";

// TEMPORARY debug route — runs the safety-testing seed script against
// whichever database this deployment's DATABASE_URL points to (i.e.
// production, when deployed). Idempotent (upsert/skipDuplicates), safe
// to call more than once. POST-only, requires a confirm query param.
// Remove this route once run.
export async function POST(request: NextRequest) {
  const confirm = request.nextUrl.searchParams.get("confirm");
  if (confirm !== "yes-seed-safety-data") {
    return NextResponse.json(
      { error: "Missing or incorrect confirm query param — refusing to run." },
      { status: 400 },
    );
  }

  await seedSafetyData();

  return NextResponse.json({ ok: true, message: "Safety-testing personas seeded." });
}

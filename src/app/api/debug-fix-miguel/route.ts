import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// TEMPORARY debug route — one-off fix for Miguel Llamas's profile data on
// production: his old MentorProfile.interests field holds a full sentence
// (written before a dedicated bio field existed) instead of comma-separated
// tags. Moves that sentence into User.bio (only if bio is currently empty,
// to avoid clobbering anything he's since written there) and clears
// interests. POST-only, requires a confirm query param. Remove this route
// once run.
export async function POST(request: NextRequest) {
  const confirm = request.nextUrl.searchParams.get("confirm");
  if (confirm !== "yes-fix-miguel") {
    return NextResponse.json(
      { error: "Missing or incorrect confirm query param — refusing to run." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findFirst({
    where: { name: "Miguel Llamas" },
    include: { mentorProfile: true },
  });

  if (!user || !user.mentorProfile) {
    return NextResponse.json({ error: "Miguel Llamas or his mentor profile not found." }, { status: 404 });
  }

  const before = { bio: user.bio, interests: user.mentorProfile.interests };

  if (!user.mentorProfile.interests) {
    return NextResponse.json({ skipped: "No interests value to move.", before });
  }

  if (user.bio) {
    return NextResponse.json({
      skipped: "bio is already set — not overwriting. Move interests manually if still needed.",
      before,
    });
  }

  const sentence = user.mentorProfile.interests;

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { bio: sentence } }),
    prisma.mentorProfile.update({ where: { id: user.mentorProfile.id }, data: { interests: null } }),
  ]);

  return NextResponse.json({
    ok: true,
    before,
    after: { bio: sentence, interests: null },
  });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// TEMPORARY debug route — read-only check of RideOffer/RideOfferClaim rows
// on whichever database this deployment points to, to confirm the seed
// landed correctly. No emails/passwords returned. Remove once checked.
export async function GET() {
  const offers = await prisma.rideOffer.findMany({
    where: { church: { name: "St. Mary's" } },
    include: {
      volunteer: { select: { name: true } },
      claims: { include: { student: { select: { name: true } } } },
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({
    totalOffers: offers.length,
    offers: offers.map((o) => ({
      volunteer: o.volunteer.name,
      date: o.date,
      time: o.time,
      capacity: o.capacity,
      cancelledAt: o.cancelledAt,
      notes: o.notes,
      claims: o.claims.map((c) => `${c.student.name} [${c.status}]`),
    })),
  });
}

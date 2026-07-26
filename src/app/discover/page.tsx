import { requireUser } from "@/lib/auth";
import { listDiscoverableChurches } from "@/lib/queries";
import { AuthShell } from "@/components/nav/AuthShell";
import { DiscoverClient, type DiscoverableChurch } from "./DiscoverClient";

export default async function DiscoverPage() {
  const user = await requireUser();
  const rawChurches = await listDiscoverableChurches();

  const churches: DiscoverableChurch[] = rawChurches.map((c) => ({
    id: c.id,
    name: c.name,
    verificationStatus: c.verificationStatus,
    denomination: c.denomination,
    languages: c.languages,
    serviceTimes: c.serviceTimes,
    bio: c.bio,
    locationLat: c.locationLat,
    locationLng: c.locationLng,
    address: c.address,
    website: c.website,
    memberCount: c.memberCount,
    upcomingEventCount: c.upcomingEventCount,
    distanceMiles: null,
  }));

  return (
    <AuthShell user={user} fullBleed>
      <DiscoverClient churches={churches} />
    </AuthShell>
  );
}

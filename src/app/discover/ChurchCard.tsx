import Link from "next/link";
import { Clock, Translate, UsersThree, MapPinLine } from "@phosphor-icons/react/dist/ssr";
import { VerificationBadge } from "@/components/VerificationBadge";
import type { DiscoverableChurch } from "./DiscoverClient";

/** Shared between the sidebar list and the map popup — same info either
 * way, per the brief ("Clicking a pin shows a popup with the church card
 * info"). */
export function ChurchCard({ church, compact = false }: { church: DiscoverableChurch; compact?: boolean }) {
  const languageList = church.languages
    ? church.languages.split(",").map((l) => l.trim()).filter(Boolean)
    : [];

  return (
    <div className={compact ? "w-64" : ""}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-ink">{church.name}</h3>
        <VerificationBadge status={church.verificationStatus} />
      </div>
      <p className="mt-1 text-xs text-ink-muted">
        {church.denomination && <>{church.denomination} · </>}
        {church.memberCount} {church.memberCount === 1 ? "member" : "members"}
        {church.distanceMiles != null && <> · {church.distanceMiles.toFixed(1)} mi away</>}
      </p>
      {languageList.length > 0 && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-ink-soft">
          <Translate weight="bold" className="size-3.5 shrink-0 text-ink-faint" />
          {languageList.join(", ")}
        </p>
      )}
      {church.serviceTimes && (
        <p className="mt-1 flex items-center gap-1 text-xs text-ink-soft">
          <Clock weight="bold" className="size-3.5 shrink-0 text-ink-faint" />
          {church.serviceTimes}
        </p>
      )}
      {church.address && (
        <p className="mt-1 flex items-center gap-1 text-xs text-ink-soft">
          <MapPinLine weight="bold" className="size-3.5 shrink-0 text-ink-faint" />
          {church.address}
        </p>
      )}
      {church.bio && !compact && (
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-soft">{church.bio}</p>
      )}
      {church.upcomingEventCount > 0 && (
        <p className="mt-1.5 text-xs font-medium text-brand-600">
          {church.upcomingEventCount} upcoming {church.upcomingEventCount === 1 ? "gathering" : "gatherings"}
        </p>
      )}
      <div className="mt-3 flex gap-1.5">
        <Link
          href={`/churches/${church.id}`}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-brand hover:bg-brand-700"
        >
          <UsersThree weight="bold" className="size-3.5" /> Visit profile
        </Link>
      </div>
    </div>
  );
}

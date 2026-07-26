import { CheckCircle, SealCheck } from "@phosphor-icons/react/dist/ssr";
import { VERIFICATION_STATUS, type VerificationStatus } from "@/lib/constants";

/**
 * Trust signal shown on church cards and profile pages. UNVERIFIED is
 * deliberately understated (muted text, no icon) rather than a "bad" red
 * badge — most new churches on the platform start here, and it isn't a
 * warning, just an absence of vouching yet. Native `title` attribute for
 * the tooltip (no tooltip component exists elsewhere in this app; this
 * keeps it dependency-free and works the same everywhere).
 */
export function VerificationBadge({ status }: { status: VerificationStatus }) {
  if (status === VERIFICATION_STATUS.PASTOR_VERIFIED) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700"
        title="Verified by church leadership"
      >
        <SealCheck weight="fill" className="size-3.5" />
        Pastor verified
      </span>
    );
  }
  if (status === VERIFICATION_STATUS.COMMUNITY_VERIFIED) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success"
        title="Verified by community members"
      >
        <CheckCircle weight="fill" className="size-3.5" />
        Community verified
      </span>
    );
  }
  return <span className="text-xs font-medium text-ink-faint">Unverified</span>;
}

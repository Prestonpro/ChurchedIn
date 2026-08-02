import { SealCheck } from "@phosphor-icons/react/dist/ssr";

/** Identity-verification badge shown next to a name — see User.verified's
 * doc comment in schema.prisma for what this does and doesn't mean yet. */
export function VerifiedBadge({ className = "" }: { className?: string }) {
  return (
    <span title="Verified" className="inline-flex">
      <SealCheck weight="fill" aria-label="Verified" className={`size-4 shrink-0 text-brand-600 ${className}`} />
    </span>
  );
}

import { SealCheck } from "@phosphor-icons/react/dist/ssr";

/** Identity-verification badge shown next to a name — see User.verified's
 * doc comment in schema.prisma for what this does and doesn't mean yet. */
export function VerifiedBadge({ className = "" }: { className?: string }) {
  return (
    <span
      title="Verified"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-brand-100 p-0.5 ${className}`}
    >
      <SealCheck weight="fill" aria-label="Verified" className="size-3.5 text-brand-700" />
    </span>
  );
}

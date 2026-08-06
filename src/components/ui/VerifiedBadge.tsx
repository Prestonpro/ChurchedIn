import { SealCheck } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/Badge";

/** Identity-verification badge shown next to a name — see User.verified's
 * doc comment in schema.prisma for what this does and doesn't mean yet.
 * A bare icon wasn't noticeable enough — a labeled pill (the same Badge
 * used for role tags elsewhere) reads clearly at a glance instead of
 * blending into the name it sits next to. */
export function VerifiedBadge({ className = "" }: { className?: string }) {
  return (
    <Badge tone="brand" icon={SealCheck} iconWeight="fill" title="Verified" className={className}>
      Verified
    </Badge>
  );
}

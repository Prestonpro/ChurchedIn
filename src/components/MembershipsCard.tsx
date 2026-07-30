import Link from "next/link";
import { Buildings } from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ROLES, roleLabel, type Role } from "@/lib/constants";

type Membership = { churchId: string; role: string; church: { name: string } };

/** Every church a user belongs to, plus their role at each — shown on all
 * three role-specific profile pages so multi-membership users (and anyone
 * who forgets which churches they've joined) can see the full picture in
 * one place, not just their current active church. */
export function MembershipsCard({ memberships }: { memberships: Membership[] }) {
  return (
    <Card>
      <h2 className="mb-4 font-bold text-ink">Your churches</h2>
      <div className="space-y-2">
        {memberships.map((m) => (
          <Link
            key={m.churchId}
            href={`/churches/${m.churchId}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-line p-3 transition-brand hover:border-brand-200 hover:bg-paper"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-ink">
              <Buildings weight="bold" className="size-4 text-ink-faint" />
              {m.church.name}
            </span>
            <Badge tone={m.role === ROLES.CHURCH_ADMIN ? "brand" : "neutral"}>
              {roleLabel(m.role as Role)}
            </Badge>
          </Link>
        ))}
      </div>
    </Card>
  );
}

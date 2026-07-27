import { UsersThree } from "@phosphor-icons/react/dist/ssr";

/**
 * Trust signal shown on church cards and profile pages — replaces an
 * earlier verification-tier system (community vouching + pastor
 * self-verification) that turned out to be trivially self-grantable: any
 * user could create a church and immediately click "Verify as pastor" on
 * their own, brand-new, single-member church with no check at all.
 * Member count can't be self-granted the same way — it only grows as real
 * people actually join, which is a more honest signal for a visitor
 * deciding whether a church is an active, real community.
 */
const TIERS = [
  { min: 30, label: "Large community" },
  { min: 10, label: "Established" },
  { min: 3, label: "Growing" },
  { min: 0, label: "New" },
] as const;

function tierLabel(memberCount: number): string {
  return TIERS.find((t) => memberCount >= t.min)!.label;
}

export function MemberCountBadge({ memberCount }: { memberCount: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700"
      title={`${memberCount} ${memberCount === 1 ? "member has" : "members have"} joined this church`}
    >
      <UsersThree weight="fill" className="size-3.5" />
      {memberCount} {memberCount === 1 ? "member" : "members"} · {tierLabel(memberCount)}
    </span>
  );
}

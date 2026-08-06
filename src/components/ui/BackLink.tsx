"use client";

import { useRouter } from "next/navigation";

/**
 * A "← Back" control that returns to wherever the visitor actually came
 * from (their real in-app previous page), not a hardcoded destination.
 * A tester coming from Friends, from a conversation, or from a church
 * member list all landed on the same profile page and all got sent to "/"
 * on back — this is the fix. `router.back()` is a Client Component API
 * (no Server Component equivalent), hence the split from the page itself.
 *
 * If there's no in-app history to go back to (profile opened directly,
 * e.g. from a shared link), `router.back()` is a no-op — the same
 * graceful-does-nothing behavior as a browser's own back button in that
 * situation, so no fallback destination is needed.
 */
export function BackLink({ label = "← Back" }: { label?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="text-sm text-ink-faint transition-brand hover:text-ink hover:underline"
    >
      {label}
    </button>
  );
}

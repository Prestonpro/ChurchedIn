"use client";

import { useEffect, useState, useTransition } from "react";
import { markOnboardingSeenAction } from "@/lib/actions/auth";
import { HelpGuideModal } from "@/components/HelpGuideButton";
import type { Role } from "@/lib/constants";

/**
 * Auto-opens the existing role-aware HelpGuideModal once, ever, for a user
 * who's never seen it — testers said they wanted an explainer on first use,
 * not a whole spotlight/overlay tutorial system (that's more than this app
 * needs; the walkthrough already exists, it just wasn't shown proactively).
 *
 * Rendered inside AuthShell, so it mounts on every authenticated page — the
 * `hasSeenOnboarding` check means the actual modal-open only really fires
 * once across a user's whole lifetime, right after their first
 * `hasSeenOnboarding: false` render.
 *
 * The `setTimeout(fn, 0)` deferral (not calling `setOpen`/starting the
 * transition straight from the effect body) is deliberate — see
 * SearchableSelect's `mounted` flag for the same pattern.
 * `react-hooks/set-state-in-effect` is an ESLint error here, and ESLint
 * errors fail the Vercel build.
 */
export function OnboardingAutoTrigger({
  role,
  churchId,
  hasSeenOnboarding,
}: {
  role: Role;
  churchId: string;
  hasSeenOnboarding: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (hasSeenOnboarding) return;
    const timeout = setTimeout(() => {
      setOpen(true);
      // Marked seen the moment it opens, not on dismiss — see the doc
      // comment on markOnboardingSeenAction for why.
      startTransition(async () => {
        await markOnboardingSeenAction();
      });
    }, 0);
    return () => clearTimeout(timeout);
  }, [hasSeenOnboarding]);

  return <HelpGuideModal role={role} churchId={churchId} open={open} onClose={() => setOpen(false)} />;
}

"use client";

import { useState } from "react";
import { ArrowClockwise } from "@phosphor-icons/react/dist/ssr";
import { GatheringDemo } from "@/components/featureDemos/GatheringDemo";
import { RSVPDemo } from "@/components/featureDemos/RSVPDemo";
import { FriendDemo } from "@/components/featureDemos/FriendDemo";

const DEMOS = {
  calendar: GatheringDemo,
  hand: RSVPDemo,
  users: FriendDemo,
} as const;

/**
 * Picks the right live animated demo for a feature card and adds a shared
 * "Replay" affordance — each demo just re-runs its own timeline whenever
 * `playKey` changes, so replay is a one-liner here rather than duplicated
 * per demo.
 */
export function FeatureDemo({ demoKey }: { demoKey: keyof typeof DEMOS }) {
  const [playKey, setPlayKey] = useState(0);
  const DemoComponent = DEMOS[demoKey];

  return (
    <div>
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={() => setPlayKey((k) => k + 1)}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-ink-faint transition-brand hover:bg-paper hover:text-ink"
        >
          <ArrowClockwise weight="bold" className="size-3.5" /> Replay
        </button>
      </div>
      <DemoComponent playKey={playKey} />
    </div>
  );
}

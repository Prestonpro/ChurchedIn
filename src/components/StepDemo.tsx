"use client";

import { useState } from "react";
import { ArrowClockwise } from "@phosphor-icons/react/dist/ssr";
import { StartJoinDemo } from "@/components/stepDemos/StartJoinDemo";
import { ShareBrowseDemo } from "@/components/stepDemos/ShareBrowseDemo";
import { ConnectDemo } from "@/components/stepDemos/ConnectDemo";

const STEP_DEMOS = {
  startJoin: StartJoinDemo,
  shareBrowse: ShareBrowseDemo,
  connect: ConnectDemo,
} as const;

/** Same lookup + replay pattern as FeatureDemo, for the "01/02/03" step
 * cards — a separate namespace of demos since these walk through the
 * onboarding steps rather than the individual features above them. */
export function StepDemo({ demoKey }: { demoKey: keyof typeof STEP_DEMOS }) {
  const [playKey, setPlayKey] = useState(0);
  const DemoComponent = STEP_DEMOS[demoKey];

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

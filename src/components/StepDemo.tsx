"use client";

import { StartJoinDemo } from "@/components/stepDemos/StartJoinDemo";
import { ShareBrowseDemo } from "@/components/stepDemos/ShareBrowseDemo";
import { ConnectDemo } from "@/components/stepDemos/ConnectDemo";

const STEP_DEMOS = {
  startJoin: StartJoinDemo,
  shareBrowse: ShareBrowseDemo,
  connect: ConnectDemo,
} as const;

/** Same lookup pattern as FeatureDemo, for the "01/02/03" step cards — a
 * separate namespace of demos since these walk through the onboarding
 * steps rather than the individual features above them. */
export function StepDemo({ demoKey }: { demoKey: keyof typeof STEP_DEMOS }) {
  const DemoComponent = STEP_DEMOS[demoKey];
  return <DemoComponent playKey={0} />;
}

"use client";

import { GatheringDemo } from "@/components/featureDemos/GatheringDemo";
import { RSVPDemo } from "@/components/featureDemos/RSVPDemo";
import { FriendDemo } from "@/components/featureDemos/FriendDemo";

const DEMOS = {
  calendar: GatheringDemo,
  hand: RSVPDemo,
  users: FriendDemo,
} as const;

/**
 * Picks the right live animated demo for a feature card. No replay control
 * needed — Modal fully unmounts its content on close, so reopening the
 * card's modal already re-triggers the demo's own mount-time animation.
 */
export function FeatureDemo({ demoKey }: { demoKey: keyof typeof DEMOS }) {
  const DemoComponent = DEMOS[demoKey];
  return <DemoComponent playKey={0} />;
}

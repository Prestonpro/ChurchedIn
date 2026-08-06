"use client";

import { useState } from "react";
import { Check, ShareNetwork } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";

/** Facebook-Events-style share: native share sheet where available
 * (mobile), clipboard copy as the fallback everywhere else. */
export function ShareEventButton({ eventId }: { eventId: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/events/${eventId}`;
    if (navigator.share) {
      try {
        await navigator.share({ url });
        return;
      } catch {
        return;
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleShare}>
      {copied ? <Check weight="bold" className="size-3.5" /> : <ShareNetwork weight="bold" className="size-3.5" />}
      {copied ? "Link copied" : "Share"}
    </Button>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Question, CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { Modal } from "@/components/ui/Modal";
import { Button, LinkButton } from "@/components/ui/Button";
import { getHelpSteps, HELP_GUIDE_TITLE } from "@/lib/helpContent";
import type { Role } from "@/lib/constants";

/** The role-aware guided tour content itself — "everything you can do" as a
 * short, click-through walkthrough instead of a wall of text, since there's
 * no way to record real screen-capture videos for this. Deliberately
 * stateless on `open` (controlled by the caller) so it can be rendered
 * somewhere that survives an unrelated parent unmounting — e.g. the mobile
 * nav drawer closes itself the moment its own Help button is tapped, which
 * would destroy this modal's state too if it lived inside that drawer's
 * conditionally-rendered JSX. */
export function HelpGuideModal({
  role,
  churchId,
  open,
  onClose,
}: {
  role: Role;
  churchId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const steps = getHelpSteps(role, churchId);
  const step = steps[stepIndex];
  const Icon = step.icon;
  const isLast = stepIndex === steps.length - 1;

  useEffect(() => {
    if (open) {
      setTimeout(() => setStepIndex(0), 0);
    }
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title={HELP_GUIDE_TITLE[role]} maxWidthClassName="max-w-lg">
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl bg-paper p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Icon weight="duotone" className="size-5.5" />
          </span>
          <div>
            <h3 className="font-bold text-ink">{step.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">{step.body}</p>
            {step.linkHref && (
              <LinkButton href={step.linkHref} size="sm" variant="secondary" className="mt-3" onClick={onClose}>
                {step.linkLabel ?? "Take me there"}
              </LinkButton>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {steps.map((s, i) => (
              <button
                key={s.title}
                onClick={() => setStepIndex(i)}
                aria-label={`Go to step ${i + 1}`}
                className={`size-2 rounded-full transition-brand ${
                  i === stepIndex ? "w-4 bg-brand-600" : "bg-line-strong hover:bg-brand-200"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={stepIndex === 0}
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            >
              <CaretLeft weight="bold" className="size-3.5" /> Back
            </Button>
            {isLast ? (
              <Button size="sm" onClick={onClose}>
                Done
              </Button>
            ) : (
              <Button size="sm" onClick={() => setStepIndex((i) => Math.min(steps.length - 1, i + 1))}>
                Next <CaretRight weight="bold" className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

/** Desktop header's trigger — owns its own open state since it lives in an
 * always-mounted (just CSS-hidden below `lg`) part of the header, unlike
 * the mobile drawer's button (see MobileMenu, which owns its own state and
 * renders HelpGuideModal directly instead of this). */
export function HelpGuideButton({ role, churchId }: { role: Role; churchId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Help"
        aria-label="Help"
        className="flex size-8 items-center justify-center rounded-lg text-ink-faint transition-brand hover:bg-paper hover:text-brand-600"
      >
        <Question weight="bold" className="size-4.5" />
      </button>
      <HelpGuideModal role={role} churchId={churchId} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

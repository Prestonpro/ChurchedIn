"use client";

import { useState, useTransition } from "react";
import { ArrowsLeftRight, SignOut } from "@phosphor-icons/react/dist/ssr";
import { switchRoleAction, leaveChurchAction } from "@/lib/actions/churches";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/Field";
import { ROLES, roleLabel, type Role } from "@/lib/constants";

/** Self-service membership management for the current viewer at this
 * church — switching between STUDENT/VOLUNTEER, or leaving entirely.
 * CHURCH_ADMIN is never a switch target (that stays admin-granted only),
 * but a leader CAN switch away from admin or leave, subject to the same
 * "at least one leader" rule the admin-side promote/demote controls use —
 * the server action re-checks this regardless of what's shown here. */
export function MembershipCard({
  churchId,
  role,
  churchName,
}: {
  churchId: string;
  role: Role;
  churchName: string;
}) {
  const [switchPending, startSwitchTransition] = useTransition();
  const [switchError, setSwitchError] = useState<string | undefined>();
  const [leavePending, startLeaveTransition] = useTransition();
  const [leaveError, setLeaveError] = useState<string | undefined>();

  function switchTo(newRole: "STUDENT" | "VOLUNTEER") {
    if (!confirm(`Switch to ${roleLabel(newRole)} at ${churchName}?`)) return;
    setSwitchError(undefined);
    startSwitchTransition(async () => {
      const result = await switchRoleAction(churchId, newRole);
      if (result && "error" in result) setSwitchError(result.error);
    });
  }

  function leave() {
    if (!confirm(`Leave ${churchName}? You can rejoin later with the church's join code.`)) return;
    setLeaveError(undefined);
    startLeaveTransition(async () => {
      const result = await leaveChurchAction(churchId);
      if (result && "error" in result) setLeaveError(result.error);
    });
  }

  const switchOptions: ("STUDENT" | "VOLUNTEER")[] =
    role === ROLES.STUDENT ? ["VOLUNTEER"] : role === ROLES.VOLUNTEER ? ["STUDENT"] : ["STUDENT", "VOLUNTEER"];

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm text-ink-soft">
          You&apos;re a <span className="font-semibold">{roleLabel(role).toLowerCase()}</span> here.
        </p>
        <FormError message={switchError} />
        <div className="mt-2 flex flex-wrap gap-2">
          {switchOptions.map((target) => (
            <Button key={target} variant="secondary" size="sm" disabled={switchPending} onClick={() => switchTo(target)}>
              <ArrowsLeftRight weight="bold" className="size-4" />
              {switchPending ? "Switching…" : `Switch to ${roleLabel(target)}`}
            </Button>
          ))}
        </div>
      </div>

      <div className="border-t border-line pt-4">
        <FormError message={leaveError} />
        <Button
          variant="ghost"
          size="sm"
          className="text-ink-muted hover:bg-danger-soft hover:text-danger"
          disabled={leavePending}
          onClick={leave}
        >
          <SignOut weight="bold" className="size-4" />
          {leavePending ? "Leaving…" : "Leave this church"}
        </Button>
      </div>
    </div>
  );
}

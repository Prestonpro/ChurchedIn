"use client";

import { useState, useTransition } from "react";
import { Star, SealCheck } from "@phosphor-icons/react/dist/ssr";
import {
  promoteToAdminAction,
  demoteFromAdminAction,
  setIsPastorAction,
  type ActionResult,
} from "@/lib/actions/churches";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/Field";
import { ROLES } from "@/lib/constants";

type Member = {
  id: string;
  userId: string;
  role: string;
  isPastor: boolean;
  user: { id: string; name: string; email: string };
};

/** Member list + role management for /churches/[id]/settings. `canManage`
 * (viewer is CHURCH_ADMIN) gates promote/demote; `canAssignPastor` (admin
 * OR an existing pastor) gates the pastor toggle — matching the brief's
 * "only PASTOR role can assign PASTOR to others," with CHURCH_ADMIN
 * included for the same bootstrap reason as elsewhere in this feature. */
export function MembersList({
  churchId,
  members,
  viewerUserId,
  canManage,
  canAssignPastor,
}: {
  churchId: string;
  members: Member[];
  viewerUserId: string;
  canManage: boolean;
  canAssignPastor: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);

  function run(action: () => Promise<ActionResult>, userId: string) {
    setPendingUserId(userId);
    setError(undefined);
    startTransition(async () => {
      const result = await action();
      setPendingUserId(null);
      if (result && "error" in result) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-2">
      <FormError message={error} />
      {members.map((m) => {
        const isBusy = pending && pendingUserId === m.userId;
        return (
          <div
            key={m.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-3"
          >
            <div className="flex items-center gap-2.5">
              <Avatar name={m.user.name} size="sm" />
              <div>
                <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                  {m.user.name}
                  {m.userId === viewerUserId && <span className="text-xs font-normal text-ink-faint">(you)</span>}
                </p>
                <p className="text-xs text-ink-muted">{m.user.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone={m.role === ROLES.CHURCH_ADMIN ? "brand" : "neutral"}>
                {m.role === ROLES.CHURCH_ADMIN ? "Church leader" : m.role === ROLES.VOLUNTEER ? "Volunteer" : "Student"}
              </Badge>
              {m.isPastor && (
                <Badge tone="success">
                  <SealCheck weight="fill" className="size-3" /> Pastor
                </Badge>
              )}
              {canManage && m.role !== ROLES.CHURCH_ADMIN && (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={isBusy}
                  onClick={() => run(() => promoteToAdminAction(churchId, m.userId), m.userId)}
                >
                  <Star weight="bold" className="size-3.5" /> Make leader
                </Button>
              )}
              {canManage && m.role === ROLES.CHURCH_ADMIN && m.userId !== viewerUserId && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isBusy}
                  onClick={() => run(() => demoteFromAdminAction(churchId, m.userId), m.userId)}
                >
                  Remove leadership
                </Button>
              )}
              {canAssignPastor && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isBusy}
                  onClick={() => run(() => setIsPastorAction(churchId, m.userId, !m.isPastor), m.userId)}
                >
                  {m.isPastor ? "Remove pastor flag" : "Flag as pastor"}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

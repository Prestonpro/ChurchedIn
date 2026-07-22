import { UsersThree, Translate, Sparkle, EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";
import { requireRole } from "@/lib/auth";
import { listMentorsForChurch, listConnectionsAsStudent } from "@/lib/queries";
import { AuthShell } from "@/components/nav/AuthShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { BlockButton } from "@/components/BlockButton";
import { EndConnectionButton } from "@/components/ConnectionActions";
import { ConnectionRequestForm } from "./ConnectionRequestForm";
import { CONNECTION_STATUS, ROLES } from "@/lib/constants";

export default async function MentorDirectoryPage() {
  const user = await requireRole(ROLES.STUDENT);
  if (!user.activeMembership) {
    return (
      <AuthShell user={user}>
        <EmptyState icon={UsersThree} title="Join a church to see its mentors" />
      </AuthShell>
    );
  }

  const [mentors, myConnections] = await Promise.all([
    listMentorsForChurch(user.activeMembership.churchId, user.id),
    listConnectionsAsStudent(user.id),
  ]);
  const connectionByMentor = new Map(myConnections.map((c) => [c.mentorId, c]));

  return (
    <AuthShell user={user}>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-ink">Mentors</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Browse volunteers open to mentoring at {user.activeMembership.church.name}.
        </p>
      </div>

      {mentors.length === 0 ? (
        <EmptyState
          icon={UsersThree}
          title="No mentors listed yet"
          body="Check back soon — volunteers at your church haven't opted in yet."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {mentors.map((m) => {
            const connection = connectionByMentor.get(m.userId);
            return (
              <Card key={m.id} className="flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Avatar name={m.user.name} />
                    <h2 className="font-bold text-ink">{m.user.name}</h2>
                  </div>
                  <BlockButton userId={m.userId} />
                </div>
                {m.user.bio && <p className="mt-3 text-sm text-ink-soft">{m.user.bio}</p>}
                <div className="mt-3 space-y-1.5 text-xs text-ink-muted">
                  {m.languages && (
                    <p className="flex items-center gap-1.5">
                      <Translate weight="bold" className="size-3.5 shrink-0" /> {m.languages}
                    </p>
                  )}
                  {m.interests && (
                    <p className="flex items-center gap-1.5">
                      <Sparkle weight="bold" className="size-3.5 shrink-0" /> {m.interests}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex-1 border-t border-line pt-4">
                  {!connection && <ConnectionRequestForm mentorId={m.userId} />}
                  {connection?.status === CONNECTION_STATUS.PENDING && (
                    <Badge tone="warning">Request pending</Badge>
                  )}
                  {connection?.status === CONNECTION_STATUS.ACCEPTED && (
                    <div className="space-y-2.5">
                      <Badge tone="success">Connected</Badge>
                      <p className="flex items-center gap-1.5 text-sm text-ink-soft">
                        <EnvelopeSimple weight="bold" className="size-4 shrink-0 text-ink-faint" />
                        {connection.mentor.email}
                      </p>
                      <EndConnectionButton connectionId={connection.id} />
                    </div>
                  )}
                  {connection?.status === CONNECTION_STATUS.DECLINED && (
                    <div className="space-y-2">
                      <p className="text-sm text-ink-muted">
                        This mentor wasn&apos;t able to connect last time. You can try again.
                      </p>
                      <ConnectionRequestForm mentorId={m.userId} />
                    </div>
                  )}
                  {connection?.status === CONNECTION_STATUS.ENDED && (
                    <p className="text-sm text-ink-muted">This connection has ended.</p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </AuthShell>
  );
}

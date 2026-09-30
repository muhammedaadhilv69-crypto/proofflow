import { getAuthenticatedContext } from "@/lib/authz";
import { listInvitations, listMembers } from "@/lib/team";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkspaceSettingsForm } from "@/components/workspace-settings-form";
import { InviteMemberForm } from "@/components/invite-member-form";
import { TeamManager } from "@/components/team-manager";

function invitationStatus(invitation: {
  accepted_at: string | null;
  revoked_at: string | null;
  expires_at: string;
}): "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED" {
  if (invitation.accepted_at) return "ACCEPTED";
  if (invitation.revoked_at) return "REVOKED";
  if (new Date(invitation.expires_at) <= new Date()) return "EXPIRED";
  return "PENDING";
}

export default async function SettingsPage() {
  const context = await getAuthenticatedContext();
  if (!context) return null;

  const canManage = context.role === "OWNER";
  const [members, invitations] = await Promise.all([
    listMembers(context),
    listInvitations(context),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Account</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workspace</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkspaceSettingsForm
            workspaceId={context.workspaceId}
            name={context.workspace.name}
            canEdit={canManage}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {canManage ? (
            <InviteMemberForm workspaceId={context.workspaceId} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Only the workspace owner can invite teammates.
            </p>
          )}

          <TeamManager
            workspaceId={context.workspaceId}
            canManage={canManage}
            members={members.map((member) => ({
              userId: member.user_id,
              email: member.email,
              fullName: member.full_name,
              role: member.role,
              joinedAt: member.created_at,
              isSelf: member.user_id === context.user.id,
            }))}
            invitations={invitations.map((invitation) => ({
              id: invitation.id,
              email: invitation.email,
              expiresAt: invitation.expires_at,
              status: invitationStatus(invitation),
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Email</dt>
              <dd>{context.user.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Role</dt>
              <dd>{context.role.toLowerCase()}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

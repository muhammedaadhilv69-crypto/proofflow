import { requireAuthenticatedContext } from "@/lib/authz";
import { listInvitations, listMembers } from "@/lib/team";
import { ROUTES } from "@/lib/routes";
import { formatDateSlug } from "@/lib/utils";
import { roleLabel } from "@/lib/status";
import { PageHeader } from "@/components/page-header";
import { Plate, PlateBody, PlateHeader, PlateTitle } from "@/components/ui/plate";
import { EmptyNote } from "@/components/empty-state";
import { WorkspaceSettingsForm } from "@/components/workspace-settings-form";
import { InviteMemberForm } from "@/components/invite-member-form";
import { TeamManager } from "@/components/team-manager";
import { ThemePicker } from "@/components/theme-toggle";

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

/**
 * Settings.
 *
 * The account panel comes first even though it is the smallest, because it is
 * the thing a signed-in person is most often looking for and it costs them
 * nothing to read. Appearance sits inside that panel rather than beside it,
 * because it is the other half of the same question — who is this and how do you
 * want to look. Workspace and team follow.
 */
export default async function SettingsPage() {
  const context = await requireAuthenticatedContext();
  const canManage = context.role === "OWNER";

  const [members, invitations] = await Promise.all([
    listMembers(context),
    listInvitations(context),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        path={[
          { label: "Workspace", href: ROUTES.dashboard },
          { label: "Settings" },
        ]}
        title="Settings"
        slug={[
          { key: "workspace", value: context.workspace.name },
          { key: "your role", value: roleLabel(context.role) },
        ]}
      />

      <Plate>
        <PlateHeader>
          <PlateTitle>Your account</PlateTitle>
        </PlateHeader>
        <PlateBody>
          <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-[8rem_1fr]">
            <dt className="slug-key pt-0.5">email</dt>
            <dd className="font-mono text-sm text-ink">
              {context.user.email ?? "Not set"}
            </dd>
            <dt className="slug-key pt-0.5">role</dt>
            <dd className="text-sm text-ink-soft">
              {roleLabel(context.role)}
              {context.role === "OWNER"
                ? " — you can manage the workspace and invite teammates."
                : " — you can manage projects, deliverables, and versions."}
            </dd>
            <dt className="slug-key pt-0.5">member since</dt>
            <dd className="font-mono text-sm tabular-nums text-ink-soft">
              {formatDateSlug(
                members.find((member) => member.user_id === context.user.id)
                  ?.created_at ?? context.user.created_at,
              )}
            </dd>
          </dl>
          {/*
            A rule, then the appearance control, on the same key/value baseline as
            the facts above rather than in a panel of its own. Three lines of slug
            and one row of pills is a settings row; a second plate with a heading
            and a description would be a second thing to read.
          */}
          <div className="mt-6 border-t border-rule/70 pt-5">
            <ThemePicker />
          </div>
          {!canManage ? (
            <p className="mt-4">
              <EmptyNote>
                Only the workspace owner can rename the workspace, invite
                teammates, or change roles.
              </EmptyNote>
            </p>
          ) : null}
        </PlateBody>
      </Plate>

      <Plate>
        <PlateHeader>
          <PlateTitle>Workspace</PlateTitle>
          <span className="slug">{context.workspace.slug}</span>
        </PlateHeader>
        <PlateBody>
          <WorkspaceSettingsForm
            workspaceId={context.workspaceId}
            name={context.workspace.name}
            canEdit={canManage}
          />
        </PlateBody>
      </Plate>

      <Plate>
        <PlateHeader>
          <PlateTitle>Team</PlateTitle>
          <span className="slug">
            {members.length} {members.length === 1 ? "member" : "members"}
          </span>
        </PlateHeader>
        <PlateBody className="space-y-8">
          {canManage ? (
            <InviteMemberForm workspaceId={context.workspaceId} />
          ) : null}
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
        </PlateBody>
      </Plate>
    </div>
  );
}
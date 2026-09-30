import type { AuthenticatedContext } from "@/lib/authz";
import { getAuthenticatedContext } from "@/lib/authz";
import { hashReviewToken } from "@/lib/tokens";

export type WorkspaceMemberRecord = {
  id: string;
  user_id: string;
  role: "OWNER" | "MEMBER";
  created_at: string;
  email: string;
  full_name: string | null;
};

export type WorkspaceInvitationRecord = {
  id: string;
  workspace_id: string;
  email: string;
  role: "MEMBER";
  invited_by: string;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

function assertData<T>(data: T | null, error: { message: string } | null, message: string): T {
  if (error || data === null) throw new Error(error?.message || message);
  return data;
}

function errorMessage(error: { message: string } | null, fallback: string) {
  return error?.message || fallback;
}

export async function listMembers(context: AuthenticatedContext) {
  const { data, error } = await context.admin
    .from("workspace_members")
    .select("id, user_id, role, created_at")
    .eq("workspace_id", context.workspaceId)
    .order("created_at", { ascending: true });

  const members = assertData(
    (data ?? []) as Omit<WorkspaceMemberRecord, "email" | "full_name">[],
    error,
    "Could not load members",
  );

  const userIds = members.map((member) => member.user_id);
  const { data: users } = userIds.length
    ? await context.admin
        .from("users")
        .select("id, email, full_name")
        .in("id", userIds)
    : { data: [] };

  const userMap = new Map(
    ((users ?? []) as { id: string; email: string; full_name: string | null }[]).map(
      (user) => [user.id, user],
    ),
  );

  return members.map(
    (member): WorkspaceMemberRecord => ({
      ...member,
      email: userMap.get(member.user_id)?.email ?? "",
      full_name: userMap.get(member.user_id)?.full_name ?? null,
    }),
  );
}

export async function listInvitations(context: AuthenticatedContext) {
  const { data, error } = await context.admin
    .from("workspace_invitations")
    .select(
      "id, workspace_id, email, role, invited_by, expires_at, accepted_at, revoked_at, created_at",
    )
    .eq("workspace_id", context.workspaceId)
    .order("created_at", { ascending: false });

  return assertData(
    (data ?? []) as WorkspaceInvitationRecord[],
    error,
    "Could not load invitations",
  );
}

export async function createInvitation(
  context: AuthenticatedContext,
  email: string,
) {
  const { data, error } = await context.supabase.rpc(
    "create_workspace_invitation",
    { p_workspace_id: context.workspaceId, p_email: email },
  );

  if (error) return { ok: false as const, error: errorMessage(error, "Invitation could not be created") };
  return { ok: true as const, invitation: data as { token: string; email: string; workspace_name: string; expires_at: string } };
}

export async function revokeInvitation(
  context: AuthenticatedContext,
  invitationId: string,
) {
  const { error } = await context.supabase.rpc("revoke_workspace_invitation", {
    p_workspace_id: context.workspaceId,
    p_invitation_id: invitationId,
  });
  if (error)
    return { ok: false as const, error: errorMessage(error, "Invitation could not be revoked") };
  return { ok: true as const };
}

export async function updateMemberRole(
  context: AuthenticatedContext,
  userId: string,
  role: "OWNER" | "MEMBER",
) {
  const { error } = await context.supabase.rpc("update_workspace_member_role", {
    p_workspace_id: context.workspaceId,
    p_user_id: userId,
    p_role: role,
  });
  if (error)
    return { ok: false as const, error: errorMessage(error, "Role could not be updated") };
  return { ok: true as const };
}

export async function removeMember(
  context: AuthenticatedContext,
  userId: string,
) {
  const { error } = await context.supabase.rpc("remove_workspace_member", {
    p_workspace_id: context.workspaceId,
    p_user_id: userId,
  });
  if (error)
    return { ok: false as const, error: errorMessage(error, "Member could not be removed") };
  return { ok: true as const };
}

/**
 * Accepts an invitation for the signed-in user. The SQL function verifies that
 * the caller's account email matches the address the invitation was sent to.
 */
export async function acceptInvitation(token: string) {
  const context = await getAuthenticatedContext();
  if (!context) return { ok: false as const, error: "Sign in to accept this invitation" };

  const { data, error } = await context.supabase.rpc(
    "accept_workspace_invitation",
    { p_token: token },
  );
  if (error)
    return { ok: false as const, error: errorMessage(error, "This invitation is no longer valid") };

  return {
    ok: true as const,
    workspace: data as { workspace_id: string; workspace_name: string; role: "OWNER" | "MEMBER" },
  };
}

export type InvitationPreview = {
  email: string;
  workspaceName: string;
  expiresAt: string;
  isValid: boolean;
};

/**
 * Shows the invitee who issued the invitation before they commit to signing in.
 * Reads through the service client because the row is only selectable by
 * workspace owners, and no raw token is ever exposed.
 */
export async function previewInvitation(
  token: string,
): Promise<InvitationPreview | null> {
  if (!token || token.length > 256) return null;

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("workspace_invitations")
    .select("email, workspace_id, expires_at, accepted_at, revoked_at")
    .eq("token_hash", hashReviewToken(token))
    .maybeSingle();

  if (error || !data) return null;

  const row = data as {
    email: string;
    workspace_id: string;
    expires_at: string;
    accepted_at: string | null;
    revoked_at: string | null;
  };

  const { data: workspace } = await admin
    .from("workspaces")
    .select("name")
    .eq("id", row.workspace_id)
    .maybeSingle();

  const isValid =
    !row.revoked_at &&
    !row.accepted_at &&
    new Date(row.expires_at) > new Date();

  return {
    email: row.email,
    workspaceName:
      (workspace as { name: string } | null)?.name ?? "this workspace",
    expiresAt: row.expires_at,
    isValid,
  };
}

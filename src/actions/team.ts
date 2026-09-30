"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getAuthenticatedContext, getUserName } from "@/lib/authz";
import { sendWorkspaceInviteEmail } from "@/lib/email";
import { inviteSchema, memberRoleSchema, uuidSchema } from "@/lib/validation";
import { requireAppUrl } from "@/lib/app-url";
import { ROUTES, invitePath } from "@/lib/routes";
import {
  buildRateLimitKey,
  checkRateLimit,
  clientIpFromHeaders,
  decide,
  fromRequest,
} from "@/lib/rate-limit";
import {
  acceptInvitation,
  createInvitation,
  removeMember,
  revokeInvitation,
  updateMemberRole,
} from "@/lib/team";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export type TeamActionResult = {
  success: boolean;
  message?: string;
  error?: string;
  /** Set when the invitation was created but could not be emailed. */
  inviteUrl?: string | null;
};

function failure(error: string): TeamActionResult {
  return { success: false, error };
}

function success(message: string, extra: Partial<TeamActionResult> = {}): TeamActionResult {
  return { success: true, message, ...extra };
}

export async function inviteMemberAction(
  formData: FormData,
): Promise<TeamActionResult> {
  const parsed = inviteSchema.safeParse({ email: text(formData, "email") });
  if (!parsed.success)
    return failure(parsed.error.issues[0]?.message || "Check the email address");

  const context = await getAuthenticatedContext(text(formData, "workspaceId"));
  if (!context) return failure("You must be signed in");
  if (context.role !== "OWNER")
    return failure("Only workspace owners can invite teammates");

  if (context.user.email?.toLowerCase() === parsed.data.email)
    return failure("You are already a member of this workspace");

  const ip = clientIpFromHeaders(await headers());
  // An unresolvable address is not bucketed at all: a per-address limit is
  // meaningless without an address, and a placeholder would be one shared
  // ceiling any single owner could exhaust on everyone else's behalf. The owner
  // check above is the real control.
  if (ip !== null) {
    const decision = await checkRateLimit(
      buildRateLimitKey("team", "invite", fromRequest(ip)),
      20,
      60 * 60_000,
    );
    // Distinguished from a real quota because the limiter being down is an
    // operator problem, and telling the caller they sent too many invitations
    // sends them to debug the wrong thing during exactly the incident where the
    // database is already broken.
    if (decision === "unavailable")
      return failure("Invitations are temporarily unavailable. Try again shortly.");
    if (!decide(decision))
      return failure("Too many invitations sent. Try again later.");
  }

  const created = await createInvitation(context, parsed.data.email);
  if (!created.ok) return failure(created.error);

  const inviteUrl = `${requireAppUrl()}${invitePath(created.invitation.token)}`;
  const emailResult = await sendWorkspaceInviteEmail({
    to: created.invitation.email,
    inviterName: getUserName(context.user),
    workspaceName: created.invitation.workspace_name,
    inviteUrl,
  });

  revalidatePath(ROUTES.settings);
  return success(
    emailResult.sent
      ? `Invitation sent to ${created.invitation.email}`
      : "Invitation created, but the email could not be sent",
    { inviteUrl: emailResult.sent ? null : inviteUrl },
  );
}

export async function revokeInvitationAction(
  formData: FormData,
): Promise<TeamActionResult> {
  const invitationId = uuidSchema.safeParse(text(formData, "invitationId"));
  if (!invitationId.success) return failure("Invitation not found");

  const context = await getAuthenticatedContext(text(formData, "workspaceId"));
  if (!context) return failure("You must be signed in");
  if (context.role !== "OWNER")
    return failure("Only workspace owners can revoke invitations");

  const revoked = await revokeInvitation(context, invitationId.data);
  if (!revoked.ok) return failure(revoked.error);

  revalidatePath(ROUTES.settings);
  return success("Invitation revoked");
}

export async function updateMemberRoleAction(
  formData: FormData,
): Promise<TeamActionResult> {
  const userId = uuidSchema.safeParse(text(formData, "userId"));
  const role = memberRoleSchema.safeParse({ role: text(formData, "role") });
  if (!userId.success || !role.success) return failure("Invalid role change");

  const context = await getAuthenticatedContext(text(formData, "workspaceId"));
  if (!context) return failure("You must be signed in");
  if (context.role !== "OWNER")
    return failure("Only workspace owners can change roles");

  const updated = await updateMemberRole(context, userId.data, role.data.role);
  if (!updated.ok) return failure(updated.error);

  revalidatePath(ROUTES.settings);
  return success(
    role.data.role === "OWNER" ? "Promoted to owner" : "Changed to member",
  );
}

export async function removeMemberAction(
  formData: FormData,
): Promise<TeamActionResult> {
  const userId = uuidSchema.safeParse(text(formData, "userId"));
  if (!userId.success) return failure("Member not found");

  const context = await getAuthenticatedContext(text(formData, "workspaceId"));
  if (!context) return failure("You must be signed in");

  const removed = await removeMember(context, userId.data);
  if (!removed.ok) return failure(removed.error);

  revalidatePath(ROUTES.settings);
  revalidatePath(ROUTES.dashboard);
  return success("Member removed");
}

export async function acceptInvitationAction(
  formData: FormData,
): Promise<TeamActionResult> {
  const token = text(formData, "token").trim();
  if (!token || token.length > 256) return failure("This invitation link is invalid");

  const result = await acceptInvitation(token);
  if (!result.ok) return failure(result.error);

  revalidatePath(ROUTES.dashboard);
  revalidatePath(ROUTES.settings);
  return success(`You joined ${result.workspace.workspace_name}`);
}

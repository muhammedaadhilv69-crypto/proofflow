import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROUTES } from "@/lib/routes";

export type WorkspaceRole = "OWNER" | "MEMBER";

export type AuthenticatedContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  admin: ReturnType<typeof createAdminClient>;
  user: User;
  workspaceId: string;
  workspace: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
  };
  role: WorkspaceRole;
};

export async function getAuthenticatedContext(workspaceId?: string) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) return null;

  const user = userData.user;
  let membershipQuery = supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1);

  if (workspaceId)
    membershipQuery = membershipQuery.eq("workspace_id", workspaceId);

  const { data: membershipData, error: membershipError } =
    await membershipQuery;
  if (membershipError) throw new Error("Could not verify workspace membership");

  let membership = membershipData?.[0] as
    | { workspace_id: string; role: WorkspaceRole }
    | undefined;
  const admin = createAdminClient();

  if (!membership) {
    const fullName =
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : user.email?.split("@")[0] || "New workspace";
    const { error: provisionError } = await admin.rpc(
      "ensure_workspace_for_user",
      {
        p_user_id: user.id,
        p_workspace_name: `${fullName}'s workspace`,
      },
    );
    if (provisionError) return null;

    const { data: refreshedMembership, error: refreshedError } = await supabase
      .from("workspace_members")
      .select("workspace_id, role")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1);
    if (refreshedError) throw new Error("Could not load workspace membership");
    membership = refreshedMembership?.[0] as
      | { workspace_id: string; role: WorkspaceRole }
      | undefined;
  }

  if (!membership) return null;

  const { data: workspaceData, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id, name, slug, logo_url")
    .eq("id", membership.workspace_id)
    .single();
  if (workspaceError || !workspaceData) return null;

  return {
    supabase,
    admin,
    user,
    workspaceId: membership.workspace_id,
    workspace: workspaceData as AuthenticatedContext["workspace"],
    role: membership.role,
  } satisfies AuthenticatedContext;
}

export async function requireAuthenticatedContext(workspaceId?: string) {
  const context = await getAuthenticatedContext(workspaceId);
  if (!context) redirect(ROUTES.login);
  return context;
}

export async function requireWorkspaceMember(workspaceId: string) {
  const context = await getAuthenticatedContext(workspaceId);
  if (!context || context.workspaceId !== workspaceId)
    redirect(ROUTES.dashboard);
  return context;
}

export function getUserName(user: {
  user_metadata?: Record<string, unknown>;
  email?: string | null;
}) {
  const metadataName = user.user_metadata?.full_name;
  return typeof metadataName === "string" && metadataName.trim()
    ? metadataName.trim()
    : user.email?.split("@")[0] || "Agency member";
}

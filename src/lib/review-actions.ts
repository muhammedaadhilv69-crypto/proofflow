import { createAdminClient } from "@/lib/supabase/admin";
import { sendAgencyNotificationEmail } from "@/lib/email";
import { getAppUrl } from "@/lib/app-url";

export async function notifyAgencyOfClientEvent(input: {
  versionId: string;
  message: string;
  subject: string;
}) {
  const admin = createAdminClient();
  const { data: version } = await admin
    .from("versions")
    .select("workspace_id, project_id, deliverable_id")
    .eq("id", input.versionId)
    .maybeSingle();
  if (!version) return;
  const [{ data: project }, { data: deliverable }, { data: members }] =
    await Promise.all([
      admin
        .from("projects")
        .select("name")
        .eq("id", version.project_id)
        .maybeSingle(),
      admin
        .from("deliverables")
        .select("name")
        .eq("id", version.deliverable_id)
        .maybeSingle(),
      admin
        .from("workspace_members")
        .select("user_id")
        .eq("workspace_id", version.workspace_id),
    ]);
  if (!project || !deliverable || !members) return;
  const userIds = members.map((member) => member.user_id as string);
  if (!userIds.length) return;
  const { data: users } = await admin
    .from("users")
    .select("email")
    .in("id", userIds);
  const appUrl = getAppUrl();
  await Promise.all(
    (users ?? []).map((user) =>
      sendAgencyNotificationEmail({
        to: user.email as string,
        subject: input.subject,
        message: input.message,
        projectName: project.name as string,
        deliverableName: deliverable.name as string,
        actionUrl: `${appUrl}/projects/${version.project_id}/deliverables/${version.deliverable_id}`,
      }),
    ),
  );
}

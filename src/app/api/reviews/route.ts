import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/authz";
import { sendReviewReadyEmail } from "@/lib/email";
import { trackEvent } from "@/lib/analytics";
import { isSameOrigin, readJson } from "@/lib/request-security";
import { limitAuthenticatedRequest } from "@/lib/rate-limit";
import { requireAppUrl } from "@/lib/app-url";
import { reviewPath } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request))
    return NextResponse.json(
      { error: "Invalid request origin" },
      { status: 403 },
    );
  if (!(await limitAuthenticatedRequest(request, "reviews", 20, 60_000)))
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429 },
    );
  const body = await readJson<{ workspaceId?: string; versionId?: string }>(
    request,
  );
  if (!body)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const workspaceId = body.workspaceId || "";
  const versionId = body.versionId || "";
  if (!workspaceId || !versionId)
    return NextResponse.json(
      { error: "Workspace and version are required" },
      { status: 400 },
    );

  const context = await getAuthenticatedContext(workspaceId);
  if (!context || context.workspaceId !== workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: version, error: versionError } = await context.admin
    .from("versions")
    .select("id, deliverable_id, project_id, version_number, status")
    .eq("id", versionId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (versionError || !version)
    return NextResponse.json({ error: "Version not found" }, { status: 404 });

  const { data: deliverable } = await context.admin
    .from("deliverables")
    .select("id, name, current_version_id, status, project_id")
    .eq("id", version.deliverable_id)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (
    !deliverable ||
    deliverable.current_version_id !== versionId ||
    deliverable.status !== "IN_REVIEW" ||
    version.status !== "IN_REVIEW"
  ) {
    return NextResponse.json(
      { error: "Only the current review version can be sent" },
      { status: 409 },
    );
  }

  const { data: project } = await context.admin
    .from("projects")
    .select("id, name, client_id")
    .eq("id", version.project_id)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (!project)
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  const { data: client } = await context.admin
    .from("clients")
    .select("id, name, email")
    .eq("id", project.client_id)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (!client)
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  const appUrl = requireAppUrl();

  const { data: tokenData, error: tokenError } = await context.admin.rpc(
    "create_review_token",
    {
      p_workspace_id: workspaceId,
      p_version_id: versionId,
      p_created_by: context.user.id,
    },
  );
  if (tokenError || !tokenData)
    return NextResponse.json(
      { error: tokenError?.message || "Review link could not be created" },
      { status: 409 },
    );

  const result = tokenData as { token?: string };
  if (!result.token)
    return NextResponse.json(
      { error: "Review link could not be created" },
      { status: 500 },
    );
  const reviewUrl = `${appUrl}${reviewPath(result.token)}`;
  const emailResult = await sendReviewReadyEmail({
    to: client.email,
    clientName: client.name,
    workspaceName: context.workspace.name,
    projectName: project.name,
    deliverableName: deliverable.name,
    versionNumber: version.version_number,
    reviewUrl,
  });
  await trackEvent("review_link_created", {
    workspace_id: workspaceId,
    version_id: versionId,
  });
  return NextResponse.json({
    success: true,
    reviewUrl,
    emailSent: emailResult.sent,
    expiresAt: (tokenData as { expires_at?: string }).expires_at ?? null,
  });
}

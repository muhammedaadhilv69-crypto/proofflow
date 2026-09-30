import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/authz";
import { commentSchema } from "@/lib/validation";
import { trackEvent } from "@/lib/analytics";
import { isSameOrigin, readJson } from "@/lib/request-security";
import { limitAuthenticatedRequest } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request))
    return NextResponse.json(
      { error: "Invalid request origin" },
      { status: 403 },
    );
  if (!(await limitAuthenticatedRequest(request, "comments", 60, 60_000)))
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429 },
    );
  const body = await readJson<{
    workspaceId?: string;
    versionId?: string;
    body?: string;
  }>(request);
  if (!body)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const parsed = commentSchema.safeParse({ body: body.body || "" });
  if (!parsed.success || !body.workspaceId || !body.versionId)
    return NextResponse.json(
      { error: "Comment, workspace, and version are required" },
      { status: 400 },
    );
  const context = await getAuthenticatedContext(body.workspaceId);
  if (!context || context.workspaceId !== body.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await context.admin.rpc("add_agency_comment", {
    p_workspace_id: body.workspaceId,
    p_version_id: body.versionId,
    p_user_id: context.user.id,
    p_body: parsed.data.body,
  });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 409 });
  await trackEvent("comment_created", {
    version_id: body.versionId,
    agency: true,
  });
  return NextResponse.json({
    success: true,
    id: (data as { id?: string } | null)?.id || null,
  });
}

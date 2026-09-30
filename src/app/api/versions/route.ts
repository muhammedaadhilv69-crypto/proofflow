import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/authz";
import { getFileExtension } from "@/lib/tokens";
import { validateFile, validateFileSignature } from "@/lib/validation";
import { trackEvent } from "@/lib/analytics";
import { isSameOrigin } from "@/lib/request-security";
import { limitAuthenticatedRequest } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request))
    return NextResponse.json(
      { error: "Invalid request origin" },
      { status: 403 },
    );
  if (!(await limitAuthenticatedRequest(request, "versions", 30, 60_000)))
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429 },
    );
  const context = await getAuthenticatedContext();
  if (!context)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 30 * 1024 * 1024)
    return NextResponse.json({ error: "Upload is too large" }, { status: 413 });
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }
  const workspaceId =
    typeof formData.get("workspaceId") === "string"
      ? String(formData.get("workspaceId"))
      : "";
  const deliverableId =
    typeof formData.get("deliverableId") === "string"
      ? String(formData.get("deliverableId"))
      : "";
  const fileValue = formData.get("file");
  const description =
    typeof formData.get("description") === "string"
      ? String(formData.get("description"))
      : "";

  if (description.length > 2000)
    return NextResponse.json(
      { error: "Description is too long" },
      { status: 400 },
    );
  if (!workspaceId || !deliverableId || !(fileValue instanceof File)) {
    return NextResponse.json(
      { error: "Workspace, deliverable, and file are required" },
      { status: 400 },
    );
  }

  const fileResult = validateFile(fileValue);
  if (!fileResult.valid)
    return NextResponse.json({ error: fileResult.error }, { status: 400 });
  const signatureResult = await validateFileSignature(fileValue);
  if (!signatureResult.valid)
    return NextResponse.json({ error: signatureResult.error }, { status: 400 });

  if (context.workspaceId !== workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: deliverableData, error: deliverableError } = await context.admin
    .from("deliverables")
    .select("id, project_id, workspace_id")
    .eq("id", deliverableId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (deliverableError || !deliverableData)
    return NextResponse.json(
      { error: "Deliverable not found" },
      { status: 404 },
    );

  const versionId = randomUUID();
  const fileId = randomUUID();
  const projectId = String(deliverableData.project_id);
  const extension = getFileExtension(fileValue.type);
  const storagePath = `workspace/${workspaceId}/project/${projectId}/deliverable/${deliverableId}/version/${versionId}/file.${extension}`;
  const buffer = Buffer.from(await fileValue.arrayBuffer());
  const upload = await context.admin.storage
    .from("proofflow-files")
    .upload(storagePath, buffer, {
      contentType: fileValue.type,
      upsert: false,
    });
  if (upload.error)
    return NextResponse.json({ error: "File upload failed" }, { status: 502 });

  const { data: versionData, error: versionError } = await context.admin.rpc(
    "create_version",
    {
      p_workspace_id: workspaceId,
      p_project_id: projectId,
      p_deliverable_id: deliverableId,
      p_version_id: versionId,
      p_file_id: fileId,
      p_storage_path: storagePath,
      p_original_filename: fileValue.name,
      p_mime_type: fileValue.type,
      p_size_bytes: fileValue.size,
      p_description: description,
      p_uploaded_by: context.user.id,
    },
  );

  if (versionError) {
    const { data: committedVersion, error: committedLookupError } =
      await context.admin
        .from("versions")
        .select("version_number")
        .eq("id", versionId)
        .eq("workspace_id", workspaceId)
        .maybeSingle();
    if (committedVersion) {
      await trackEvent("version_uploaded", {
        workspace_id: workspaceId,
        deliverable_id: deliverableId,
        version_id: versionId,
      });
      return NextResponse.json({
        success: true,
        versionId,
        versionNumber: committedVersion.version_number,
      });
    }
    if (committedLookupError)
      return NextResponse.json(
        {
          error:
            "Upload state is uncertain. Refresh the deliverable before retrying.",
        },
        { status: 503 },
      );
    await context.admin.storage.from("proofflow-files").remove([storagePath]);
    return NextResponse.json(
      { error: versionError.message || "Version could not be created" },
      { status: 409 },
    );
  }

  const result = versionData as { version_number?: number } | null;
  await trackEvent("version_uploaded", {
    workspace_id: workspaceId,
    deliverable_id: deliverableId,
    version_id: versionId,
  });
  return NextResponse.json({
    success: true,
    versionId,
    versionNumber: result?.version_number ?? null,
  });
}

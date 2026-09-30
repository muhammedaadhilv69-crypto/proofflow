import type { AuthenticatedContext } from "@/lib/authz";
import { hashReviewToken } from "@/lib/tokens";
import { formatDateTime } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

export type ClientRecord = {
  id: string;
  workspace_id: string;
  name: string;
  email: string;
  company: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectRecord = {
  id: string;
  workspace_id: string;
  client_id: string;
  name: string;
  description: string | null;
  status: "ACTIVE" | "COMPLETED" | "ARCHIVED";
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export type DeliverableRecord = {
  id: string;
  workspace_id: string;
  project_id: string;
  name: string;
  description: string | null;
  status: "DRAFT" | "IN_REVIEW" | "CHANGES_REQUESTED" | "APPROVED" | "ARCHIVED";
  current_version_id: string | null;
  created_at: string;
  updated_at: string;
};

export type FileRecord = {
  id: string;
  workspace_id: string;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

export type VersionRecord = {
  id: string;
  workspace_id: string;
  project_id: string;
  deliverable_id: string;
  version_number: number;
  file_id: string;
  description: string | null;
  uploaded_by: string;
  status: "IN_REVIEW" | "APPROVED" | "LOCKED";
  locked_at: string | null;
  created_at: string;
  file?: FileRecord;
  approval?: ApprovalRecord;
  comments?: CommentRecord[];
  reviewUrl?: string | null;
};

export type CommentRecord = {
  id: string;
  workspace_id: string;
  version_id: string;
  author_user_id: string | null;
  author_type: "AGENCY" | "CLIENT";
  author_name: string;
  author_email: string;
  body: string;
  comment_type: "COMMENT" | "CHANGE_REQUEST";
  created_at: string;
};

export type ApprovalRecord = {
  id: string;
  workspace_id: string;
  project_id: string;
  deliverable_id: string;
  version_id: string;
  client_id: string;
  client_name: string;
  client_email: string;
  approved_at: string;
  approval_number: string;
  status: "APPROVED";
  created_at: string;
};

export type ActivityRecord = {
  id: string;
  workspace_id: string;
  project_id: string | null;
  deliverable_id: string | null;
  version_id: string | null;
  actor_type: "AGENCY" | "CLIENT";
  actor_id: string;
  event_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type NotificationRecord = {
  id: string;
  workspace_id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
};

function assertData<T>(
  data: T | null,
  error: { message: string } | null,
  message: string,
): T {
  if (error || data === null) throw new Error(error?.message || message);
  return data;
}

export async function listClients(context: AuthenticatedContext) {
  const { data, error } = await context.admin
    .from("clients")
    .select("*")
    .eq("workspace_id", context.workspaceId)
    .order("name", { ascending: true });
  return assertData(
    (data ?? []) as ClientRecord[],
    error,
    "Could not load clients",
  );
}

export async function getClient(
  context: AuthenticatedContext,
  clientId: string,
) {
  const { data, error } = await context.admin
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .eq("workspace_id", context.workspaceId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as ClientRecord | null;
}

export async function listProjects(context: AuthenticatedContext) {
  const [projects, clients] = await Promise.all([
    context.admin
      .from("projects")
      .select("*")
      .eq("workspace_id", context.workspaceId)
      .order("updated_at", { ascending: false }),
    listClients(context),
  ]);
  const projectRows = assertData(
    (projects.data ?? []) as ProjectRecord[],
    projects.error,
    "Could not load projects",
  );
  const clientMap = new Map(clients.map((client) => [client.id, client]));
  return projectRows.map((project) => ({
    ...project,
    client: clientMap.get(project.client_id) ?? null,
  }));
}

export async function getProject(
  context: AuthenticatedContext,
  projectId: string,
) {
  const { data: projectData, error: projectError } = await context.admin
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("workspace_id", context.workspaceId)
    .maybeSingle();
  if (projectError) throw new Error(projectError.message);
  if (!projectData) return null;
  const project = projectData as ProjectRecord;
  const [client, deliverablesResult, activityResult] = await Promise.all([
    getClient(context, project.client_id),
    context.admin
      .from("deliverables")
      .select("*")
      .eq("project_id", project.id)
      .eq("workspace_id", context.workspaceId)
      .order("updated_at", { ascending: false }),
    context.admin
      .from("activity_events")
      .select("*")
      .eq("project_id", project.id)
      .eq("workspace_id", context.workspaceId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  return {
    project,
    client,
    deliverables: (deliverablesResult.data ?? []) as DeliverableRecord[],
    activity: (activityResult.data ?? []) as ActivityRecord[],
  };
}

export async function getDeliverable(
  context: AuthenticatedContext,
  deliverableId: string,
) {
  const { data: deliverableData, error: deliverableError } = await context.admin
    .from("deliverables")
    .select("*")
    .eq("id", deliverableId)
    .eq("workspace_id", context.workspaceId)
    .maybeSingle();
  if (deliverableError) throw new Error(deliverableError.message);
  if (!deliverableData) return null;

  const deliverable = deliverableData as DeliverableRecord;
  const [projectResult, versionsResult, approvalsResult, activityResult] =
    await Promise.all([
      context.admin
        .from("projects")
        .select("*")
        .eq("id", deliverable.project_id)
        .eq("workspace_id", context.workspaceId)
        .maybeSingle(),
      context.admin
        .from("versions")
        .select("*")
        .eq("deliverable_id", deliverable.id)
        .eq("workspace_id", context.workspaceId)
        .order("version_number", { ascending: false }),
      context.admin
        .from("approval_records")
        .select("*")
        .eq("deliverable_id", deliverable.id)
        .eq("workspace_id", context.workspaceId)
        .order("approved_at", { ascending: false }),
      context.admin
        .from("activity_events")
        .select("*")
        .eq("deliverable_id", deliverable.id)
        .eq("workspace_id", context.workspaceId)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

  const project = projectResult.data as ProjectRecord | null;
  const client = project ? await getClient(context, project.client_id) : null;
  const versionRows = (versionsResult.data ?? []) as VersionRecord[];
  const versionIds = versionRows.map((version) => version.id);
  const fileIds = versionRows.map((version) => version.file_id);
  const [filesResult, allCommentsResult] = await Promise.all([
    fileIds.length
      ? context.admin.from("files").select("*").in("id", fileIds)
      : Promise.resolve({ data: [], error: null }),
    versionIds.length
      ? context.admin
          .from("comments")
          .select("*")
          .in("version_id", versionIds)
          .eq("workspace_id", context.workspaceId)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);
  const fileMap = new Map(
    ((filesResult.data ?? []) as FileRecord[]).map((file) => [file.id, file]),
  );
  const commentMap = new Map<string, CommentRecord[]>();
  for (const comment of (allCommentsResult.data ?? []) as CommentRecord[]) {
    const list = commentMap.get(comment.version_id) ?? [];
    list.push(comment);
    commentMap.set(comment.version_id, list);
  }
  const approvalMap = new Map(
    ((approvalsResult.data ?? []) as ApprovalRecord[]).map((approval) => [
      approval.version_id,
      approval,
    ]),
  );
  const versions = versionRows.map((version) => ({
    ...version,
    file: fileMap.get(version.file_id),
    approval: approvalMap.get(version.id),
    comments: commentMap.get(version.id) ?? [],
    reviewUrl: null,
  }));

  return {
    deliverable,
    project,
    client,
    versions,
    activity: (activityResult.data ?? []) as ActivityRecord[],
  };
}

export async function getDashboardData(context: AuthenticatedContext) {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const [
    activeProjects,
    awaitingClient,
    changesRequested,
    approvedThisWeek,
    deliverablesResult,
    projectsResult,
    clientsResult,
  ] = await Promise.all([
    context.admin
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", context.workspaceId)
      .eq("status", "ACTIVE"),
    context.admin
      .from("deliverables")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", context.workspaceId)
      .eq("status", "IN_REVIEW"),
    context.admin
      .from("deliverables")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", context.workspaceId)
      .eq("status", "CHANGES_REQUESTED"),
    context.admin
      .from("approval_records")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", context.workspaceId)
      .gte("approved_at", weekStart.toISOString()),
    context.admin
      .from("deliverables")
      .select("*")
      .eq("workspace_id", context.workspaceId)
      .in("status", ["DRAFT", "IN_REVIEW", "CHANGES_REQUESTED", "APPROVED"])
      .order("updated_at", { ascending: false })
      .limit(8),
    context.admin
      .from("projects")
      .select("*")
      .eq("workspace_id", context.workspaceId)
      .order("updated_at", { ascending: false })
      .limit(100),
    listClients(context),
  ]);
  const deliverables = (deliverablesResult.data ?? []) as DeliverableRecord[];
  const projects = (projectsResult.data ?? []) as ProjectRecord[];
  const clientMap = new Map(clientsResult.map((client) => [client.id, client]));
  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const needsAttention = deliverables
    .filter((deliverable) =>
      ["DRAFT", "IN_REVIEW", "CHANGES_REQUESTED"].includes(deliverable.status),
    )
    .map((deliverable) => {
      const project = projectMap.get(deliverable.project_id);
      return {
        deliverable,
        project: project ?? null,
        client: project ? (clientMap.get(project.client_id) ?? null) : null,
      };
    })
    .filter((item) => item.project)
    .slice(0, 5);
  const recentProjects = projects
    .slice(0, 5)
    .map((project) => ({
      project,
      client: clientMap.get(project.client_id) ?? null,
    }));

  return {
    metrics: {
      activeProjects: activeProjects.count ?? 0,
      awaitingClient: awaitingClient.count ?? 0,
      changesRequested: changesRequested.count ?? 0,
      approvedThisWeek: approvedThisWeek.count ?? 0,
    },
    needsAttention,
    recentProjects,
  };
}

export async function listActivity(context: AuthenticatedContext) {
  const { data, error } = await context.admin
    .from("activity_events")
    .select("*")
    .eq("workspace_id", context.workspaceId)
    .order("created_at", { ascending: false })
    .limit(100);
  return assertData(
    (data ?? []) as ActivityRecord[],
    error,
    "Could not load activity",
  );
}

export async function listNotifications(context: AuthenticatedContext) {
  const { data, error } = await context.admin
    .from("notifications")
    .select("*")
    .eq("workspace_id", context.workspaceId)
    .eq("user_id", context.user.id)
    .order("created_at", { ascending: false })
    .limit(20);
  return assertData(
    (data ?? []) as NotificationRecord[],
    error,
    "Could not load notifications",
  );
}

export type PublicComment = Pick<
  CommentRecord,
  "id" | "author_name" | "author_type" | "comment_type" | "created_at" | "body"
>;
export type PublicApproval = Pick<
  ApprovalRecord,
  "approval_number" | "client_name" | "client_email" | "approved_at" | "status"
>;
export type PublicVersion = {
  version_number: number;
  description: string | null;
  status: VersionRecord["status"];
  file?: Pick<FileRecord, "original_filename" | "mime_type">;
  approval?: PublicApproval;
  comments: PublicComment[];
};
export type ReviewData = {
  token: string;
  version: PublicVersion;
  deliverable: Pick<DeliverableRecord, "name" | "status">;
  project: Pick<ProjectRecord, "name">;
  client: Pick<ClientRecord, "name" | "email">;
  comments: PublicComment[];
  approval: PublicApproval | null;
  signedFileUrl: string | null;
  isCurrent: boolean;
  canAct: boolean;
  unavailableReason: string | null;
};

export async function getReviewByToken(
  token: string,
): Promise<{ data: ReviewData | null; error: string | null }> {
  if (!token || token.length > 256)
    return { data: null, error: "Review link is invalid" };
  const tokenHash = hashReviewToken(token);
  const admin = (await import("@/lib/supabase/admin")).createAdminClient();
  const { data: tokenData, error: tokenError } = await admin
    .from("review_tokens")
    .select("*")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (tokenError)
    return { data: null, error: "Review link could not be loaded" };
  if (!tokenData) return { data: null, error: "Review link is invalid" };
  const reviewToken = tokenData as {
    id: string;
    version_id: string;
    client_id: string;
    client_name: string;
    client_email: string;
    expires_at: string | null;
    revoked_at: string | null;
  };
  if (reviewToken.revoked_at)
    return { data: null, error: "Review link has been revoked" };
  if (reviewToken.expires_at && new Date(reviewToken.expires_at) <= new Date())
    return { data: null, error: "Review link has expired" };

  const { data: versionData, error: versionError } = await admin
    .from("versions")
    .select("*")
    .eq("id", reviewToken.version_id)
    .maybeSingle();
  if (versionError || !versionData)
    return { data: null, error: "Version is no longer available" };
  const version = versionData as VersionRecord;
  const [
    deliverableResult,
    projectResult,
    commentsResult,
    approvalResult,
    fileResult,
  ] = await Promise.all([
    admin
      .from("deliverables")
      .select("*")
      .eq("id", version.deliverable_id)
      .maybeSingle(),
    admin
      .from("projects")
      .select("*")
      .eq("id", version.project_id)
      .maybeSingle(),
    admin
      .from("comments")
      .select("*")
      .eq("version_id", version.id)
      .order("created_at", { ascending: true }),
    admin
      .from("approval_records")
      .select("*")
      .eq("version_id", version.id)
      .maybeSingle(),
    admin.from("files").select("*").eq("id", version.file_id).maybeSingle(),
  ]);
  if (!deliverableResult.data || !projectResult.data)
    return { data: null, error: "Review content is unavailable" };
  const deliverable = deliverableResult.data as DeliverableRecord;
  const project = projectResult.data as ProjectRecord;
  const { data: clientData } = await admin
    .from("clients")
    .select("*")
    .eq("id", reviewToken.client_id)
    .maybeSingle();
  if (!clientData)
    return { data: null, error: "Review content is unavailable" };
  const client = clientData as ClientRecord;
  const comments = (commentsResult.data ?? []) as CommentRecord[];
  const approval = (approvalResult.data as ApprovalRecord | null) ?? null;
  const file = fileResult.data as FileRecord | null;
  let signedFileUrl: string | null = null;
  if (file) {
    const signed = await admin.storage
      .from("proofflow-files")
      .createSignedUrl(file.storage_path, 900);
    signedFileUrl = signed.data?.signedUrl ?? null;
  }
  const isCurrent = deliverable.current_version_id === version.id;
  const canAct =
    isCurrent &&
    version.status === "IN_REVIEW" &&
    deliverable.status === "IN_REVIEW" &&
    !approval;
  const unavailableReason = approval
    ? "This version has already been approved"
    : !isCurrent
      ? "A newer version is available"
      : version.status !== "IN_REVIEW" || deliverable.status !== "IN_REVIEW"
        ? "This review is closed"
        : null;

  // The RPC collapses repeat opens into one event per client per version per
  // day. A review link is a bearer token, so writing a row on every render
  // inflated the timeline and grew activity_events without bound.
  const { data: recordedOpen } = await admin.rpc("record_review_opened", {
    p_version_id: version.id,
    p_actor_id: client.id,
  });
  if (recordedOpen) await trackEvent("review_opened", { version_id: version.id });

  const publicComments = comments.map((comment) => ({
    id: comment.id,
    author_name: comment.author_name,
    author_type: comment.author_type,
    comment_type: comment.comment_type,
    created_at: comment.created_at,
    body: comment.body,
  }));
  const publicApproval = approval
    ? {
        approval_number: approval.approval_number,
        client_name: approval.client_name,
        client_email: approval.client_email,
        approved_at: approval.approved_at,
        status: approval.status,
      }
    : null;
  const publicVersion: PublicVersion = {
    version_number: version.version_number,
    description: version.description,
    status: version.status,
    file: file
      ? { original_filename: file.original_filename, mime_type: file.mime_type }
      : undefined,
    approval: publicApproval ?? undefined,
    comments: publicComments,
  };

  return {
    data: {
      token,
      version: publicVersion,
      deliverable: { name: deliverable.name, status: deliverable.status },
      project: { name: project.name },
      client: {
        name: reviewToken.client_name,
        email: reviewToken.client_email,
      },
      comments: publicComments,
      approval: publicApproval,
      signedFileUrl,
      isCurrent,
      canAct,
      unavailableReason,
    },
    error: null,
  };
}

export function activityLabel(event: ActivityRecord) {
  const labels: Record<string, string> = {
    PROJECT_CREATED: "Project created",
    DELIVERABLE_CREATED: "Deliverable created",
    VERSION_UPLOADED: "Version uploaded",
    REVIEW_SENT: "Review link sent",
    REVIEW_OPENED: "Review opened",
    COMMENT_CREATED: "Comment added",
    CHANGES_REQUESTED: "Changes requested",
    APPROVAL_CREATED: "Version approved",
    MEMBER_INVITED: "Teammate invited",
    MEMBER_JOINED: "Teammate joined",
    MEMBER_REMOVED: "Teammate removed",
    MEMBER_LEFT: "Teammate left",
    MEMBER_ROLE_CHANGED: "Role updated",
  };
  return labels[event.event_type] || event.event_type;
}

export function activityDescription(event: ActivityRecord) {
  const versionNumber =
    typeof event.metadata?.version_number === "number"
      ? ` v${event.metadata.version_number}`
      : "";
  const approvalNumber =
    typeof event.metadata?.approval_number === "string"
      ? ` ${event.metadata.approval_number}`
      : "";
  return `${activityLabel(event)}${versionNumber}${approvalNumber} · ${formatDateTime(event.created_at)}`;
}

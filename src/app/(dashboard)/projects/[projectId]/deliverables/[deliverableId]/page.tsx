import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { getAuthenticatedContext } from "@/lib/authz";
import { getDeliverable } from "@/lib/data";
import { trackEvent } from "@/lib/analytics";
import { formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { ActivityTimeline } from "@/components/activity-timeline";
import { CommentItem } from "@/components/comment-item";
import { FilePreview, FileTypeLabel } from "@/components/file-preview";
import { VersionUploadForm } from "@/components/version-upload-form";
import { ReviewLinkButton } from "@/components/review-link-button";
import { AgencyCommentForm } from "@/components/agency-comment-form";

export default async function DeliverablePage({
  params,
}: {
  params: Promise<{ projectId: string; deliverableId: string }>;
}) {
  const { projectId, deliverableId } = await params;
  const context = await getAuthenticatedContext();
  if (!context) return null;
  const result = await getDeliverable(context, deliverableId);
  if (!result || result.project?.id !== projectId) notFound();
  const { deliverable, project, client, versions, activity } = result;
  if (versions.some((version) => version.approval))
    await trackEvent("approval_record_viewed", {
      workspace_id: context.workspaceId,
      deliverable_id: deliverable.id,
    });
  const fileUrls = new Map<string, string | null>();
  await Promise.all(
    versions.map(async (version) => {
      if (!version.file) return;
      const signed = await context.admin.storage
        .from("proofflow-files")
        .createSignedUrl(version.file.storage_path, 900);
      fileUrls.set(version.id, signed.data?.signedUrl ?? null);
    }),
  );
  const currentVersion =
    versions.find((version) => version.id === deliverable.current_version_id) ||
    null;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href={`/projects/${projectId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {project?.name || "Project"}
        </Link>
      </Button>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">
            {project?.name} · {client?.name}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {deliverable.name}
            </h1>
            <StatusBadge status={deliverable.status} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {deliverable.description || "No description"}
          </p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current version</CardTitle>
            </CardHeader>
            <CardContent>
              {currentVersion ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        Version {currentVersion.version_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Uploaded {formatDateTime(currentVersion.created_at)}
                      </p>
                    </div>
                    <StatusBadge
                      status={
                        currentVersion.approval
                          ? "APPROVED"
                          : currentVersion.status
                      }
                    />
                  </div>
                  {currentVersion.file ? (
                    <FilePreview
                      url={fileUrls.get(currentVersion.id) || null}
                      mimeType={currentVersion.file.mime_type}
                      filename={currentVersion.file.original_filename}
                    />
                  ) : (
                    <p className="text-sm text-destructive">
                      File is unavailable.
                    </p>
                  )}
                  {currentVersion.description ? (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Description
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm">
                        {currentVersion.description}
                      </p>
                    </div>
                  ) : null}
                  {currentVersion.status === "IN_REVIEW" &&
                  currentVersion.id === deliverable.current_version_id ? (
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <p className="text-sm font-medium">
                        Ready for client review
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Create a secure link to send this exact version to{" "}
                        {client?.name || "your client"}.
                      </p>
                      <div className="mt-3">
                        <ReviewLinkButton
                          workspaceId={context.workspaceId}
                          versionId={currentVersion.id}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Upload the first version to start a review.
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Version history</CardTitle>
            </CardHeader>
            <CardContent>
              {versions.length ? (
                <div className="space-y-6">
                  {versions.map((version) => (
                    <article key={version.id} className="rounded-lg border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h2 className="font-semibold">
                            Version {version.version_number}
                          </h2>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDateTime(version.created_at)} ·{" "}
                            {version.file ? (
                              <FileTypeLabel
                                mimeType={version.file.mime_type}
                              />
                            ) : (
                              "File unavailable"
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {version.approval ? (
                            <LockKeyhole
                              className="h-4 w-4 text-green-600"
                              aria-label="Locked"
                            />
                          ) : null}
                          <StatusBadge
                            status={
                              version.approval ? "APPROVED" : version.status
                            }
                          />
                        </div>
                      </div>
                      {version.description ? (
                        <p className="mt-3 whitespace-pre-wrap text-sm">
                          {version.description}
                        </p>
                      ) : null}
                      {version.comments?.length ? (
                        <div className="mt-4 space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">
                            Comments
                          </p>
                          {version.comments.map((comment) => (
                            <CommentItem key={comment.id} comment={comment} />
                          ))}
                        </div>
                      ) : null}
                      {version.approval ? (
                        <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                          <p className="font-semibold">
                            Approved by {version.approval.client_name}
                          </p>
                          <p className="mt-1">
                            {version.approval.client_email} ·{" "}
                            {formatDateTime(version.approval.approved_at)}
                          </p>
                          <p className="mt-1 font-mono text-xs">
                            {version.approval.approval_number}
                          </p>
                          <p className="mt-2 text-xs">
                            This version is locked because it was approved.
                          </p>
                        </div>
                      ) : null}
                      {version.id === deliverable.current_version_id &&
                      version.status === "IN_REVIEW" ? (
                        <div className="mt-4 border-t pt-4">
                          <p className="mb-2 text-xs font-medium text-muted-foreground">
                            Reply as agency
                          </p>
                          <AgencyCommentForm
                            workspaceId={context.workspaceId}
                            versionId={version.id}
                          />
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No versions uploaded yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upload version</CardTitle>
            </CardHeader>
            <CardContent>
              {deliverable.status === "ARCHIVED" ? (
                <p className="text-sm text-muted-foreground">
                  Archived deliverables cannot receive new versions.
                </p>
              ) : (
                <VersionUploadForm
                  workspaceId={context.workspaceId}
                  deliverableId={deliverable.id}
                />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityTimeline events={activity} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

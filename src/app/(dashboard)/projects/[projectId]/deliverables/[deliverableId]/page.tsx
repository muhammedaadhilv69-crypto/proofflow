import { notFound } from "next/navigation";
import { requireAuthenticatedContext } from "@/lib/authz";
import { getDeliverable } from "@/lib/data";
import { trackEvent } from "@/lib/analytics";
import { ROUTES } from "@/lib/routes";
import {
  fileTypeLabel,
  formatBytes,
  formatDateSlug,
} from "@/lib/utils";
import { versionState, type StateKey } from "@/lib/status";
import { PageHeader, Section } from "@/components/page-header";
import { StateChip } from "@/components/state-chip";
import { Plate, PlateBody, PlateHeader, PlateTitle } from "@/components/ui/plate";
import { EmptyNote } from "@/components/empty-state";
import { ActivityTimeline } from "@/components/activity-timeline";
import { FilePreview } from "@/components/file-preview";
import { VersionUploadForm } from "@/components/version-upload-form";
import { ReviewLinkButton } from "@/components/review-link-button";
import { AgencyCommentForm } from "@/components/agency-comment-form";
import { ApprovalSeal } from "@/components/approval-seal";
import { RevisionRail, type RailVersion } from "@/components/revision-rail";

export default async function DeliverablePage({
  params,
}: {
  params: Promise<{ projectId: string; deliverableId: string }>;
}) {
  const { projectId, deliverableId } = await params;
  const context = await requireAuthenticatedContext();
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
    versions.find((version) => version.id === deliverable.current_version_id) ?? null;

  const deliverableState = deliverable.status as StateKey;

  const railVersions: RailVersion[] = versions.map((version) => ({
    id: version.id,
    version_number: version.version_number,
    description: version.description,
    created_at: version.created_at,
    status: version.status,
    state: versionState(
      {
        id: version.id,
        version_number: version.version_number,
        status: version.status,
        approval: version.approval,
        comments: version.comments,
      },
      deliverable.current_version_id,
      deliverable.status,
    ),
    file: version.file
      ? {
          original_filename: version.file.original_filename,
          mime_type: version.file.mime_type,
          size_bytes: version.file.size_bytes,
        }
      : null,
    comments: version.comments ?? [],
    approval: version.approval ?? null,
  }));

  const approved = railVersions.find((version) => version.state === "APPROVED");
  const archived = deliverable.status === "ARCHIVED";
  /**
   * The link CTA appears while the live version is still in review, because
   * that is the only window in which sending it does anything. Once a version is
   * approved the version is locked and a new link would open a closed proof, so
   * the affordance is withdrawn rather than left there to fail.
   */
  const awaitingLink =
    !archived && currentVersion?.status === "IN_REVIEW" ? currentVersion : null;

  return (
    <div className="space-y-8">
      <PageHeader
        path={[
          { label: "Workspace", href: ROUTES.dashboard },
          { label: "Projects", href: ROUTES.projects },
          { label: project!.name, href: `/projects/${projectId}` },
          { label: deliverable.name },
        ]}
        title={deliverable.name}
        slug={[
          { key: "client", value: client?.name ?? "No client" },
          { key: "versions", value: versions.length },
          ...(approved
            ? [
                {
                  key: "approved",
                  value: `v${approved.version_number}`,
                  tone: "strong" as const,
                },
              ]
            : []),
        ]}
        actions={<StateChip state={deliverableState} size="large" />}
      />

      {deliverable.description ? (
        <p className="max-w-prose text-sm leading-relaxed text-ink-soft">
          {deliverable.description}
        </p>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="space-y-8">
          <Section title="Current version">
            {currentVersion ? (
              <Plate raised className="overflow-hidden">
                <PlateHeader>
                  <PlateTitle>
                    v{currentVersion.version_number}
                    {approved?.id === currentVersion.id ? (
                      <span className="ml-2 font-normal text-ink-faint">
                        approved
                      </span>
                    ) : null}
                  </PlateTitle>
                  <span className="slug">
                    {currentVersion.file
                      ? `${fileTypeLabel(currentVersion.file.mime_type)} ${formatBytes(currentVersion.file.size_bytes)}`
                      : "file unavailable"}
                  </span>
                </PlateHeader>
                <PlateBody className="space-y-4">
                  {currentVersion.file ? (
                    <FilePreview
                      url={fileUrls.get(currentVersion.id) ?? null}
                      mimeType={currentVersion.file.mime_type}
                      filename={currentVersion.file.original_filename}
                    />
                  ) : (
                    <EmptyNote>
                      This version&apos;s file could not be loaded from storage.
                      The version record and its history are unaffected.
                    </EmptyNote>
                  )}

                  {currentVersion.description ? (
                    <div>
                      <p className="slug-key">version note</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
                        {currentVersion.description}
                      </p>
                    </div>
                  ) : null}
                </PlateBody>
              </Plate>
            ) : (
              <EmptyNote>
                No version has been uploaded yet. Upload version 1 to start the
                review.
              </EmptyNote>
            )}
          </Section>

          {awaitingLink ? (
            <Plate accentTop>
              <PlateBody className="space-y-3">
                <div>
                  <h2 className="text-sm font-medium text-ink">
                    Send this version to {client?.name ?? "your client"}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                    The link opens version {awaitingLink.version_number} and
                    nothing else. Your client approves or comments without
                    creating an account.
                  </p>
                </div>
                <ReviewLinkButton
                  workspaceId={context.workspaceId}
                  versionId={awaitingLink.id}
                  clientName={client?.name}
                />
              </PlateBody>
            </Plate>
          ) : null}

          <Section
            title="Revisions"
            slug={[
              { key: "total", value: versions.length },
              ...(approved
                ? [
                    {
                      key: "approved",
                      value: `v${approved.version_number} ${formatDateSlug(approved.approval?.approved_at)}`,
                      tone: "strong" as const,
                    },
                  ]
                : []),
            ]}
          >
            {versions.length ? (
              <RevisionRail
                versions={railVersions}
                currentVersionId={deliverable.current_version_id}
              >
                {(version) =>
                  version.id === deliverable.current_version_id &&
                  version.state === "IN_REVIEW" ? (
                    <div className="pt-1">
                      <AgencyCommentForm
                        workspaceId={context.workspaceId}
                        versionId={version.id}
                      />
                    </div>
                  ) : null
                }
              </RevisionRail>
            ) : (
              <EmptyNote>
                No revisions yet. Each upload adds a numbered round to this rail.
              </EmptyNote>
            )}
          </Section>
        </div>

        <div className="space-y-5">
          {approved?.approval ? (
            <ApprovalSeal
              approval={approved.approval}
              deliverableName={deliverable.name}
              versionNumber={approved.version_number}
              projectName={project?.name}
            />
          ) : null}

          {deliverable.status === "APPROVED" && !approved ? (
            <EmptyNote>
              This deliverable is marked approved but no approval record was
              found. Contact support before relying on it.
            </EmptyNote>
          ) : null}

          {deliverable.status === "CHANGES_REQUESTED" ? (
            <EmptyNote>
              {client?.name ?? "The client"} asked for changes. Upload the next
              version when it is ready, then send a new review link.
            </EmptyNote>
          ) : null}

          {archived ? (
            <EmptyNote>
              This deliverable is archived. It keeps its history and approval
              record, and accepts no new versions.
            </EmptyNote>
          ) : (
            <Plate>
              <PlateHeader>
                <PlateTitle>Upload a version</PlateTitle>
              </PlateHeader>
              <PlateBody>
                <VersionUploadForm
                  workspaceId={context.workspaceId}
                  deliverableId={deliverable.id}
                />
              </PlateBody>
            </Plate>
          )}

          <Plate>
            <PlateHeader>
              <PlateTitle>Activity</PlateTitle>
            </PlateHeader>
            <PlateBody>
              <ActivityTimeline events={activity} />
            </PlateBody>
          </Plate>
        </div>
      </div>
    </div>
  );
}
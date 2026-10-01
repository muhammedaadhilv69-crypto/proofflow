import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthenticatedContext } from "@/lib/authz";
import { getProject } from "@/lib/data";
import { ROUTES } from "@/lib/routes";
import { formatDateSlug } from "@/lib/utils";
import { PageHeader, Section } from "@/components/page-header";
import { StateChip, StateMark } from "@/components/state-chip";
import { Plate, PlateBody } from "@/components/ui/plate";
import { EmptyNote, EmptyState } from "@/components/empty-state";
import { ActivityTimeline } from "@/components/activity-timeline";
import { DeliverableForm } from "@/components/deliverable-form";
import { ProjectStatusForm } from "@/components/project-status-form";
import { ProjectEditForm } from "@/components/project-edit-form";

/**
 * Project → Deliverables → Versions → Reviews, in that order and no other.
 *
 * The deliverables table is the page's centre of gravity, so it gets the width
 * and the column rule; the two forms that create things sit in the sidebar,
 * under the list they add to, rather than competing with it for attention.
 */
export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const context = await requireAuthenticatedContext();
  const result = await getProject(context, projectId);
  if (!result) notFound();
  const { project, client, deliverables, activity } = result;

  return (
    <div className="space-y-8">
      <PageHeader
        path={[
          { label: "Workspace", href: ROUTES.dashboard },
          { label: "Projects", href: ROUTES.projects },
          { label: project.name },
        ]}
        title={project.name}
        slug={[
          { key: "client", value: client?.name ?? "No client" },
          { key: "due", value: formatDateSlug(project.due_date) },
          { key: "deliverables", value: deliverables.length },
        ]}
        actions={
          <ProjectStatusForm
            workspaceId={context.workspaceId}
            projectId={project.id}
            status={project.status}
          />
        }
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="space-y-8">
          <Section
            title="Deliverables"
            slug={[{ key: "total", value: deliverables.length }]}
          >
            {deliverables.length ? (
              <Plate>
                <ul className="divide-y divide-rule">
                  {deliverables.map((deliverable) => (
                    <li key={deliverable.id}>
                      <Link
                        href={`/projects/${project.id}/deliverables/${deliverable.id}`}
                        className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 transition-colors hover:bg-wash"
                      >
                        <StateMark state={deliverable.status} className="size-2" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink">
                            {deliverable.name}
                          </span>
                          <span className="slug block truncate">
                            {deliverable.current_version_id
                              ? "has version history"
                              : "no version uploaded"}
                          </span>
                        </span>
                        <StateChip state={deliverable.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Plate>
            ) : (
              <EmptyState
                title="No deliverables yet"
                description="A deliverable is one thing the client approves, such as a set of social images or a homepage design. Each one keeps its own versions and approval record."
                nextStep="add a deliverable using the form beside this list"
              />
            )}
          </Section>

          <Section title="Activity">
            <Plate>
              <PlateBody>
                <ActivityTimeline events={activity} />
              </PlateBody>
            </Plate>
          </Section>
        </div>

        <div className="space-y-5">
          {project.status !== "ARCHIVED" ? (
            <Plate accentTop>
              <PlateBody className="space-y-3">
                <h2 className="label-narrow text-xs font-medium text-ink">
                  Add deliverable
                </h2>
                <DeliverableForm
                  workspaceId={context.workspaceId}
                  projectId={project.id}
                />
              </PlateBody>
            </Plate>
          ) : (
            <EmptyNote>
              This project is archived, so it no longer accepts new deliverables.
            </EmptyNote>
          )}

          <Plate>
            <PlateBody className="space-y-3">
              <h2 className="label-narrow text-xs font-medium text-ink">
                Project details
              </h2>
              <ProjectEditForm
                workspaceId={context.workspaceId}
                project={project}
              />
            </PlateBody>
          </Plate>
        </div>
      </div>
    </div>
  );
}
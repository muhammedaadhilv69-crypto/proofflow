import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAuthenticatedContext } from "@/lib/authz";
import { getProject } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { ActivityTimeline } from "@/components/activity-timeline";
import { DeliverableForm } from "@/components/deliverable-form";
import { ProjectStatusForm } from "@/components/project-status-form";
import { ProjectEditForm } from "@/components/project-edit-form";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const context = await getAuthenticatedContext();
  if (!context) return null;
  const result = await getProject(context, projectId);
  if (!result) notFound();
  const { project, client, deliverables, activity } = result;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/projects">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Projects
        </Link>
      </Button>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {project.name}
            </h1>
            <StatusBadge status={project.status} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {client?.name || "No client"}
            {client?.email ? ` · ${client.email}` : ""}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {project.description || "No project description"}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div className="text-sm">
            <p className="text-xs text-muted-foreground">Due date</p>
            <p className="mt-1 font-medium">{formatDate(project.due_date)}</p>
          </div>
          <ProjectStatusForm
            workspaceId={context.workspaceId}
            projectId={project.id}
            status={project.status}
          />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Deliverables</CardTitle>
          </CardHeader>
          <CardContent>
            {deliverables.length ? (
              <div className="divide-y">
                {deliverables.map((deliverable) => (
                  <Link
                    key={deliverable.id}
                    href={`/projects/${project.id}/deliverables/${deliverable.id}`}
                    className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0 hover:text-primary"
                  >
                    <div>
                      <p className="text-sm font-medium">{deliverable.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {deliverable.current_version_id
                          ? "Version history available"
                          : "No version uploaded yet"}
                      </p>
                    </div>
                    <StatusBadge status={deliverable.status} />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No deliverables yet. Add the first one to start collecting
                approvals.
              </p>
            )}
          </CardContent>
        </Card>
        <div className="space-y-6">
          {project.status !== "ARCHIVED" ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add deliverable</CardTitle>
              </CardHeader>
              <CardContent>
                <DeliverableForm
                  workspaceId={context.workspaceId}
                  projectId={project.id}
                />
              </CardContent>
            </Card>
          ) : null}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Edit project</CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectEditForm
                workspaceId={context.workspaceId}
                project={project}
              />
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

import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Plus,
} from "lucide-react";
import { getAuthenticatedContext } from "@/lib/authz";
import { getDashboardData } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";

export default async function DashboardPage() {
  const context = await getAuthenticatedContext();
  if (!context) return null;
  const data = await getDashboardData(context);
  const displayName =
    typeof context.user.user_metadata?.full_name === "string"
      ? context.user.user_metadata.full_name
      : context.user.email?.split("@")[0] || "there";

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">Workspace overview</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Good to see you, {displayName}.
          </h1>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            New project
          </Link>
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active projects"
          value={data.metrics.activeProjects}
          icon={<FolderKanban className="h-4 w-4" />}
        />
        <MetricCard
          title="Awaiting client"
          value={data.metrics.awaitingClient}
          icon={<Clock3 className="h-4 w-4" />}
        />
        <MetricCard
          title="Changes requested"
          value={data.metrics.changesRequested}
          icon={<AlertCircle className="h-4 w-4" />}
        />
        <MetricCard
          title="Approved this week"
          value={data.metrics.approvedThisWeek}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
      </div>
      {data.needsAttention.length === 0 && data.recentProjects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create your first project to start collecting clear client approvals."
          actionLabel="Create your first project"
          actionHref="/projects/new"
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="h-4 w-4" />
                Needs attention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.needsAttention.length ? (
                data.needsAttention.map(({ deliverable, project, client }) => (
                  <Link
                    key={deliverable.id}
                    href={`/projects/${project?.id}/deliverables/${deliverable.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-accent"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {deliverable.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {project?.name} · {client?.name || "Client"}
                      </p>
                    </div>
                    <StatusBadge status={deliverable.status} />
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nothing needs your attention.
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FolderKanban className="h-4 w-4" />
                Recent projects
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recentProjects.length ? (
                data.recentProjects.map(({ project, client }) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-accent"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {project.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {client?.name || "No client"} · Updated{" "}
                        {formatDate(project.updated_at)}
                      </p>
                    </div>
                    <StatusBadge status={project.status} />
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No projects yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

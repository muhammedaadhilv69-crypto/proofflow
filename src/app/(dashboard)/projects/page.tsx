import Link from "next/link";
import { Plus } from "lucide-react";
import { getAuthenticatedContext } from "@/lib/authz";
import { listProjects } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { formatDate } from "@/lib/utils";

export default async function ProjectsPage() {
  const context = await getAuthenticatedContext();
  if (!context) return null;
  const projects = await listProjects(context);
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Client work</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Projects</h1>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            New project
          </Link>
        </Button>
      </div>
      {projects.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="h-full transition-colors hover:border-primary/50">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold">{project.name}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {project.client?.name || "No client"}
                      </p>
                    </div>
                    <StatusBadge status={project.status} />
                  </div>
                  <p className="mt-4 line-clamp-2 min-h-10 text-sm text-muted-foreground">
                    {project.description || "No description"}
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                    <span>Updated {formatDate(project.updated_at)}</span>
                    {project.due_date ? (
                      <span>Due {formatDate(project.due_date)}</span>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No projects yet"
          description="Create your first project to start collecting approvals."
          actionLabel="Create your first project"
          actionHref="/projects/new"
        />
      )}
    </div>
  );
}

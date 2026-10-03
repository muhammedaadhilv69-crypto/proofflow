import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAuthenticatedContext } from "@/lib/authz";
import { listProjects } from "@/lib/data";
import { ROUTES } from "@/lib/routes";
import { formatDateSlug, formatRelative } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plate } from "@/components/ui/plate";
import { PageHeader } from "@/components/page-header";
import { StateChip } from "@/components/state-chip";
import { EmptyState } from "@/components/empty-state";

/**
 * Projects are listed as rows, not tiles.
 *
 * A tile gives every project equal visual weight and forces a scan of six
 * separate boxes. A row puts project name, client, state and due date on
 * columns that line up, so "which project is late" is a comparison rather than
 * a memory exercise — and it is the only layout that survives twenty projects.
 */
export default async function ProjectsPage() {
  const context = await requireAuthenticatedContext();
  const projects = await listProjects(context);

  return (
    <div className="space-y-8">
      <PageHeader
        path={[
          { label: "Workspace", href: ROUTES.dashboard },
          { label: "Projects" },
        ]}
        title="Projects"
        slug={[
          { key: "total", value: projects.length },
          { key: "active", value: projects.filter((p) => p.status === "ACTIVE").length },
        ]}
        actions={
          <Button asChild>
            <Link href={ROUTES.newProject}>
              <Plus aria-hidden="true" />
              New project
            </Link>
          </Button>
        }
      />

      {projects.length ? (
        <Plate>
          <div className="hidden grid-cols-[1fr_11rem_9rem_7rem] items-baseline gap-4 border-b border-rule px-5 py-2.5 sm:grid">
            <span className="slug-key">project</span>
            <span className="slug-key">client</span>
            <span className="slug-key">state</span>
            <span className="slug-key text-right">updated</span>
          </div>
          <ul className="divide-y divide-rule">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.id}`}
                  className="grid grid-cols-1 items-baseline gap-x-4 gap-y-2 px-6 py-4 transition-colors hover:bg-wash sm:grid-cols-[1fr_11rem_9rem_7rem]"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink">
                      {project.name}
                    </span>
                    {project.description ? (
                      <span className="block truncate text-xs text-ink-faint">
                        {project.description}
                      </span>
                    ) : null}
                  </span>
                  <span className="truncate text-sm text-ink-soft">
                    {project.client?.name ?? "No client"}
                  </span>
                  <span className="flex items-center gap-2">
                    <StateChip state={project.status} />
                    {project.due_date ? (
                      <span className="slug hidden sm:inline">
                        due {formatDateSlug(project.due_date)}
                      </span>
                    ) : null}
                  </span>
                  <span
                    className="slug text-right"
                    title={`Updated ${formatRelative(project.updated_at)}`}
                  >
                    {formatRelative(project.updated_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Plate>
      ) : (
        <EmptyState
          title="No projects yet"
          description="A project holds the deliverables for one client engagement. Approval records live inside it, so this is where client work starts and ends."
          nextStep="create a project, then add a deliverable to it"
          action={{ label: "Create a project", href: ROUTES.newProject }}
        />
      )}
    </div>
  );
}
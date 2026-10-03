import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAuthenticatedContext } from "@/lib/authz";
import { listClients, listProjects } from "@/lib/data";
import { ROUTES } from "@/lib/routes";
import { initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plate, PlateBody, PlateHeader, PlateTitle } from "@/components/ui/plate";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ClientForm } from "@/components/client-form";

export default async function ClientsPage() {
  const context = await requireAuthenticatedContext();
  const [clients, projects] = await Promise.all([
    listClients(context),
    listProjects(context),
  ]);

  const projectCounts = new Map<string, number>();
  for (const project of projects) {
    projectCounts.set(
      project.client_id,
      (projectCounts.get(project.client_id) ?? 0) + 1,
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        path={[
          { label: "Workspace", href: ROUTES.dashboard },
          { label: "Clients" },
        ]}
        title="Clients"
        slug={[
          { key: "total", value: clients.length },
          { key: "with projects", value: projectCounts.size },
        ]}
        actions={
          <Button asChild variant="outline" size="sm">
            <a href="#add-client">
              <Plus aria-hidden="true" />
              Add client
            </a>
          </Button>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
        {clients.length ? (
          <Plate>
            <PlateHeader>
              <PlateTitle>Directory</PlateTitle>
              <span className="slug">{clients.length} clients</span>
            </PlateHeader>
            <ul className="divide-y divide-rule">
              {clients.map((client) => (
                <li key={client.id}>
                  <Link
                    href={`/clients/${client.id}`}
                    className="flex flex-wrap items-center gap-x-3 gap-y-2 px-6 py-4 transition-colors hover:bg-wash"
                  >
                    <span
                      aria-hidden="true"
                      className="grid size-8 shrink-0 place-items-center rounded-full bg-wash text-[0.6875rem] font-semibold text-ink-soft"
                    >
                      {initials(client.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">
                        {client.name}
                      </span>
                      <span className="slug block truncate">
                        {client.email}
                        {client.company ? ` / ${client.company}` : ""}
                      </span>
                    </span>
                    <span className="slug shrink-0">
                      {projectCounts.get(client.id) ?? 0} projects
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Plate>
        ) : (
          <EmptyState
            title="No clients yet"
            description="Every deliverable belongs to a client, and the client is who an approval is recorded against. Add one to get started."
            nextStep="add a client, then create a project for them"
          />
        )}

        <Plate accentTop id="add-client">
          <PlateHeader>
            <PlateTitle>Add client</PlateTitle>
          </PlateHeader>
          <PlateBody>
            <ClientForm workspaceId={context.workspaceId} />
          </PlateBody>
        </Plate>
      </div>
    </div>
  );
}
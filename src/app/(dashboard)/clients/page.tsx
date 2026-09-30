import Link from "next/link";
import { Plus } from "lucide-react";
import { getAuthenticatedContext } from "@/lib/authz";
import { listClients, listProjects } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientForm } from "@/components/client-form";
import { EmptyState } from "@/components/empty-state";

export default async function ClientsPage() {
  const context = await getAuthenticatedContext();
  if (!context) return null;
  const [clients, projects] = await Promise.all([
    listClients(context),
    listProjects(context),
  ]);
  const projectCounts = new Map<string, number>();
  projects.forEach((project) =>
    projectCounts.set(
      project.client_id,
      (projectCounts.get(project.client_id) || 0) + 1,
    ),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Workspace directory</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Clients</h1>
        </div>
        <Button asChild variant="outline">
          <Link href="#new-client">
            <Plus className="mr-2 h-4 w-4" />
            Add client
          </Link>
        </Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your clients</CardTitle>
          </CardHeader>
          <CardContent>
            {clients.length ? (
              <div className="divide-y">
                {clients.map((client) => (
                  <Link
                    key={client.id}
                    href={`/clients/${client.id}`}
                    className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0 hover:text-primary"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
                        {client.name.slice(0, 1).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {client.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {client.email}
                          {client.company ? ` · ${client.company}` : ""}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {projectCounts.get(client.id) || 0} projects
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No clients yet"
                description="Add a client to associate projects and review links."
              />
            )}
          </CardContent>
        </Card>
        <Card id="new-client">
          <CardHeader>
            <CardTitle className="text-base">Add client</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientForm workspaceId={context.workspaceId} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

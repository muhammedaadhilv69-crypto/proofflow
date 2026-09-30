import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAuthenticatedContext } from "@/lib/authz";
import { getClient, listProjects } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { ClientForm } from "@/components/client-form";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const context = await getAuthenticatedContext();
  if (!context) return null;
  const [client, projects] = await Promise.all([
    getClient(context, clientId),
    listProjects(context),
  ]);
  if (!client) notFound();
  const clientProjects = projects.filter(
    (project) => project.client_id === client.id,
  );

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/clients">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Clients
        </Link>
      </Button>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">Client</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            {client.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {client.email}
            {client.company ? ` · ${client.company}` : ""}
          </p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {clientProjects.length ? (
              <div className="divide-y">
                {clientProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0 hover:text-primary"
                  >
                    <div>
                      <p className="text-sm font-medium">{project.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {project.description || "No description"}
                      </p>
                    </div>
                    <StatusBadge status={project.status} />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No projects associated yet.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Edit client</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientForm workspaceId={context.workspaceId} client={client} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

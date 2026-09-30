import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAuthenticatedContext } from "@/lib/authz";
import { listClients } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProjectForm } from "@/components/project-form";

export default async function NewProjectPage() {
  const context = await getAuthenticatedContext();
  if (!context) return null;
  const clients = await listClients(context);
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/projects">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Projects
        </Link>
      </Button>
      <div>
        <p className="text-sm text-muted-foreground">New project</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Create a project
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Project details</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm workspaceId={context.workspaceId} clients={clients} />
        </CardContent>
      </Card>
    </div>
  );
}

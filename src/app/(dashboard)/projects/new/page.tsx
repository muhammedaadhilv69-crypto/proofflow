import { requireAuthenticatedContext } from "@/lib/authz";
import { listClients } from "@/lib/data";
import { ROUTES } from "@/lib/routes";
import { PageHeader } from "@/components/page-header";
import { Plate, PlateBody } from "@/components/ui/plate";
import { ProjectForm } from "@/components/project-form";

export default async function NewProjectPage() {
  const context = await requireAuthenticatedContext();
  const clients = await listClients(context);

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <PageHeader
        path={[
          { label: "Workspace", href: ROUTES.dashboard },
          { label: "Projects", href: ROUTES.projects },
          { label: "New project" },
        ]}
        title="Create a project"
        slug={[{ key: "clients available", value: clients.length }]}
      />
      <Plate>
        <PlateBody>
          <ProjectForm workspaceId={context.workspaceId} clients={clients} />
        </PlateBody>
      </Plate>
    </div>
  );
}
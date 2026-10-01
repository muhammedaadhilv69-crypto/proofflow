import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthenticatedContext } from "@/lib/authz";
import { getClient, listProjects } from "@/lib/data";
import { ROUTES } from "@/lib/routes";
import { initials, formatDateSlug } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { StateChip } from "@/components/state-chip";
import { Plate, PlateBody, PlateHeader, PlateTitle } from "@/components/ui/plate";
import { EmptyNote } from "@/components/empty-state";
import { ClientForm } from "@/components/client-form";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const context = await requireAuthenticatedContext();
  const [client, projects] = await Promise.all([
    getClient(context, clientId),
    listProjects(context),
  ]);
  if (!client) notFound();

  const clientProjects = projects.filter(
    (project) => project.client_id === client.id,
  );

  return (
    <div className="space-y-8">
      <PageHeader
        path={[
          { label: "Workspace", href: ROUTES.dashboard },
          { label: "Clients", href: ROUTES.clients },
          { label: client.name },
        ]}
        title={client.name}
        slug={[
          { key: "email", value: client.email },
          ...(client.company ? [{ key: "company", value: client.company }] : []),
          { key: "projects", value: clientProjects.length },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="space-y-8">
          <Plate>
            <PlateHeader>
              <PlateTitle>Projects</PlateTitle>
              <span className="slug">{clientProjects.length} total</span>
            </PlateHeader>
            {clientProjects.length ? (
              <ul className="divide-y divide-rule">
                {clientProjects.map((project) => (
                  <li key={project.id}>
                    <Link
                      href={`/projects/${project.id}`}
                      className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 transition-colors hover:bg-wash"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">
                          {project.name}
                        </span>
                        <span className="slug block truncate">
                          {project.due_date
                            ? `due ${formatDateSlug(project.due_date)}`
                            : "no due date"}
                        </span>
                      </span>
                      <StateChip state={project.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <PlateBody>
                <EmptyNote>
                  No projects for {client.name} yet.{" "}
                  <Link href="/projects/new" className="text-signal underline-offset-4 hover:underline">
                    Create one
                  </Link>{" "}
                  to start collecting approvals from them.
                </EmptyNote>
              </PlateBody>
            )}
          </Plate>
        </div>

        <div className="space-y-5">
          <Plate accentTop>
            <PlateHeader>
              <PlateTitle>Edit client</PlateTitle>
            </PlateHeader>
            <PlateBody className="space-y-4">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="grid size-9 place-items-center rounded-full bg-wash text-xs font-semibold text-ink-soft"
                >
                  {initials(client.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {client.name}
                  </p>
                  <p className="slug">
                    client since {formatDateSlug(client.created_at)}
                  </p>
                </div>
              </div>
              <ClientForm workspaceId={context.workspaceId} client={client} />
            </PlateBody>
          </Plate>

          <Plate>
            <PlateBody>
              <p className="slug-key">approvals on record</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                Every approval for this client is stored against their email
                address and cannot be edited afterwards. Contact support if a
                record looks wrong.
              </p>
            </PlateBody>
          </Plate>
        </div>
      </div>
    </div>
  );
}
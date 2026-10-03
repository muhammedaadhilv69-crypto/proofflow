import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { getUserName, requireAuthenticatedContext } from "@/lib/authz";
import {
  getDashboardData,
  listLiveReviewVersionIds,
  listRecentApprovals,
} from "@/lib/data";
import { ROUTES } from "@/lib/routes";
import { nextAgencyAction } from "@/lib/workflow";
import {
  formatDateSlug,
  formatRelative,
  formatStampUtc,
} from "@/lib/utils";
import { stateLabel, type StateKey } from "@/lib/status";
import { PageHeader, Section } from "@/components/page-header";
import { StateChip, StateMark } from "@/components/state-chip";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Plate } from "@/components/ui/plate";

export default async function DashboardPage() {
  const context = await requireAuthenticatedContext();
  const data = await getDashboardData(context);

  const attention = data.needsAttention;
  const liveLinkVersionIds = await listLiveReviewVersionIds(
    context,
    attention
      .map((item) => item.deliverable.current_version_id)
      .filter((id): id is string => Boolean(id)),
  );
  const recentApprovals = await listRecentApprovals(context);

  const metrics = data.metrics;
  const firstName = getUserName(context.user).split(" ")[0];

  const hasAnything =
    attention.length > 0 ||
    data.recentProjects.length > 0 ||
    recentApprovals.length > 0;

  return (
    <div className="space-y-8">
      <PageHeader
        path={[{ label: "Workspace", href: ROUTES.dashboard }, { label: "Dashboard" }]}
        title="Dashboard"
        slug={[
          { key: "active", value: metrics.activeProjects },
          { key: "with client", value: metrics.awaitingClient },
          { key: "changes requested", value: metrics.changesRequested },
          { key: "approved 7d", value: metrics.approvedThisWeek },
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

      {!hasAnything ? (
        <EmptyState
          title="No projects yet"
          description="ProofFlow tracks one thing: which version of a deliverable a client approved, and when. Start with a project and it will hold that record for you."
          nextStep="create a project, add a deliverable, upload version 1"
          action={{ label: "Create a project", href: ROUTES.newProject }}
          secondaryAction={{ label: "See how it works", href: "/#how-it-works" }}
        />
      ) : null}

      {attention.length ? (
        <Section
          title={`Waiting on you, ${firstName}`}
          slug={[{ key: "items", value: attention.length }]}
        >
          <Plate>
            <ul className="divide-y divide-rule">
              {attention.map((item) => (
                <WorklistRow
                  key={item.deliverable.id}
                  deliverableId={item.deliverable.id}
                  projectId={item.project!.id}
                  name={item.deliverable.name}
                  projectName={item.project!.name}
                  clientName={item.client?.name ?? null}
                  status={item.deliverable.status as StateKey}
                  updatedAt={item.deliverable.updated_at}
                  hasLiveLink={liveLinkVersionIds.has(
                    item.deliverable.current_version_id ?? "",
                  )}
                />
              ))}
            </ul>
          </Plate>
        </Section>
      ) : null}

      {recentApprovals.length ? (
        <Section
          title="Recently approved"
          slug={[{ key: "records", value: recentApprovals.length }]}
          action={
            <Button asChild variant="quiet" size="sm">
              <Link href={ROUTES.projects}>
                All projects
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          }
        >
          <Plate>
            <ul className="divide-y divide-rule">
              {recentApprovals.map((approval) => (
                <li key={approval.id}>
                  <Link
                    href={`/projects/${approval.project_id}/deliverables/${approval.deliverable_id}`}
                    className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-6 py-4 transition-colors hover:bg-wash"
                  >
                    <span className="flex items-baseline gap-2.5">
                      <span className="rounded-[1px] bg-ink" aria-hidden="true" />
                      <span className="font-mono text-xs font-medium tabular-nums text-ink">
                        {approval.approval_number}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-ink">
                      {approval.deliverable_name}
                      <span className="text-ink-faint">
                        {" "}
                        v{approval.version_number}
                      </span>
                    </span>
                    <span className="text-xs text-ink-faint">
                      {approval.client_name}
                    </span>
                    <time
                      dateTime={approval.approved_at}
                      title={formatStampUtc(approval.approved_at)}
                      className="font-mono text-xs tabular-nums text-ink-faint"
                    >
                      {formatDateSlug(approval.approved_at)}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          </Plate>
        </Section>
      ) : null}

      {data.recentProjects.length ? (
        <Section title="Recent projects" bodyClassName="w-full">
          <div className="grid gap-4 lg:grid-cols-2">
            {data.recentProjects.map(({ project, client }) => (
              <Plate key={project.id} flat className="border">
                <Link
                  href={`/projects/${project.id}`}
                  className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-6 py-4 transition-colors hover:bg-wash"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                    {project.name}
                  </span>
                  <span className="truncate text-xs text-ink-faint">
                    {client?.name ?? "No client"}
                  </span>
                  <span className="slug">
                    updated {formatRelative(project.updated_at)}
                  </span>
                </Link>
              </Plate>
            ))}
          </div>
        </Section>
      ) : null}
    </div>
  );
}

/**
 * One line of the worklist.
 *
 * The action sits on the right in its own column because it is the reason the
 * row exists; the state chip is there so the action can be trusted at a glance.
 * A row whose action is "waiting on the client" is deliberately quieter than
 * one that needs a click, because a worklist where everything looks urgent is
 * a worklist nobody reads.
 */
function WorklistRow({
  deliverableId,
  projectId,
  name,
  projectName,
  clientName,
  status,
  updatedAt,
  hasLiveLink,
}: {
  deliverableId: string;
  projectId: string;
  name: string;
  projectName: string;
  clientName: string | null;
  status: StateKey;
  updatedAt: string;
  hasLiveLink: boolean;
}) {
  const action = nextAgencyAction(status, hasLiveLink);
  const href = `/projects/${projectId}/deliverables/${deliverableId}`;
  const actionable = action.intent !== "wait" && action.intent !== "none";

  return (
    <li>
      <Link
        href={href}
        className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-4 transition-colors hover:bg-wash"
      >
        <StateMark state={status} className="size-2" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-ink">
            {name}
          </span>
          <span className="slug block truncate">
            {projectName}
            {clientName ? ` / ${clientName}` : ""}
          </span>
        </span>
        <span className="shrink-0">
          <StateChip state={status} />
        </span>
        <span className="slug shrink-0">
          {actionable ? (
            <span className="text-ink">{action.label}</span>
          ) : (
            <span>{action.label}</span>
          )}
        </span>
        <time
          dateTime={updatedAt}
          title={`Updated ${formatStampUtc(updatedAt)}`}
          className="slug w-16 shrink-0 text-right"
        >
          {formatRelative(updatedAt)}
        </time>
      </Link>
      <span className="sr-only">
        {name}, {projectName}, {stateLabel(status)}, {action.label}
      </span>
    </li>
  );
}
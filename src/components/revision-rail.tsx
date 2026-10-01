import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fileTypeLabel,
  formatBytes,
  formatDateSlug,
  formatDateTime,
} from "@/lib/utils";
import { StateChip } from "@/components/state-chip";
import {
  stateLabel,
  versionStateShort,
  type Audience,
  type StateKey,
} from "@/lib/status";

export type RailVersion = {
  id: string;
  version_number: number;
  description: string | null;
  created_at: string;
  status: string;
  state: StateKey;
  file?: {
    original_filename: string;
    mime_type: string;
    size_bytes?: number | null;
  } | null;
  comments?: Array<{
    id: string;
    author_name: string;
    author_type: string;
    comment_type: string;
    created_at: string;
    body: string;
  }> | null;
  approval?: {
    approval_number: string;
    client_name: string;
    client_email: string;
    approved_at: string;
    ip_address?: string | null;
    user_agent?: string | null;
  } | null;
};

/** Who moved this round, so the rail reads as a history of people. */
function actorOf(version: RailVersion): string | null {
  if (version.approval) return version.approval.client_name;
  const request = version.comments?.find(
    (comment) => comment.comment_type === "CHANGE_REQUEST",
  );
  if (request) return request.author_name;
  const first = version.comments?.[0];
  if (first) return first.author_name;
  return null;
}

/**
 * The revision rail.
 *
 * The brief's real requirement is that nobody should ever have to wonder which
 * version the client approved. A stack of identical cards cannot answer that:
 * every round looks equally weighted, so the reader has to read each one. The
 * rail answers it with weight instead — the approved round gets the heaviest
 * rule, the darkest type, and a filled mark, and it is open by default. The
 * rounds that failed get thinner rules and their own ink. You find the approved
 * proof by looking, not by reading.
 *
 * Built on `<details>` so expanding a round is keyboard-operable and works
 * before hydration. Nothing animates on open: a rule that changes weight is
 * already enough of a signal, and animating it would only slow the read.
 */
export function RevisionRail({
  versions,
  currentVersionId,
  audience = "agency",
  className,
  children,
}: {
  versions: RailVersion[];
  currentVersionId: string | null;
  audience?: Audience;
  className?: string;
  /** Per-version extras rendered inside the open round, e.g. a reply form. */
  children?: (version: RailVersion) => React.ReactNode;
}) {
  return (
    <ol className={cn("space-y-1", className)}>
      {versions.map((version) => {
        const isCurrent = version.id === currentVersionId;
        const final = version.state === "APPROVED";
        const defaultOpen = final || isCurrent;
        const actor = actorOf(version);

        return (
          <li key={version.id} className="relative pl-4">
            <span
              aria-hidden="true"
              className={cn(
                "absolute inset-y-1 left-0 w-px",
                final ? "w-0.5 bg-ink" : "bg-rule-strong",
              )}
            />
            <details open={defaultOpen} className="group">
              <summary
                className={cn(
                  "flex cursor-pointer list-none flex-wrap items-baseline gap-x-3 gap-y-1 rounded-control py-2 pr-1 transition-colors hover:bg-wash",
                  "[&::-webkit-details-marker]:hidden",
                )}
              >
                <ChevronRight
                  aria-hidden="true"
                  className="size-3 shrink-0 translate-y-px text-ink-faint transition-transform duration-150 group-open:rotate-90"
                />
                <span
                  className={cn(
                    "font-mono text-xs tabular-nums",
                    final ? "font-medium text-ink" : "text-ink-soft",
                  )}
                >
                  v{version.version_number}
                </span>
                <StateChip state={version.state} audience={audience} />
                {version.approval ? (
                  <span className="label-narrow text-[0.6875rem] text-ink-faint">
                    {versionStateShort(version.state)}
                  </span>
                ) : null}
                <span className="ml-auto flex items-baseline gap-3">
                  {actor ? (
                    <span className="text-xs text-ink-faint">{actor}</span>
                  ) : null}
                  <time
                    dateTime={version.created_at}
                    className="font-mono text-xs tabular-nums text-ink-faint"
                    title={formatDateTime(version.created_at)}
                  >
                    {formatDateSlug(version.created_at)}
                  </time>
                </span>
                <span className="sr-only">
                  {stateLabel(version.state, audience)}
                </span>
              </summary>

              <div className="mb-2 ml-7 space-y-3 border-l border-rule pl-4">
                {version.description ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
                    {version.description}
                  </p>
                ) : null}

                <div className="slug flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  {version.file ? (
                    <>
                      <span>{fileTypeLabel(version.file.mime_type)}</span>
                      <span className="max-w-64 truncate">
                        {version.file.original_filename}
                      </span>
                      {version.file.size_bytes ? (
                        <span>{formatBytes(version.file.size_bytes)}</span>
                      ) : null}
                    </>
                  ) : (
                    <span>file unavailable</span>
                  )}
                  <span>{formatDateTime(version.created_at)}</span>
                </div>

                {version.comments?.length ? (
                  <ul className="space-y-3">
                    {version.comments.map((comment) => (
                      <li
                        key={comment.id}
                        className={cn(
                          "text-sm leading-relaxed",
                          comment.comment_type === "CHANGE_REQUEST" &&
                            "note-quote text-ink-soft",
                        )}
                      >
                        <span className="flex flex-wrap items-baseline gap-x-2">
                          <span className="font-medium text-ink">
                            {comment.author_name}
                          </span>
                          <span className="label-narrow text-[0.625rem] text-ink-faint">
                            {comment.author_type === "CLIENT"
                              ? "Client"
                              : "Agency"}
                            {comment.comment_type === "CHANGE_REQUEST"
                              ? " / change request"
                              : ""}
                          </span>
                          <time
                            dateTime={comment.created_at}
                            className="font-mono text-[0.6875rem] tabular-nums text-ink-faint"
                          >
                            {formatDateSlug(comment.created_at)}
                          </time>
                        </span>
                        <p className="mt-1 whitespace-pre-wrap">{comment.body}</p>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {children?.(version)}
              </div>
            </details>
          </li>
        );
      })}
      {/* Spacer so the final spine segment does not overhang the last row. */}
      <li aria-hidden="true" className="pl-4">
        <span className="block h-0 w-px" />
      </li>
      <li className="sr-only">
        {versions.length} {versions.length === 1 ? "revision" : "revisions"}.
        Approved rounds are marked with the heaviest rule.
      </li>
    </ol>
  );
}
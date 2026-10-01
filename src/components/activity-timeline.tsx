import { activityLabel } from "@/lib/data";
import { formatRelative, formatStampUtc } from "@/lib/utils";

/**
 * The activity trail reads as a ledger rather than a feed: one ruled line per
 * event, with the actor and the timestamp on the same baseline.
 *
 * `activityDescription` joins its fragments with a middot, which is fine inside
 * a sentence but wrong in a column, so the parts are laid out separately here.
 */
export function ActivityTimeline({
  events,
}: {
  events: Array<Parameters<typeof activityLabel>[0]>;
}) {
  if (!events.length) {
    return (
      <p className="text-sm text-ink-faint">
        Nothing has happened here yet. Uploading a version or sending a review
        link will show up on this list.
      </p>
    );
  }

  return (
    <ol className="divide-y divide-rule">
      {events.map((event) => (
        <li
          key={event.id}
          className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-2.5 first:pt-0 last:pb-0"
        >
          <span className="text-sm text-ink">{activityLabel(event)}</span>
          {typeof event.metadata?.version_number === "number" ? (
            <span className="font-mono text-xs tabular-nums text-ink-soft">
              v{event.metadata.version_number}
            </span>
          ) : null}
          {typeof event.metadata?.approval_number === "string" ? (
            <span className="font-mono text-xs tabular-nums text-ink">
              {event.metadata.approval_number}
            </span>
          ) : null}
          <span className="slug ml-auto">
            {event.actor_type === "CLIENT" ? "client" : "agency"}{" "}
            {formatRelative(event.created_at)}
          </span>
          <time dateTime={event.created_at} className="sr-only">
            {formatStampUtc(event.created_at)}
          </time>
        </li>
      ))}
    </ol>
  );
}
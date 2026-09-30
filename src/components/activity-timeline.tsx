import { formatDateTime } from "@/lib/utils";
import { activityDescription } from "@/lib/data";

export function ActivityTimeline({
  events,
}: {
  events: Array<Parameters<typeof activityDescription>[0]>;
}) {
  if (!events.length)
    return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  return (
    <ol className="space-y-4">
      {events.map((event) => (
        <li key={event.id} className="flex gap-3">
          <span
            className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-medium">{activityDescription(event)}</p>
            <p className="text-xs text-muted-foreground">
              {formatDateTime(event.created_at)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

import { getAuthenticatedContext } from "@/lib/authz";
import { listActivity, listNotifications } from "@/lib/data";
import { formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityTimeline } from "@/components/activity-timeline";
import { EmptyState } from "@/components/empty-state";

export default async function ActivityPage() {
  const context = await getAuthenticatedContext();
  if (!context) return null;
  const [events, notifications] = await Promise.all([
    listActivity(context),
    listNotifications(context),
  ]);
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Workspace history</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Activity</h1>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Everything happening in ProofFlow
            </CardTitle>
          </CardHeader>
          <CardContent>
            {events.length ? (
              <ActivityTimeline events={events} />
            ) : (
              <EmptyState
                title="No activity yet"
                description="Project activity will appear here as you upload versions and collect feedback."
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length ? (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`rounded-lg border p-3 ${notification.read ? "opacity-70" : "border-primary/30 bg-primary/5"}`}
                  >
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatDateTime(notification.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No notifications yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

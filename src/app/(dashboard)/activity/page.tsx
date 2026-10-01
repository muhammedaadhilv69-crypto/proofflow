import { requireAuthenticatedContext } from "@/lib/authz";
import { listActivity, listNotifications } from "@/lib/data";
import { ROUTES } from "@/lib/routes";
import { PageHeader, Section } from "@/components/page-header";
import { ActivityTimeline } from "@/components/activity-timeline";
import { NotificationsList } from "@/components/notifications-list";

/**
 * Activity and notifications.
 *
 * These are two different kinds of record so they are kept in two columns with
 * different treatment. Activity is the workspace's own ledger — immutable
 * events, everything everyone did. Notifications are addressed to one person
 * and can be read or unread, so an unread one carries a weight rather than a
 * colour wash.
 */
export default async function ActivityPage() {
  const context = await requireAuthenticatedContext();
  const [events, notifications] = await Promise.all([
    listActivity(context),
    listNotifications(context),
  ]);

  const unread = notifications.filter((notification) => !notification.read);

  return (
    <div className="space-y-8">
      <PageHeader
        path={[
          { label: "Workspace", href: ROUTES.dashboard },
          { label: "Activity" },
        ]}
        title="Activity"
        slug={[
          { key: "events", value: events.length },
          { key: "unread", value: unread.length },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <Section
          title="Workspace history"
          slug={[{ key: "events", value: events.length }]}
          bodyClassName="rounded-sheet border border-rule bg-sheet px-5 py-5"
        >
          <ActivityTimeline events={events} />
        </Section>

        <Section
          title="Notifications"
          slug={[
            { key: "total", value: notifications.length },
            ...(unread.length ? [{ key: "unread", value: unread.length }] : []),
          ]}
        >
          <NotificationsList notifications={notifications} />
        </Section>
      </div>
    </div>
  );
}
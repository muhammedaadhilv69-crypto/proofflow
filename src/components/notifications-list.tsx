"use client";

import { useTransition } from "react";
import { Check, CheckCheck } from "lucide-react";
import { formatRelative, formatStampUtc } from "@/lib/utils";
import { Plate } from "@/components/ui/plate";
import { Button } from "@/components/ui/button";
import { EmptyNote } from "@/components/empty-state";
import { markAsRead, markAllAsRead } from "@/actions/notifications";

type Notification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
};

export function NotificationsList({
  notifications,
}: {
  notifications: Notification[];
}) {
  const unread = notifications.filter((notification) => !notification.read);

  if (notifications.length === 0) {
    return (
      <EmptyNote>
        You have no notifications. Clients opening a review link, leaving
        comments, and approving will show up here.
      </EmptyNote>
    );
  }

  return (
    <Plate>
      {unread.length > 0 ? (
        <div className="flex items-center justify-between gap-3 border-b border-rule px-4 py-2">
          <span className="slug-key">{unread.length} unread</span>
          <MarkAllReadButton />
        </div>
      ) : null}
      <ul className="divide-y divide-rule">
        {notifications.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}
      </ul>
    </Plate>
  );
}

function MarkAllReadButton() {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="quiet"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => markAllAsRead())}
    >
      <CheckCheck aria-hidden="true" />
      Mark all read
    </Button>
  );
}

/**
 * Marking as read is a real action, so it is a real button.
 *
 * The row itself is not clickable: a notification is text, not a link, and
 * hanging an onClick on the list item would make it a control that keyboard and
 * screen-reader users cannot reach at all. The affordance is named per
 * notification so it is clear which one it affects.
 */
function NotificationItem({ notification }: { notification: Notification }) {
  const [pending, startTransition] = useTransition();

  return (
    <li className={notification.read ? "px-4 py-3" : "bg-wash/40 px-4 py-3"}>
      <div className="flex items-start gap-2.5">
        {!notification.read ? (
          <span
            aria-hidden="true"
            className="mt-1.5 size-1.5 shrink-0 rounded-[1px] bg-ink"
          />
        ) : null}

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">
            {notification.title}
            {!notification.read ? (
              <span className="sr-only"> (unread)</span>
            ) : null}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            {notification.message}
          </p>
          <div className="mt-1.5 flex items-center gap-3">
            <time
              dateTime={notification.created_at}
              title={formatStampUtc(notification.created_at)}
              className="slug"
            >
              {formatRelative(notification.created_at)}
            </time>
            {!notification.read ? (
              <Button
                type="button"
                variant="quiet"
                size="sm"
                disabled={pending}
                className="h-6 px-1.5 text-[0.6875rem]"
                onClick={() =>
                  startTransition(() => markAsRead(notification.id))
                }
              >
                <Check aria-hidden="true" className="size-3" />
                Mark read
                <span className="sr-only">
                  {" "}
                  {notification.title}
                </span>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}
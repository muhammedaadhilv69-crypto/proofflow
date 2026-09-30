type AnalyticsEvent =
  | "workspace_created"
  | "project_created"
  | "client_created"
  | "deliverable_created"
  | "version_uploaded"
  | "review_link_created"
  | "review_opened"
  | "comment_created"
  | "change_request_created"
  | "approval_created"
  | "approval_record_viewed";

export async function trackEvent(
  event: AnalyticsEvent,
  properties: Record<string, string | number | boolean> = {},
) {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!apiKey || !host) return;

  try {
    await fetch(`${host}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        properties,
        api_key: apiKey,
      }),
    });
  } catch {
    return;
  }
}

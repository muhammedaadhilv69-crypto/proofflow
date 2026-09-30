import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  tracesSampleRate: 0,
  beforeSend(event) {
    return scrubEvent(event);
  },
  beforeBreadcrumb(breadcrumb) {
    // scrubEvent only rewrites the event, never the breadcrumbs attached to it,
    // and the default console integration records every argument verbatim. A
    // server log that accidentally carries a token or an address would
    // otherwise leave the process through the breadcrumb trail. They add
    // nothing here that the runtime log does not already hold.
    if (breadcrumb.category === "console") return null;
    return breadcrumb;
  },
});

/**
 * Review and invitation links are bearer credentials, and approval records and
 * client email addresses must never reach a third party. Strip them before the
 * event leaves the process, and drop the headers that carry the session.
 */
function scrubEvent(event: Sentry.ErrorEvent) {
  const request = event.request;
  if (request) {
    if (request.url) {
      request.url = request.url
        .replace(/\/(review|invite)\/[0-9a-zA-Z-]{8,}/g, "/$1/[token]")
        .replace(/([?&])(token|code)=[^&]*/gi, "$1$2=[redacted]");
    }
    if (request.query_string) {
      const redacted: Record<string, string> = {};
      for (const [key, value] of Object.entries(request.query_string)) {
        redacted[key] = /^(token|code)$/i.test(key) ? "[redacted]" : value;
      }
      request.query_string = redacted;
    }
    if (request.headers) {
      for (const header of ["cookie", "authorization", "x-proofflow-request"]) {
        if (request.headers[header]) request.headers[header] = "[redacted]";
      }
    }
  }
  return event;
}

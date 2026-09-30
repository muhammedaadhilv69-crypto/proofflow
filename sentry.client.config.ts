import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  tracesSampleRate: 0,
  beforeSend(event) {
    if (event.request?.url) {
      event.request.url = event.request.url
        .replace(/\/(review|invite)\/[0-9a-zA-Z-]{8,}/g, "/$1/[token]")
        .replace(/([?&])(token|code)=[^&]*/gi, "$1$2=[redacted]");
    }
    return event;
  },
});

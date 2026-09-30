import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const isProduction = process.env.NODE_ENV === "production";

/**
 * HSTS is only meaningful once traffic is actually over HTTPS, so it is scoped
 * to production. `preload` is intentionally omitted: submitting the domain to
 * the browser preload list is hard to undo and should be a deliberate choice.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

const canUploadSourceMaps = Boolean(
  process.env.SENTRY_AUTH_TOKEN &&
    process.env.SENTRY_ORG &&
    process.env.SENTRY_PROJECT,
);

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Uploading needs all three credentials above, which only CI has. Local and
  // preview builds skip the step instead of warning on every build.
  sourcemaps: { disable: canUploadSourceMaps ? false : "disable-upload" },
  release: process.env.VERCEL_GIT_COMMIT_SHA
    ? { name: process.env.VERCEL_GIT_COMMIT_SHA }
    : undefined,
  telemetry: false,
  silent: !canUploadSourceMaps,
});

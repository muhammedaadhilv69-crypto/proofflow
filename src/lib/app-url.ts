const LOCAL_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
]);

function parseAppUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

/**
 * Non-throwing read used for metadata routes (robots, sitemap) so a missing
 * value degrades to a relative-safe default instead of breaking the build.
 */
export function getAppUrl() {
  const value = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!value) return "http://localhost:3000";
  const parsed = parseAppUrl(value);
  return (
    parsed ? `${parsed.origin}${parsed.pathname.replace(/\/$/, "")}` : value
  ).replace(/\/$/, "");
}

/**
 * Used anywhere a URL is emailed to a human. In production a localhost or
 * non-absolute value would leak unusable links, so it fails loudly instead.
 */
export function requireAppUrl() {
  const value = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!value) {
    if (process.env.NODE_ENV === "production")
      throw new Error("NEXT_PUBLIC_APP_URL is required in production");
    return "http://localhost:3000";
  }

  const parsed = parseAppUrl(value);
  if (!parsed)
    throw new Error(
      "NEXT_PUBLIC_APP_URL must be an absolute URL, for example https://app.example.com",
    );

  if (process.env.NODE_ENV === "production") {
    if (parsed.protocol !== "https:")
      throw new Error("NEXT_PUBLIC_APP_URL must use https in production");
    if (LOCAL_HOSTS.has(parsed.hostname))
      throw new Error(
        "NEXT_PUBLIC_APP_URL must not point at localhost in production",
      );
  }

  return `${parsed.origin}${parsed.pathname.replace(/\/$/, "")}`;
}

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import test from "node:test";
import { GUEST_ONLY_PATHS, PROTECTED_PATHS, ROUTES } from "@/lib/routes";

const APP_DIR = path.join(process.cwd(), "src", "app");
const SOURCE_DIR = path.join(process.cwd(), "src");

type DiscoveredRoute = { url: string; file: string };

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(full);
      return [full];
    }),
  );
  return files.flat();
}

/**
 * Turns a file path into the URL Next.js would serve it at: route groups such
 * as `(auth)` are organisational only and never appear in the path, and dynamic
 * segments become a single placeholder.
 */
function toUrlPattern(file: string): string | null {
  const relative = path.relative(APP_DIR, file).split(path.sep);
  const last = relative[relative.length - 1];
  if (last !== "page.tsx" && last !== "route.ts") return null;

  const segments = relative
    .slice(0, -1)
    .filter((segment) => !/^\(.*\)$/.test(segment))
    .map((segment) => {
      if (segment.startsWith("[[") && segment.endsWith("]]")) {
        return segment.slice(2, -2).replace(/^\.\.\./, "");
      }
      if (segment.startsWith("[") && segment.endsWith("]")) {
        return "*";
      }
      return segment;
    });

  return `/${segments.join("/")}`.replace(/\/$/, "") || "/";
}

async function discoverRoutes(): Promise<DiscoveredRoute[]> {
  const files = await walk(APP_DIR);
  return files
    .map((file) => {
      const url = toUrlPattern(file);
      return url ? { url, file: path.relative(process.cwd(), file) } : null;
    })
    .filter((route): route is DiscoveredRoute => route !== null);
}

function routeMatches(pattern: string, target: string) {
  if (pattern === "/") return target === "/";
  const patternSegments = pattern.split("/").filter(Boolean);
  const targetSegments = target.split("/").filter(Boolean);
  if (targetSegments.length < patternSegments.length) return false;
  return patternSegments.every(
    (segment, index) => segment === "*" || segment === targetSegments[index],
  );
}

function isServedBy(routes: DiscoveredRoute[], target: string) {
  return routes.some((route) => routeMatches(route.url, target));
}

let routesPromise: Promise<DiscoveredRoute[]> | undefined;

// Top-level await is not available here because tsx emits CommonJS for this
// project, so the tree walk is memoized and awaited inside each test instead.
function routes() {
  routesPromise ??= discoverRoutes();
  return routesPromise;
}

test("the route table is discoverable", async () => {
  const discovered = await routes();
  assert.ok(discovered.length > 15, `expected a real app router tree, found ${discovered.length} routes`);
});

test("every route in the ROUTES table resolves to a real page", async () => {
  const discovered = await routes();
  for (const [name, value] of Object.entries(ROUTES)) {
    assert.ok(
      isServedBy(discovered, value),
      `ROUTES.${name} points at ${value}, which has no page in src/app`,
    );
  }
});

test("auth pages are not nested under a route group segment", () => {
  // The (auth) group is organisational only. Anything that links to "/auth/*"
  // is dead, because the group name never reaches the URL.
  const values: string[] = Object.values(ROUTES);
  for (const value of values) {
    assert.ok(
      !value.startsWith("/auth/") && value !== "/auth",
      `${value} assumes the (auth) route group appears in the URL`,
    );
  }
});

test("protected and guest-only path lists only contain real routes", async () => {
  const discovered = await routes();
  for (const protectedPath of PROTECTED_PATHS) {
    assert.ok(isServedBy(discovered, protectedPath), `protected path ${protectedPath} is not served`);
  }
  for (const guestPath of GUEST_ONLY_PATHS) {
    assert.ok(isServedBy(discovered, guestPath), `guest-only path ${guestPath} is not served`);
  }
});

test("reset-password stays reachable while signed out", async () => {
  // Password recovery links land here from an email, with no session yet.
  const discovered = await routes();
  assert.ok(
    !PROTECTED_PATHS.includes(ROUTES.resetPassword),
    "reset-password must not be behind the auth guard",
  );
  assert.ok(isServedBy(discovered, ROUTES.resetPassword));
});

test("the middleware matcher covers exactly the guarded paths", async () => {
  // Next.js parses the matcher at build time, so it cannot be derived from the
  // shared constants. This keeps the literal list and the runtime guard in step.
  const source = await readFile(
    path.join(SOURCE_DIR, "proxy.ts"),
    "utf8",
  );
  const matcherBlock = source.slice(
    source.indexOf("export const config"),
  );
  const entries = [...matcherBlock.matchAll(/"(\/[^"]*)"/g)].map(
    (match) => match[1],
  );
  assert.ok(entries.length > 0, "could not read the matcher out of proxy.ts");

  const expected = [
    ...PROTECTED_PATHS.map((protectedPath) => `${protectedPath}/:path*`),
    ...GUEST_ONLY_PATHS,
  ];
  assert.deepEqual(entries, expected);

  // Every matcher entry must also correspond to a real page, otherwise the
  // middleware runs against paths that do not exist.
  const discovered = await routes();
  for (const entry of entries) {
    const bare = entry.replace(/\/:path\*$/, "");
    assert.ok(
      isServedBy(discovered, bare),
      `middleware matcher ${entry} has no page in src/app`,
    );
  }
});

test("every internal href in the source tree points at a real route", async () => {
  const discovered = await routes();
  const files = (await walk(SOURCE_DIR)).filter((file) => /\.tsx?$/.test(file));
  const offenders: string[] = [];
  const hrefPattern = /href=(?:"(\/[^"]*)"|\{\s*(?:`|")(\/[^`"]*)(?:`|")\s*\})/g;

  for (const file of files) {
    const contents = await readFile(file, "utf8");
    for (const match of contents.matchAll(hrefPattern)) {
      const href = match[1] ?? match[2];
      if (!href || href === "/") continue;
      if (href.startsWith("//")) {
        offenders.push(`${path.relative(process.cwd(), file)} -> ${href} (protocol relative)`);
        continue;
      }
      // Strip a query string or hash before matching the path.
      const bare = href.split(/[?#]/)[0].replace(/\/$/, "") || "/";
      if (!isServedBy(discovered, bare)) {
        offenders.push(`${path.relative(process.cwd(), file)} -> ${href}`);
      }
    }
  }

  assert.deepEqual(offenders, [], `internal links point at non-existent routes:\n${offenders.join("\n")}`);
});

test("server redirects and router.push targets resolve to real routes", async () => {
  const discovered = await routes();
  const files = (await walk(SOURCE_DIR)).filter((file) => /\.tsx?$/.test(file));
  const offenders: string[] = [];
  // redirect("/x"), router.push("/x"), router.replace("/x")
  const redirectPattern = /(?:redirect|router\.push|router\.replace)\(\s*(?:new URL\()?"(\/[^"]*)"/g;

  for (const file of files) {
    const contents = await readFile(file, "utf8");
    for (const match of contents.matchAll(redirectPattern)) {
      const href = match[1];
      if (href === "/" || href.includes("?")) continue;
      if (!isServedBy(discovered, href)) {
        offenders.push(`${path.relative(process.cwd(), file)} -> ${href}`);
      }
    }
  }

  assert.deepEqual(offenders, [], `redirects point at non-existent routes:\n${offenders.join("\n")}`);
});

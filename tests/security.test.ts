import assert from "node:assert/strict";
import test from "node:test";
import { getAppUrl, requireAppUrl } from "@/lib/app-url";
import { safeRedirectTarget } from "@/lib/routes";
import { isSameOrigin } from "@/lib/request-security";
import {
  buildRateLimitKey,
  clientIpFromHeaders,
  decide,
  decideForAuth,
  toKeySegment,
} from "@/lib/rate-limit";
import { createOpaqueToken, hashReviewToken } from "@/lib/tokens";

function withEnv(
  values: Record<string, string | undefined>,
  run: () => void,
) {
  const previous = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(values)) {
    previous.set(key, process.env[key]);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    run();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("production refuses to build links against a localhost app url", () => {
  withEnv(
    { NEXT_PUBLIC_APP_URL: "https://localhost:3000", NODE_ENV: "production" },
    () => {
      assert.throws(
        () => requireAppUrl(),
        /must not point at localhost/,
        "a localhost review link emailed to a client is unusable",
      );
    },
  );
});

test("production rejects plain http even for a real host", () => {
  withEnv({ NEXT_PUBLIC_APP_URL: "http://app.example.com", NODE_ENV: "production" }, () => {
    assert.throws(() => requireAppUrl(), /must use https/);
  });
});

test("production requires the app url to be set at all", () => {
  withEnv({ NEXT_PUBLIC_APP_URL: undefined, NODE_ENV: "production" }, () => {
    assert.throws(() => requireAppUrl(), /is required in production/);
  });
});

test("production accepts a real https app url and strips a trailing slash", () => {
  withEnv({ NEXT_PUBLIC_APP_URL: "https://app.example.com/", NODE_ENV: "production" }, () => {
    assert.equal(requireAppUrl(), "https://app.example.com");
  });
});

test("development falls back to localhost without throwing", () => {
  withEnv({ NEXT_PUBLIC_APP_URL: undefined, NODE_ENV: "development" }, () => {
    assert.equal(requireAppUrl(), "http://localhost:3000");
    assert.equal(getAppUrl(), "http://localhost:3000");
  });
});

test("a malformed app url is rejected rather than silently linked", () => {
  withEnv({ NEXT_PUBLIC_APP_URL: "not-a-url", NODE_ENV: "production" }, () => {
    assert.throws(() => requireAppUrl(), /absolute URL/);
  });
});

test("redirect targets are restricted to same-origin paths", () => {
  assert.equal(safeRedirectTarget("/projects"), "/projects");
  assert.equal(safeRedirectTarget("/projects?tab=files"), "/projects?tab=files");
  assert.equal(safeRedirectTarget(["/clients", "/projects"]), "/clients");
  assert.equal(safeRedirectTarget(undefined), null);

  // Anything that could bounce a freshly signed-in user off-site.
  assert.equal(safeRedirectTarget("//evil.example.com"), null);
  assert.equal(safeRedirectTarget("https://evil.example.com"), null);
  assert.equal(safeRedirectTarget("javascript:alert(1)"), null);
  assert.equal(safeRedirectTarget("/\\evil.example.com"), null);
  assert.equal(safeRedirectTarget("/path\r\nSet-Cookie: a=b"), null);
});

test("same-origin check accepts same host and rejects cross-origin posts", () => {
  const request = new Request("https://app.example.com/api/comments", {
    headers: { origin: "https://app.example.com" },
  });
  assert.equal(isSameOrigin(request), true);

  const crossOrigin = new Request("https://app.example.com/api/comments", {
    headers: { origin: "https://evil.example.com" },
  });
  assert.equal(isSameOrigin(crossOrigin), false);

  // Same-site but different scheme/port must not pass either.
  const differentPort = new Request("https://app.example.com/api/comments", {
    headers: { origin: "https://app.example.com:8443" },
  });
  assert.equal(isSameOrigin(differentPort), false);
});

test("review tokens are opaque, unguessable, and only ever stored hashed", () => {
  const tokens = new Set<string>();
  for (let i = 0; i < 200; i += 1) tokens.add(createOpaqueToken());

  assert.equal(tokens.size, 200, "token generation must not repeat");
  for (const token of tokens) {
    assert.match(token, /^[0-9a-f]{64}$/);
  }

  const token = createOpaqueToken();
  const hash = hashReviewToken(token);
  assert.equal(hash.length, 64);
  assert.notEqual(hash, token);
  assert.equal(hash, hashReviewToken(token), "hashing must be deterministic");
  assert.notEqual(hash, hashReviewToken(createOpaqueToken()));
});

test("state-changing routes fail closed when the limiter is unreachable", () => {
  // A missing migration must not silently remove the guard on the public
  // review endpoints, which mutate approvals without a session.
  assert.equal(decide("allowed"), true);
  assert.equal(decide("limited"), false);
  assert.equal(decide("unavailable"), false);
});

test("sign-in forms fail open on an outage but still honour an explicit limit", () => {
  // Locking every user out of login would be worse than briefly losing a layer
  // of throttling; Supabase Auth rate limits these calls itself.
  assert.equal(decideForAuth("allowed"), true);
  assert.equal(decideForAuth("unavailable"), true);
  assert.equal(decideForAuth("limited"), false);
});

test("caller addresses are validated rather than trusted", () => {
  const forwarded = (value: string) =>
    clientIpFromHeaders(new Headers({ "x-forwarded-for": value }));

  assert.equal(forwarded("203.0.113.7"), "203.0.113.7");
  assert.equal(forwarded("2001:DB8::1"), "2001:db8::1");
  assert.equal(
    forwarded("203.0.113.7, 70.41.3.18, 150.172.238.178"),
    "203.0.113.7",
    "the left-most entry is the original client",
  );

  // Junk in a spoofable header must not become a bucket key that can never be
  // written, which would let a caller bypass the limit entirely.
  assert.equal(forwarded("not-an-ip"), "unknown");
  assert.equal(forwarded("'; drop table rate_limit_buckets; --"), "unknown");
  assert.equal(forwarded("999.999.999.999.999"), "unknown");
  assert.equal(clientIpFromHeaders(new Headers()), "unknown");
});

test("rate limit keys stay valid for real-world identities", () => {
  // Regression: an email address was interpolated straight into the key, and
  // the safety check then rejected it because "@" is not a safe character. Every
  // signup and login failed with "Too many attempts" on the very first attempt.
  const SAFE_KEY = /^[A-Za-z0-9:._-]{1,200}$/;

  const keys = [
    buildRateLimitKey("auth", "signup", "account", "hamdan@example.com"),
    buildRateLimitKey("auth", "login", "account", "hamdan@example.com"),
    buildRateLimitKey("auth", "login", "burst", "203.0.113.7"),
    buildRateLimitKey("auth", "login", "burst", "2001:db8::1"),
    buildRateLimitKey("auth", "login", "burst", "unknown"),
    buildRateLimitKey("team", "invite", "198.51.100.4"),
    buildRateLimitKey("api", "versions", "203.0.113.7"),
    buildRateLimitKey(
      "review",
      "approve",
      "a".repeat(64),
      "203.0.113.7",
    ),
  ];

  for (const key of keys) {
    assert.match(
      key,
      SAFE_KEY,
      `key would be rejected and deny every request: ${key}`,
    );
  }
});

test("identity segments are hashed so emails are not stored in plaintext", () => {
  const key = buildRateLimitKey("auth", "login", "account", "hamdan@example.com");
  assert.ok(
    !key.includes("hamdan") && !key.includes("@"),
    "the bucket table must not persist account addresses",
  );
  // Hashing must stay deterministic, or per-account limits would not work.
  assert.equal(
    key,
    buildRateLimitKey("auth", "login", "account", "hamdan@example.com"),
  );
  // Case and surrounding whitespace must not create a second bucket.
  assert.equal(
    key,
    buildRateLimitKey("auth", "login", "account", "  Hamdan@Example.com "),
  );
  // Distinct addresses must still land in distinct buckets.
  assert.notEqual(
    key,
    buildRateLimitKey("auth", "login", "account", "someone@example.com"),
  );
});

test("an unbounded identity cannot overflow the key column", () => {
  const key = buildRateLimitKey(
    "auth",
    "login",
    "account",
    "x".repeat(100_000),
  );
  assert.ok(key.length <= 200, `key was ${key.length} characters`);
  assert.match(key, /^[A-Za-z0-9:._-]+$/);
});

test("safe segments are kept readable for debugging", () => {
  assert.equal(toKeySegment("203.0.113.7"), "203.0.113.7");
  assert.equal(toKeySegment("signup"), "signup");
  assert.equal(toKeySegment("a".repeat(64)), "a".repeat(64));
  assert.equal(toKeySegment("  "), "none");
  assert.equal(toKeySegment(""), "none");
});

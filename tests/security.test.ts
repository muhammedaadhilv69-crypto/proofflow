import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { getAppUrl, requireAppUrl } from "@/lib/app-url";
import { safeRedirectTarget } from "@/lib/routes";
import { isSameOrigin } from "@/lib/request-security";
import {
  buildRateLimitKey,
  checkRateLimit,
  clientIpFromHeaders,
  decide,
  decideForAuth,
  fromRequest,
  isSafeRateLimitKey,
  limitAuthenticatedRequest,
  limitReviewRequest,
} from "@/lib/rate-limit";
import { createOpaqueToken, hashReviewToken } from "@/lib/tokens";
import { loginSchema } from "@/lib/validation";

// Fixed so hashed segments are stable across a run and so the fallback warning
// does not fire during the suite.
process.env.RATE_LIMIT_KEY_SECRET ||= "test-only-rate-limit-secret";

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

/** Same as `withEnv`, but the body is awaited before the environment is restored. */
async function withEnvAsync(
  values: Record<string, string | undefined>,
  run: () => Promise<void>,
) {
  const previous = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(values)) {
    previous.set(key, process.env[key]);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    await run();
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

test("caller addresses are parsed rather than pattern-matched", () => {
  const forwarded = (value: string) =>
    clientIpFromHeaders(new Headers({ "x-forwarded-for": value }));

  assert.equal(forwarded("203.0.113.7"), "203.0.113.7");
  assert.equal(
    forwarded("203.0.113.7, 70.41.3.18, 150.172.238.178"),
    "203.0.113.7",
    "the left-most entry is the original client",
  );

  // Every one of these passed the old shape-only regexes and would have become
  // its own bucket, so the per-address ceilings could be rotated at will.
  for (const junk of [
    "not-an-ip",
    "deadbeef",
    "cafe",
    "00",
    "unknown",
    "999.999.999.999",
    "999.999.999.999.999",
    "01.2.3.04",
    "'; drop table rate_limit_buckets; --",
  ]) {
    assert.equal(forwarded(junk), null, `accepted a non-address: ${junk}`);
  }
  assert.equal(clientIpFromHeaders(new Headers()), null);
  assert.equal(clientIpFromHeaders(new Headers({ "x-real-ip": "nope" })), null);
});

test("one address is one bucket however it is spelled", () => {
  const forwarded = (value: string) =>
    clientIpFromHeaders(new Headers({ "x-forwarded-for": value }));

  // A limit that can be sidestepped by rewriting the address is not a limit.
  assert.equal(forwarded("2001:db8::1"), forwarded("2001:0db8:0:0:0:0:0:1"));
  assert.equal(forwarded("2001:DB8::1"), "2001:0db8:0000:0000:0000:0000:0000:0001");
  assert.equal(forwarded("::1"), "0000:0000:0000:0000:0000:0000:0000:0001");

  // Dual-stack proxies emit the IPv4 address in IPv6 form; it is the same host.
  assert.equal(forwarded("::ffff:203.0.113.7"), "203.0.113.7");
  assert.equal(forwarded("::FFFF:203.0.113.7"), "203.0.113.7");
  assert.equal(forwarded("::ffff:203.0.113.7"), forwarded("203.0.113.7"));
});

test("an unidentifiable caller is not bucketed against a shared ceiling", async () => {
  // Every caller that could not be identified used to land in one bucket named
  // "unknown", which a single client could exhaust to lock the whole platform
  // out of login and signup. The limiter is unreachable in this test, and a
  // request that still succeeds is a request that never reached it.
  await withEnvAsync(
    { NEXT_PUBLIC_SUPABASE_URL: undefined, SUPABASE_SERVICE_ROLE_KEY: undefined },
    async () => {
      assert.equal(
        await limitAuthenticatedRequest(
          new Request("https://app.example.com/api/versions"),
          "versions",
          30,
          60_000,
        ),
        true,
        "an unresolvable address must not become a shared bucket",
      );
      // With a real address the same call does reach the limiter, which fails
      // closed when it is unreachable.
      assert.equal(
        await limitAuthenticatedRequest(
          new Request("https://app.example.com/api/versions", {
            headers: { "x-forwarded-for": "203.0.113.7" },
          }),
          "versions",
          30,
          60_000,
        ),
        false,
      );
      // The review routes keep their per-token ceiling even with no address,
      // so dropping the address segment does not drop the limit.
      assert.equal(
        await limitReviewRequest(
          new Request("https://app.example.com/api/review/x/approve"),
          createOpaqueToken(),
          "approve",
          5,
          60_000,
        ),
        false,
      );
    },
  );
});

test("rate limit keys stay valid for real-world identities", () => {
  // Regression: an email address was interpolated straight into the key, and
  // the safety check then rejected it because "@" is not a safe character. Every
  // signup and login failed with "Too many attempts" on the very first attempt.
  const keys = [
    buildRateLimitKey("auth", "signup", "account", fromRequest("hamdan@example.com")),
    buildRateLimitKey("auth", "login", "account", fromRequest("hamdan@example.com")),
    buildRateLimitKey("auth", "login", "burst", fromRequest("203.0.113.7")),
    buildRateLimitKey("auth", "login", "burst", fromRequest("2001:db8::1")),
    buildRateLimitKey("team", "invite", fromRequest("198.51.100.4")),
    buildRateLimitKey("api", "versions", fromRequest("203.0.113.7")),
    buildRateLimitKey(
      "review",
      "approve",
      fromRequest(createOpaqueToken()),
      fromRequest("203.0.113.7"),
    ),
    // The shape a review key takes when no address could be resolved.
    buildRateLimitKey("review", "approve", fromRequest(createOpaqueToken())),
  ];

  for (const key of keys) {
    assert.ok(
      isSafeRateLimitKey(key),
      `key would be rejected and deny every request: ${key}`,
    );
  }
});

test("a bearer token never reaches the bucket table, however it looks", () => {
  // Regression: a review token is exactly 64 lowercase hex characters, which fit
  // the readable-segment width precisely, so it was written to bucket_key in
  // plaintext. Anyone reading the table could approve a client's deliverable.
  const token = createOpaqueToken();
  const key = buildRateLimitKey(
    "review",
    "approve",
    fromRequest(token),
    fromRequest("203.0.113.7"),
  );

  assert.ok(
    !key.includes(token),
    "a bearer credential must never be persisted in the bucket table",
  );
  assert.ok(!key.includes("@"), "nor should an account address");
  // Deterministic, or the per-token limit would never accumulate.
  assert.equal(
    key,
    buildRateLimitKey("review", "approve", fromRequest(token), fromRequest("203.0.113.7")),
  );
});

test("a hashed segment can never be spelled as a literal", () => {
  const email = "victim@example.com";
  const digest = createHash("sha256").update(email).digest("hex");

  // Both of these are 64 characters of the same alphabet. Without domain
  // separation an attacker could precompute the digest, spend the victim's
  // account quota, and lock that account out for the full window.
  assert.notEqual(
    buildRateLimitKey("auth", "login", "account", fromRequest(digest)),
    buildRateLimitKey("auth", "login", "account", fromRequest(email)),
  );

  // Passing a request value where a scope name belongs now fails loudly here
  // rather than in production.
  assert.throws(
    () => buildRateLimitKey("auth", email),
    /not a safe key segment/,
  );
});

test("scope names stay readable so a bucket can be identified by eye", () => {
  const key = buildRateLimitKey("auth", "login", "burst", fromRequest("203.0.113.7"));
  assert.ok(key.startsWith("auth:login:burst:h:"));
});

test("an unbounded identity cannot overflow the key column", () => {
  const key = buildRateLimitKey(
    "auth",
    "login",
    "account",
    fromRequest("x".repeat(100_000)),
  );
  assert.ok(key.length <= 200, `key was ${key.length} characters`);
  assert.ok(isSafeRateLimitKey(key));
});

test("a key too long for the column is folded, not truncated", () => {
  // Adding a segment must not be able to silently recreate the original outage,
  // where a key over the limit was rejected and denied every request.
  const wide = (last: string) =>
    buildRateLimitKey(
      ...Array.from({ length: 6 }, (_, i) => fromRequest(`identity-${i === 5 ? last : i}`)),
    );

  const key = wide("five");
  assert.ok(key.length <= 200, `key was ${key.length} characters`);
  assert.ok(isSafeRateLimitKey(key));
  // Folding keeps distinct keys distinct; truncating would merge them.
  assert.notEqual(key, wide("six"));
});

test("an unconfigured limiter is a decision, not an exception", async () => {
  // A missing service role key used to throw out of checkRateLimit, so the
  // deliberate fail-open path for sign-in never ran and a config mistake
  // presented as a total auth outage.
  await withEnvAsync(
    { NEXT_PUBLIC_SUPABASE_URL: undefined, SUPABASE_SERVICE_ROLE_KEY: undefined },
    async () => {
      const key = buildRateLimitKey("auth", "login", "burst", fromRequest("203.0.113.7"));
      assert.equal(await checkRateLimit(key, 20, 15 * 60_000), "unavailable");
      assert.equal(decideForAuth("unavailable"), true, "sign-in still fails open");
      assert.equal(decide("unavailable"), false, "state changes still fail closed");
    },
  );
});

test("a nonsensical limit is clamped rather than raised on", async () => {
  await withEnvAsync(
    { NEXT_PUBLIC_SUPABASE_URL: undefined, SUPABASE_SERVICE_ROLE_KEY: undefined },
    async () => {
      // The SQL function raises on anything non-positive, so an unclamped value
      // would surface as a Postgres exception and a 429 for the whole endpoint.
      const key = buildRateLimitKey("auth", "login", "burst", fromRequest("203.0.113.7"));
      for (const [limit, windowMs] of [
        [0, 15 * 60_000],
        [-1, 15 * 60_000],
        [Number.NaN, 15 * 60_000],
        [20, Number.NaN],
      ] as const) {
        assert.equal(await checkRateLimit(key, limit, windowMs), "unavailable");
      }
    },
  );
});

test("login rejects an unbounded address", () => {
  // The address is normalised and hashed on every attempt, so it has to be
  // bounded like every other email in the app.
  assert.equal(loginSchema.safeParse({ email: `${"a".repeat(300)}@example.com`, password: "x" }).success, false);
  assert.equal(loginSchema.safeParse({ email: "hamdan@example.com", password: "x" }).success, true);
});

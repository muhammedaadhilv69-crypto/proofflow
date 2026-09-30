import { createHash, createHmac } from "node:crypto";
import { isIP } from "node:net";
import { createAdminClient } from "@/lib/supabase/admin";

export type RateLimitDecision = "allowed" | "limited" | "unavailable";

/**
 * Keys are stored as Postgres text in `bucket_key`, so every character is
 * restricted to an alphabet that never needs escaping.
 *
 * The two tiers use different alphabets on purpose. A *literal* comes from this
 * codebase and is kept readable so a bucket can be identified by eye. A
 * *request* value is always HMAC'd, whatever it looks like. Deciding that from
 * the shape of the string is what previously let a review bearer token through
 * in plaintext, because `randomBytes(32).toString("hex")` is exactly 64
 * characters and so fit the readable width precisely.
 *
 * The two alphabets are disjoint in the one place it matters: `:` is not a legal
 * literal character, so a hashed segment can never be spelled as a literal and a
 * literal can never be mistaken for a digest. That is what stops
 * `fromRequest(sha256(x))` aliasing the bucket that `fromRequest(x)` produces.
 */
const SAFE_LITERAL = /^[A-Za-z0-9._-]{1,64}$/;
const SAFE_KEY = /^[A-Za-z0-9:._-]{1,200}$/;

/** A segment already reduced to a safe key fragment, tagged so it cannot be confused with a literal. */
export type RateLimitKeyPart = { readonly hashed: string };

/** Lets a rejected key be correlated across logs without ever writing it down. */
function fingerprintKey(key: string) {
  return createHash("sha256").update(key).digest("hex").slice(0, 12);
}

let warnedAboutSecret = false;

/**
 * Buckets must hash identically on every instance or the counters fragment
 * per instance and the limit stops meaning anything, so the secret has to come
 * from configuration rather than be generated.
 */
function hashingSecret() {
  const configured = process.env.RATE_LIMIT_KEY_SECRET;
  if (configured) return configured;

  // Reusing the service role key is not ideal key separation, but it is a real
  // server-side secret that is already required and already stable across
  // instances, which is strictly better than hashing with a public constant.
  const fallback = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (fallback) {
    if (!warnedAboutSecret) {
      warnedAboutSecret = true;
      console.warn(
        "RATE_LIMIT_KEY_SECRET is unset; falling back to SUPABASE_SERVICE_ROLE_KEY to hash rate limit segments",
      );
    }
    return fallback;
  }

  // Only reachable when the service role key is missing too, in which case the
  // limiter cannot reach the database at all. Still hashed, so nothing leaks
  // into a key that might still be logged by a caller.
  return "proofflow-rate-limit-unconfigured";
}

function hashedSegment(normalized: string): RateLimitKeyPart {
  return {
    hashed: `h:${createHmac("sha256", hashingSecret())
      .update(normalized)
      .digest("hex")}`,
  };
}

/**
 * Reduces any value that arrived from a request to a key segment.
 *
 * Every value passed here is hashed, whatever it looks like. The signature is
 * deliberately non-nullable: a caller that could not be identified must not
 * invent a placeholder, because a placeholder is a bucket every such caller
 * shares and any one of them can exhaust it on everyone's behalf. Callers
 * resolve the address first and skip the limit when there is none.
 */
export function fromRequest(value: string): RateLimitKeyPart {
  // Normalised so case and surrounding whitespace cannot create a second bucket
  // for the same account.
  return hashedSegment(value.trim().toLowerCase());
}

/**
 * A scope name from this codebase. Throws on anything else, so passing a raw
 * address or token by mistake fails here rather than in production.
 */
function literalSegment(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!SAFE_LITERAL.test(normalized)) {
    throw new Error(
      `Rate limit literal ${JSON.stringify(value)} is not a safe key segment; use fromRequest() for anything that came off the wire`,
    );
  }
  return normalized;
}

/**
 * Builds a rate-limit key that is guaranteed to pass `isSafeRateLimitKey`.
 *
 * Every caller must go through this. An earlier version interpolated raw email
 * addresses into the key, which the safety check then rejected, so every signup
 * and login failed with "Too many attempts" regardless of actual usage.
 */
export function buildRateLimitKey(...parts: (string | RateLimitKeyPart)[]) {
  const key = parts
    .map((part) => (typeof part === "string" ? literalSegment(part) : part.hashed))
    .join(":");

  // Bounded by construction for every real key here, but a caller adding a
  // segment must not be able to silently recreate that outage. Folding an
  // over-long key to a digest keeps distinct keys distinct; truncating would
  // merge unrelated callers into one bucket.
  if (SAFE_KEY.test(key)) return key;
  return `x:${createHash("sha256").update(key).digest("hex")}`;
}

/** Exported so tests check the same predicate the limiter enforces, not a copy of it. */
export function isSafeRateLimitKey(key: string) {
  return SAFE_KEY.test(key);
}

/**
 * Fixed-window counter stored in Postgres.
 *
 * The previous implementation kept buckets in a module-level Map, which resets
 * on every cold start and is not shared between instances, so a serverless or
 * multi-instance deployment had effectively no rate limiting at all. Storing the
 * counter in the database makes the limit both durable and cluster-wide.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitDecision> {
  if (!isSafeRateLimitKey(key)) {
    // Reaching this means a caller bypassed buildRateLimitKey. Fail closed, but
    // log loudly, because the symptom otherwise looks like real throttling. The
    // key itself is never logged: it can carry a credential or an address, and
    // console output reaches both the runtime log and Sentry breadcrumbs, which
    // scrubEvent does not cover.
    console.error(
      "Rate limit key rejected; use buildRateLimitKey to construct keys",
      { fingerprint: fingerprintKey(key) },
    );
    return "limited";
  }

  // Both values go to a function that raises on anything non-positive, so a
  // limit derived from config cannot turn into a 429 for the whole endpoint.
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.floor(limit)) : 1;
  const windowSeconds = Number.isFinite(windowMs)
    ? Math.max(1, Math.ceil(windowMs / 1000))
    : 60;

  try {
    const { data, error } = await createAdminClient().rpc("consume_rate_limit", {
      p_key: key,
      p_limit: safeLimit,
      p_window_seconds: windowSeconds,
    });

    if (error) {
      console.error("Rate limiter unavailable", {
        fingerprint: fingerprintKey(key),
        code: error.code,
        message: error.message,
      });
      return "unavailable";
    }

    return data === true ? "allowed" : "limited";
  } catch (cause) {
    // A missing env var or a network fault has to arrive as a decision, not as
    // a thrown error: the whole point of `decide` is that the caller chooses
    // fail-open or fail-closed from it. Letting this escape presents a config
    // mistake as a total auth outage instead of a degraded one.
    console.error("Rate limiter unavailable", {
      fingerprint: fingerprintKey(key),
      cause,
    });
    return "unavailable";
  }
}

/**
 * Resolves a caller address for rate-limit bucketing, or `null` when no valid
 * address is present.
 *
 * The value is attacker-controlled, so it is parsed rather than pattern-matched
 * and canonicalised rather than stored verbatim. A regex only ever checked the
 * shape, so `999.999.999.999` and `deadbeef` passed as addresses and each
 * spelling of one real IPv6 address became its own bucket. Two spellings of the
 * same host must produce the same bucket or the limit is trivially rotated.
 */
export function clientIpFromHeaders(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return canonicalIp(forwarded || headers.get("x-real-ip")?.trim() || "");
}

export function clientIpFrom(request: Request): string | null {
  return clientIpFromHeaders(request.headers);
}

function canonicalIp(candidate: string): string | null {
  const version = isIP(candidate);
  if (version === 4) return candidate;
  if (version !== 6) return null;

  const lower = candidate.toLowerCase();
  // Dual-stack proxies commonly emit the IPv4 address in IPv6 form. It is the
  // same host, so it has to land in the same bucket as the bare address.
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(lower);
  if (mapped) return isIP(mapped[1]) === 4 ? mapped[1] : null;

  return expandIpv6(lower);
}

/**
 * Renders an IPv6 address as eight full hextets, so `2001:db8::1` and
 * `2001:0db8:0:0:0:0:0:1` collapse onto one bucket. `isIP` has already
 * validated the input; the shape checks are belt and braces.
 */
function expandIpv6(address: string): string | null {
  const compression = address.indexOf("::");
  if (compression !== address.lastIndexOf("::")) return null;

  if (compression === -1) {
    const hextets = address.split(":");
    return hextets.length === 8
      ? hextets.map((h) => h.padStart(4, "0")).join(":")
      : null;
  }

  const head = address.slice(0, compression).split(":").filter(Boolean);
  const tail = address.slice(compression + 2).split(":").filter(Boolean);
  const missing = 8 - head.length - tail.length;
  if (missing < 1) return null;

  return [...head, ...Array<string>(missing).fill("0"), ...tail]
    .map((h) => h.padStart(4, "0"))
    .join(":");
}

/**
 * Fail-closed decision, used wherever the request would mutate client-visible
 * state without a session. An absent limiter must not become an absent guard.
 */
export function decide(decision: RateLimitDecision) {
  return decision === "allowed";
}

/**
 * Fail-open decision, used only for the password and sign-in forms.
 *
 * Locking every user out of login because the limiter is unreachable would be a
 * worse outcome than briefly losing an extra layer of throttling, and Supabase
 * Auth applies its own rate limiting to these calls. An explicit "limited" is
 * still always honoured.
 */
export function decideForAuth(decision: RateLimitDecision) {
  return decision !== "limited";
}

/**
 * Per-IP limit on an authenticated route, before the session is read.
 *
 * An unresolvable address is allowed through rather than bucketed: a
 * per-address limit means nothing for a caller that cannot be identified, and a
 * placeholder bucket would be one shared ceiling any single client could exhaust
 * on everyone's behalf. The session check this sits behind is the real control.
 */
export async function limitAuthenticatedRequest(
  request: Request,
  scope: string,
  limit: number,
  windowMs: number,
) {
  const address = clientIpFrom(request);
  if (address === null) return true;

  const decision = await checkRateLimit(
    buildRateLimitKey("api", scope, fromRequest(address)),
    limit,
    windowMs,
  );
  return decide(decision);
}

/** Per-IP, per-review-token limit on the public review routes. */
export async function limitReviewRequest(
  request: Request,
  reviewToken: string,
  scope: string,
  limit: number,
  windowMs: number,
) {
  const address = clientIpFrom(request);
  const decision = await checkRateLimit(
    buildRateLimitKey(
      "review",
      scope,
      // The token is a bearer credential, so it is hashed like any other request
      // value. review_tokens stores only token_hash; writing the token itself
      // into the bucket table would undo that everywhere the table is read.
      fromRequest(reviewToken),
      // Dropped rather than replaced when the caller cannot be identified, so
      // the per-token ceiling below still holds and no shared bucket is created.
      ...(address === null ? [] : [fromRequest(address)]),
    ),
    limit,
    windowMs,
  );
  return decide(decision);
}

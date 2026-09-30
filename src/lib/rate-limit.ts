import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export type RateLimitDecision = "allowed" | "limited" | "unavailable";

/**
 * Keys are stored as Postgres text and used in `bucket_key`, so segments are
 * restricted to characters that never need escaping. A segment that does not
 * already qualify is hashed rather than dropped, which keeps distinct values
 * distinct instead of collapsing unrelated callers into one bucket.
 */
const SAFE_SEGMENT = /^[A-Za-z0-9._-]{1,64}$/;
const SAFE_KEY = /^[A-Za-z0-9:._-]{1,200}$/;

/** Matches a dotted-quad or IPv6 address; anything else is not an address. */
const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;
const IPV6 = /^[0-9A-Fa-f:]{2,45}$/;

/**
 * Normalises one key segment. Emails and other PII are hashed so the bucket
 * table never stores an address in plaintext, while staying deterministic so
 * per-account limits still work.
 */
export function toKeySegment(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "none";
  if (SAFE_SEGMENT.test(normalized)) return normalized;
  return createHash("sha256").update(normalized).digest("hex");
}

/**
 * Builds a rate-limit key that is guaranteed to pass `SAFE_KEY`.
 *
 * Every caller must go through this. An earlier version interpolated raw email
 * addresses into the key, which the safety check then rejected, so every signup
 * and login failed with "Too many attempts" regardless of actual usage.
 */
export function buildRateLimitKey(...segments: string[]) {
  return segments.map(toKeySegment).join(":");
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
  if (!SAFE_KEY.test(key)) {
    // Reaching this means a caller bypassed buildRateLimitKey. Fail closed, but
    // log loudly, because the symptom otherwise looks like real throttling.
    console.error(
      "Rate limit key rejected; use buildRateLimitKey to construct keys",
      { key },
    );
    return "limited";
  }

  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));
  const { data, error } = await createAdminClient().rpc("consume_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error("Rate limiter unavailable", {
      key,
      code: error.code,
      message: error.message,
    });
    return "unavailable";
  }

  return data === true ? "allowed" : "limited";
}

/**
 * Resolves a caller address for rate-limit bucketing.
 *
 * The value is attacker-controlled, so it is validated rather than trusted: a
 * header carrying junk is bucketed as "unknown" instead of producing a key that
 * can never be written. Callers sharing a real address then still share a
 * bucket, which is the safe direction to fail.
 */
export function clientIpFromHeaders(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const candidate = forwarded || headers.get("x-real-ip")?.trim() || "";
  if (!candidate) return "unknown";
  if (IPV4.test(candidate) || IPV6.test(candidate)) return candidate.toLowerCase();
  return "unknown";
}

export function clientIpFrom(request: Request) {
  return clientIpFromHeaders(request.headers);
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

/** Per-IP limit on an authenticated route, before the session is read. */
export async function limitAuthenticatedRequest(
  request: Request,
  scope: string,
  limit: number,
  windowMs: number,
) {
  const decision = await checkRateLimit(
    buildRateLimitKey("api", scope, clientIpFrom(request)),
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
  const decision = await checkRateLimit(
    buildRateLimitKey(
      "review",
      scope,
      reviewToken,
      clientIpFrom(request),
    ),
    limit,
    windowMs,
  );
  return decide(decision);
}

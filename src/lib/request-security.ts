import { NextResponse } from "next/server"
import { clientIpFrom, limitReviewRequest } from "@/lib/rate-limit"

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin")
  if (!origin) return true
  try {
    return new URL(origin).host === new URL(request.url).host
  } catch {
    return false
  }
}

export type ReviewGuard = { ok: true; ip: string | null } | { ok: false; response: NextResponse }

/**
 * Shared preflight for the public review-token endpoints.
 *
 * These routes are reachable without a session, so they need a custom-header
 * check (cheap CSRF mitigation, since the token is a bearer credential), a JSON
 * content-type requirement, and a per-token, per-IP limit.
 */
export async function guardReviewAction(
  request: Request,
  reviewToken: string,
  scope: string,
  limit: number,
  windowMs: number,
): Promise<ReviewGuard> {
  if (request.headers.get("x-proofflow-request") !== "1" || !request.headers.get("content-type")?.startsWith("application/json")) {
    return { ok: false, response: NextResponse.json({ error: "Invalid request" }, { status: 415 }) }
  }

  if (!(await limitReviewRequest(request, reviewToken, scope, limit, windowMs))) {
    return { ok: false, response: NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 }) }
  }

  return { ok: true, ip: clientIpFrom(request) }
}

export function requestUserAgent(request: Request) {
  return request.headers.get("user-agent")?.slice(0, 512) ?? undefined
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T
  } catch {
    return null
  }
}

import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { changeRequestSchema } from "@/lib/validation"
import { trackEvent } from "@/lib/analytics"
import { notifyAgencyOfClientEvent } from "@/lib/review-actions"
import { guardReviewAction, readJson, requestUserAgent } from "@/lib/request-security"

export const runtime = "nodejs"

export async function POST(request: Request, { params }: { params: Promise<{ reviewToken: string }> }) {
  const { reviewToken } = await params
  const guard = await guardReviewAction(request, reviewToken, "changes", 5, 60_000)
  if (!guard.ok) return guard.response

  const body = await readJson<{ body?: string }>(request)
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  const parsed = changeRequestSchema.safeParse({ body: body.body || "" })
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Change request is invalid" }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin.rpc("add_review_comment", {
    p_token: reviewToken,
    p_body: parsed.data.body,
    p_change_request: true,
    p_ip_address: guard.ip === "unknown" ? undefined : guard.ip,
    p_user_agent: requestUserAgent(request),
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 409 })
  const versionId = (data as { version_id?: string } | null)?.version_id || ""
  await trackEvent("change_request_created", { version_id: versionId })
  await notifyAgencyOfClientEvent({ versionId, message: "A client requested changes to a deliverable.", subject: "Changes requested in ProofFlow" })
  return NextResponse.json({ success: true, status: "CHANGES_REQUESTED" })
}

import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { trackEvent } from "@/lib/analytics"
import { notifyAgencyOfClientEvent } from "@/lib/review-actions"
import { guardReviewAction, requestUserAgent } from "@/lib/request-security"

export const runtime = "nodejs"

export async function POST(request: Request, { params }: { params: Promise<{ reviewToken: string }> }) {
  const { reviewToken } = await params
  const guard = await guardReviewAction(request, reviewToken, "approve", 5, 60_000)
  if (!guard.ok) return guard.response

  const admin = createAdminClient()
  const { data, error } = await admin.rpc("approve_version", {
    p_token: reviewToken,
    p_ip_address: guard.ip ?? undefined,
    p_user_agent: requestUserAgent(request),
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 409 })
  const result = data as { id?: string; approval_number?: string; version_id?: string; status?: string }
  await trackEvent("approval_created", { approval_id: result.id || "", version_id: result.version_id || "" })
  await notifyAgencyOfClientEvent({ versionId: result.version_id || "", message: "A client approved a deliverable version.", subject: "A client approved a version" })
  return NextResponse.json({ success: true, approval: result })
}

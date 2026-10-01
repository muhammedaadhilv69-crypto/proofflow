export type VersionStatus = "IN_REVIEW" | "APPROVED" | "LOCKED";

export type ApprovalCheck =
  | { allowed: true }
  | {
      allowed: false;
      reason: "already_approved" | "not_current" | "not_in_review" | "closed";
    };

export function nextVersionNumber(versions: Array<{ versionNumber: number }>) {
  return (
    versions.reduce(
      (highest, version) => Math.max(highest, version.versionNumber),
      0,
    ) + 1
  );
}

export function isVersionLocked(
  version: { status?: string },
  approvalExists: boolean,
) {
  return (
    approvalExists ||
    version.status === "APPROVED" ||
    version.status === "LOCKED"
  );
}

export function canApproveVersion(
  version: { status?: string },
  isCurrent: boolean,
  approvalExists: boolean,
  deliverableStatus?: string,
): ApprovalCheck {
  if (
    approvalExists ||
    version.status === "APPROVED" ||
    version.status === "LOCKED"
  ) {
    return { allowed: false, reason: "already_approved" };
  }
  if (!isCurrent) return { allowed: false, reason: "not_current" };
  if (version.status && version.status !== "IN_REVIEW")
    return { allowed: false, reason: "not_in_review" };
  if (deliverableStatus === "ARCHIVED")
    return { allowed: false, reason: "closed" };
  return { allowed: true };
}

export function statusAfterNewVersion() {
  return "IN_REVIEW" as const;
}

export function statusAfterChangeRequest() {
  return "CHANGES_REQUESTED" as const;
}

/**
 * What an agency member should do about a deliverable next.
 *
 * The dashboard leads with this rather than with status, because "In review"
 * tells you where something is while "Send the review link" tells you what to
 * do about it. A worklist that only reports state is a report; one that names
 * the action is a to-do list.
 */
export type AgencyAction = {
  intent: "upload" | "send-review" | "wait" | "none";
  label: string;
};

export function nextAgencyAction(
  deliverableStatus: string,
  hasLiveReviewLink: boolean,
): AgencyAction {
  switch (deliverableStatus) {
    case "DRAFT":
      return { intent: "upload", label: "Upload the first version" };
    case "CHANGES_REQUESTED":
      return { intent: "upload", label: "Upload the next version" };
    case "IN_REVIEW":
      return hasLiveReviewLink
        ? { intent: "wait", label: "Waiting on the client" }
        : { intent: "send-review", label: "Send the review link" };
    default:
      return { intent: "none", label: "Nothing to do" };
  }
}

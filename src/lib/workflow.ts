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

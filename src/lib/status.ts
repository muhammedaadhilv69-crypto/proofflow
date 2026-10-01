/**
 * The state vocabulary.
 *
 * Every status in ProofFlow resolves here and nowhere else. Three things make
 * this the load-bearing file of the design system.
 *
 * 1. The database splits state across two enums. `deliverables.status` is the
 *    project's own workflow (DRAFT → IN_REVIEW → CHANGES_REQUESTED → APPROVED
 *    → ARCHIVED) while `versions.status` only records what happened to a
 *    particular proof (IN_REVIEW, APPROVED, LOCKED). "Changes requested" is
 *    therefore *never* a version status — it is inferred from a change-request
 *    comment and the deliverable's current pointer. `versionState()` below is
 *    the only place that inference happens, so "which version did the client
 *    approve?" has exactly one answer.
 *
 * 2. Colour is assigned by what a state means, never by which colour reads
 *    well. Approved is ink — the darkest thing on the page — because an
 *    approval is a stamp, not a success notification. Changes requested is
 *    process magenta: a revision round, not a failure. Nothing is green except
 *    the tint on the approval seal.
 *
 * 3. Wording depends on who is reading. An agency looking at a live proof sees
 *    "With client". The client looking at the same row sees "Awaiting your
 *    review", because internal workflow language means nothing to the person
 *    who has to approve it.
 */

export type Audience = "agency" | "client";

export type DeliverableStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "CHANGES_REQUESTED"
  | "APPROVED"
  | "ARCHIVED";

export type VersionStatus = "IN_REVIEW" | "APPROVED" | "LOCKED";

export type ProjectStatus = "ACTIVE" | "COMPLETED" | "ARCHIVED";

export type TokenStatus = "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";

export type Role = "OWNER" | "MEMBER";

/** How much visual weight a state earns on the page. */
export type Weight = "quiet" | "live" | "final";

type StateMeta = {
  /** Agency-facing wording. */
  agency: string;
  /** Client-facing wording. */
  client: string;
  /** Tailwind text colour. A literal class so the scanner finds it. */
  text: string;
  /** Tailwind wash for a state chip's ground. */
  wash: string;
  weight: Weight;
};

const STATES = {
  DRAFT: {
    agency: "Draft",
    client: "Draft",
    text: "text-ink-faint",
    wash: "bg-wash",
    weight: "quiet",
  },
  IN_REVIEW: {
    agency: "With client",
    client: "Awaiting your review",
    text: "text-waiting",
    wash: "bg-waiting-wash",
    weight: "live",
  },
  CHANGES_REQUESTED: {
    agency: "Changes requested",
    client: "You asked for changes",
    text: "text-revise",
    wash: "bg-revise-wash",
    weight: "live",
  },
  APPROVED: {
    agency: "Approved",
    client: "Approved",
    text: "text-ink",
    wash: "bg-seal",
    weight: "final",
  },
  SUPERSEDED: {
    agency: "Superseded",
    client: "Superseded",
    text: "text-ink-faint",
    wash: "bg-wash",
    weight: "quiet",
  },
  ARCHIVED: {
    agency: "Archived",
    client: "Archived",
    text: "text-ink-faint",
    wash: "bg-wash",
    weight: "quiet",
  },
  ACTIVE: {
    agency: "Active",
    client: "Active",
    text: "text-signal",
    wash: "bg-signal-wash",
    weight: "live",
  },
  COMPLETED: {
    agency: "Complete",
    client: "Complete",
    text: "text-ink",
    wash: "bg-wash",
    weight: "final",
  },
  PENDING: {
    agency: "Link ready",
    client: "Link active",
    text: "text-waiting",
    wash: "bg-waiting-wash",
    weight: "live",
  },
  ACCEPTED: {
    agency: "Opened",
    client: "Opened",
    text: "text-signal",
    wash: "bg-signal-wash",
    weight: "live",
  },
  REVOKED: {
    agency: "Revoked",
    client: "Revoked",
    text: "text-ink-faint",
    wash: "bg-wash",
    weight: "quiet",
  },
  EXPIRED: {
    agency: "Expired",
    client: "Expired",
    text: "text-ink-faint",
    wash: "bg-wash",
    weight: "quiet",
  },
  OWNER: {
    agency: "Owner",
    client: "Owner",
    text: "text-ink",
    wash: "bg-wash",
    weight: "final",
  },
  MEMBER: {
    agency: "Member",
    client: "Member",
    text: "text-ink-soft",
    wash: "bg-wash",
    weight: "quiet",
  },
} as const satisfies Record<string, StateMeta>;

export type StateKey = keyof typeof STATES;

/**
 * `versions.status` LOCKED means "this proof is no longer the live one". On a
 * page that reads oddly next to an approved proof, which is also locked, so it
 * is presented as SUPERSEDED.
 */
export function stateKeyForVersionStatus(status: string): StateKey {
  return status === "LOCKED" ? "SUPERSEDED" : (status as StateKey);
}

export function stateMeta(key: StateKey): StateMeta {
  return STATES[key];
}

export function stateLabel(key: StateKey, audience: Audience = "agency") {
  return STATES[key][audience];
}

export function stateText(key: StateKey) {
  return STATES[key].text;
}

export function stateWash(key: StateKey) {
  return STATES[key].wash;
}

export function stateWeight(key: StateKey) {
  return STATES[key].weight;
}

export function isFinal(key: StateKey) {
  return STATES[key].weight === "final";
}

/** True when a client can still comment on, request changes on, or approve. */
export function isActionable(key: StateKey) {
  return key === "DRAFT" || key === "IN_REVIEW" || key === "CHANGES_REQUESTED";
}

type VersionRow = {
  id: string;
  version_number: number;
  status: string;
  approval?: unknown;
  comments?: Array<{ comment_type?: string | null }> | null;
};

/**
 * Resolve the state a version should be *shown* as.
 *
 * The raw column is not enough on its own, so this reconciles three sources in
 * a fixed precedence:
 *
 *   1. An approval record always wins. It exists only if a client approved that
 *      exact version, and it makes the proof final forever.
 *   2. Otherwise, the deliverable's current pointer tells us whether this proof
 *      is still live. If it is, the deliverable's own status describes it.
 *   3. Otherwise it has been replaced. A replaced proof that drew a
 *      change request is reported as one — that round genuinely ended in
 *      changes — and any other replaced proof is simply superseded.
 */
export function versionState(
  version: VersionRow,
  currentVersionId: string | null,
  deliverableStatus: string,
): StateKey {
  if (version.approval) return "APPROVED";
  if (version.status === "APPROVED") return "APPROVED";

  if (currentVersionId && version.id === currentVersionId) {
    if (deliverableStatus === "CHANGES_REQUESTED") return "CHANGES_REQUESTED";
    if (deliverableStatus === "ARCHIVED") return "ARCHIVED";
    return "IN_REVIEW";
  }

  const askedForChanges = version.comments?.some(
    (comment) => comment.comment_type === "CHANGE_REQUEST",
  );
  return askedForChanges ? "CHANGES_REQUESTED" : "SUPERSEDED";
}

/** Short form used in the revision rail, where the column is narrow. */
export function versionStateShort(key: StateKey) {
  switch (key) {
    case "APPROVED":
      return "Approved";
    case "CHANGES_REQUESTED":
      return "Changes";
    case "IN_REVIEW":
      return "With client";
    case "SUPERSEDED":
      return "Superseded";
    case "ARCHIVED":
      return "Archived";
    default:
      return "Draft";
  }
}

export function roleLabel(role: string) {
  return role === "OWNER" ? "Owner" : "Member";
}
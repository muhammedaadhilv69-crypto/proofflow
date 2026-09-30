import { Badge } from "@/components/ui/badge";

const labels: Record<string, string> = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
  DRAFT: "Draft",
  IN_REVIEW: "In review",
  CHANGES_REQUESTED: "Changes requested",
  APPROVED: "Approved",
  LOCKED: "Superseded",
  OWNER: "Owner",
  MEMBER: "Member",
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REVOKED: "Revoked",
  EXPIRED: "Expired",
};

const variants: Record<
  string,
  "default" | "secondary" | "destructive" | "outline" | "success" | "warning"
> = {
  ACTIVE: "default",
  COMPLETED: "success",
  ARCHIVED: "secondary",
  DRAFT: "outline",
  IN_REVIEW: "warning",
  CHANGES_REQUESTED: "destructive",
  APPROVED: "success",
  LOCKED: "secondary",
  OWNER: "default",
  MEMBER: "secondary",
  PENDING: "warning",
  ACCEPTED: "success",
  REVOKED: "secondary",
  EXPIRED: "outline",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={variants[status] || "outline"}>
      {labels[status] || status}
    </Badge>
  );
}

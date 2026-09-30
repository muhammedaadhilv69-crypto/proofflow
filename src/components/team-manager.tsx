"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X } from "lucide-react";
import {
  removeMemberAction,
  revokeInvitationAction,
  updateMemberRoleAction,
  type TeamActionResult,
} from "@/actions/team";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/utils";

export type MemberRow = {
  userId: string;
  email: string;
  fullName: string | null;
  role: "OWNER" | "MEMBER";
  joinedAt: string;
  isSelf: boolean;
};

export type InvitationRow = {
  id: string;
  email: string;
  expiresAt: string;
  status: "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";
};

function displayName(row: MemberRow) {
  return row.fullName?.trim() || row.email.split("@")[0] || "Member";
}

export function TeamManager({
  workspaceId,
  members,
  invitations,
  canManage,
}: {
  workspaceId: string;
  members: MemberRow[];
  invitations: InvitationRow[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState("");

  async function run(
    key: string,
    action: (data: FormData) => Promise<TeamActionResult>,
    fields: Record<string, string>,
  ) {
    setBusyKey(key);
    setError("");
    const data = new FormData();
    data.set("workspaceId", workspaceId);
    for (const [name, value] of Object.entries(fields)) data.set(name, value);
    const result = await action(data);
    if (result?.error) setError(result.error);
    setBusyKey("");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {error ? (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      <div className="space-y-3">
        <h3 className="text-sm font-medium">Members ({members.length})</h3>
        <ul className="divide-y rounded-lg border">
          {members.map((member) => (
            <li
              key={member.userId}
              className="flex flex-wrap items-center justify-between gap-3 p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {displayName(member)}
                  {member.isSelf ? (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      you
                    </span>
                  ) : null}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {member.email}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {canManage ? (
                  <Select
                    value={member.role}
                    onValueChange={(role) =>
                      run(
                        `role:${member.userId}`,
                        updateMemberRoleAction,
                        {
                          userId: member.userId,
                          role: role === "OWNER" ? "OWNER" : "MEMBER",
                        },
                      )
                    }
                    disabled={busyKey !== ""}
                  >
                    <SelectTrigger
                      className="h-8 w-28"
                      aria-label={`Role for ${member.email}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OWNER">Owner</SelectItem>
                      <SelectItem value="MEMBER">Member</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <StatusBadge status={member.role} />
                )}
                {canManage && !member.isSelf ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${member.email}`}
                    disabled={busyKey !== ""}
                    onClick={() =>
                      run(
                        `remove:${member.userId}`,
                        removeMemberAction,
                        { userId: member.userId },
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {invitations.length ? (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Invitations</h3>
          <ul className="divide-y rounded-lg border">
            {invitations.map((invitation) => (
              <li
                key={invitation.id}
                className="flex flex-wrap items-center justify-between gap-3 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm">{invitation.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {invitation.status === "PENDING"
                      ? `Expires ${formatDateTime(invitation.expiresAt)}`
                      : invitation.status === "ACCEPTED"
                        ? "Accepted"
                        : invitation.status === "REVOKED"
                          ? "Revoked"
                          : "Expired"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={invitation.status} />
                  {canManage && invitation.status === "PENDING" ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Revoke invitation for ${invitation.email}`}
                      disabled={busyKey !== ""}
                      onClick={() =>
                        run(
                          `revoke:${invitation.id}`,
                          revokeInvitationAction,
                          { invitationId: invitation.id },
                        )
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

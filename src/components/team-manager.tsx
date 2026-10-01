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
import { StateChip } from "@/components/state-chip";
import { FormError } from "@/components/ui/field";
import { initials, formatDateSlug } from "@/lib/utils";
import type { StateKey } from "@/lib/status";

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

/**
 * Removing a teammate is irreversible, so the button is danger-coloured and
 * separately labelled per person rather than a generic trash icon in a row of
 * identical icons — a screen reader user needs to hear *which* member.
 */
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
    <div className="space-y-8">
      {error ? <FormError>{error}</FormError> : null}

      <section>
        <h3 className="label-narrow text-xs font-medium text-ink">
          Members ({members.length})
        </h3>
        <ul className="mt-3 divide-y divide-rule rounded-sheet border border-rule">
          {members.map((member) => (
            <li
              key={member.userId}
              className="flex flex-wrap items-center gap-3 px-4 py-3"
            >
              <span
                aria-hidden="true"
                className="grid size-7 shrink-0 place-items-center rounded-full bg-wash text-[0.625rem] font-semibold text-ink-soft"
              >
                {initials(displayName(member))}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink">
                  {displayName(member)}
                  {member.isSelf ? (
                    <span className="ml-2 text-xs font-normal text-ink-faint">
                      you
                    </span>
                  ) : null}
                </span>
                <span className="slug block truncate">
                  {member.email} / joined {formatDateSlug(member.joinedAt)}
                </span>
              </span>
              {canManage && !member.isSelf ? (
                <Select
                  value={member.role}
                  onValueChange={(role) =>
                    run(`role:${member.userId}`, updateMemberRoleAction, {
                      userId: member.userId,
                      role: role === "OWNER" ? "OWNER" : "MEMBER",
                    })
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
                <StateChip state={member.role as StateKey} />
              )}
              {canManage && !member.isSelf ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${member.email} from the workspace`}
                  disabled={busyKey !== ""}
                  onClick={() =>
                    run(`remove:${member.userId}`, removeMemberAction, {
                      userId: member.userId,
                    })
                  }
                >
                  <Trash2 aria-hidden="true" className="text-destructive" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {invitations.length ? (
        <section>
          <h3 className="label-narrow text-xs font-medium text-ink">
            Invitations ({invitations.length})
          </h3>
          <ul className="mt-3 divide-y divide-rule rounded-sheet border border-rule">
            {invitations.map((invitation) => (
              <li
                key={invitation.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-ink">
                    {invitation.email}
                  </span>
                  <span className="slug block truncate">
                    {invitation.status === "PENDING"
                      ? `expires ${formatDateSlug(invitation.expiresAt)}`
                      : invitation.status.toLowerCase()}
                  </span>
                </span>
                <StateChip state={invitation.status as StateKey} />
                {canManage && invitation.status === "PENDING" ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Revoke the invitation for ${invitation.email}`}
                    disabled={busyKey !== ""}
                    onClick={() =>
                      run(`revoke:${invitation.id}`, revokeInvitationAction, {
                        invitationId: invitation.id,
                      })
                    }
                  >
                    <X aria-hidden="true" />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
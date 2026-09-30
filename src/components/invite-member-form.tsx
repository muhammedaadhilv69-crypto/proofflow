"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inviteMemberAction } from "@/actions/team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InviteMemberForm({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fallbackLink, setFallbackLink] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    setFallbackLink("");

    const data = new FormData();
    data.set("workspaceId", workspaceId);
    data.set("email", email);
    const result = await inviteMemberAction(data);

    if (result && result.error) {
      setError(result.error);
    } else if (result && result.success) {
      setMessage(result.message ?? "Invitation sent");
      if (result.inviteUrl) setFallbackLink(result.inviteUrl);
      setEmail("");
    }

    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {message ? (
        <p
          role="status"
          className="rounded-md bg-green-50 p-3 text-sm text-green-700"
        >
          {message}
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}
      {fallbackLink ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <p>
            The invitation was created but could not be emailed. Share this link
            directly:
          </p>
          <p className="mt-2 break-all font-mono text-xs">{fallbackLink}</p>
        </div>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="invite-email">Teammate email</Label>
        <Input
          id="invite-email"
          type="email"
          autoComplete="off"
          placeholder="teammate@agency.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          disabled={loading}
        />
        <p className="text-xs text-muted-foreground">
          Invitations expire after 7 days and always grant member access. Owners
          are promoted from this page after joining.
        </p>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Sending..." : "Send invitation"}
      </Button>
    </form>
  );
}

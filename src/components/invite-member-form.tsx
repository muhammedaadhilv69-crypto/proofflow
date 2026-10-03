"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { inviteMemberAction } from "@/actions/team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/ui/field";
import { useToast } from "@/hooks/use-toast";

export function InviteMemberForm({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const { toast } = useToast();
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
      toast({ variant: "success", title: "Invitation sent" });
    }

    setLoading(false);
    router.refresh();
  }

  async function copyFallback() {
    try {
      await navigator.clipboard.writeText(fallbackLink);
      toast({ variant: "success", title: "Invitation link copied" });
    } catch {
      toast({
        variant: "destructive",
        title: "Could not copy the link",
        description: "Select it and copy it manually.",
      });
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {message ? (
        <p
          role="status"
          className="rounded-field bg-signal-wash px-4 py-3 text-sm leading-relaxed text-ink"
        >
          {message}
        </p>
      ) : null}
      {error ? <FormError>{error}</FormError> : null}

      {fallbackLink ? (
        <div className="rounded-field border border-waiting/40 bg-waiting-wash px-4 py-3">
          <p className="text-sm leading-relaxed text-ink">
            The invitation was created but could not be emailed. Send this link
            to them yourself.
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Input
              readOnly
              value={fallbackLink}
              aria-label="Invitation link"
              onFocus={(event) => event.currentTarget.select()}
              className="font-mono text-xs"
            />
            <Button type="button" variant="outline" size="sm" onClick={copyFallback}>
              <Copy aria-hidden="true" />
              Copy
            </Button>
          </div>
        </div>
      ) : null}

      <Field
        label="Teammate email"
        required
        hint="Invitations expire after 7 days and grant member access. Promote them to owner afterwards from the list below."
      >
        {({ id, describedBy }) => (
          <Input
            id={id}
            aria-describedby={describedBy}
            type="email"
            autoComplete="off"
            placeholder="teammate@studio.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={loading}
            invalid={Boolean(error)}
          />
        )}
      </Field>

      <Button type="submit" disabled={loading}>
        {loading ? "Sending" : "Send invitation"}
      </Button>
    </form>
  );
}
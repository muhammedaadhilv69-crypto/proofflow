"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError } from "@/components/ui/field";
import { useToast } from "@/hooks/use-toast";

export function AgencyCommentForm({
  workspaceId,
  versionId,
}: {
  workspaceId: string;
  versionId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim()) {
      setError("Write something before posting.");
      return;
    }
    setLoading(true);
    setError("");
    const response = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId, versionId, body }),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(result.error || "The comment was not posted. Try again.");
    } else {
      setBody("");
      toast({
        variant: "success",
        title: "Comment posted",
        description: "The client sees it on this version.",
      });
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="space-y-2.5">
      {error ? <FormError>{error}</FormError> : null}
      <Field label="Reply to the client">
        {({ id }) => (
          <Textarea
            id={id}
            rows={3}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="What you changed, or what you need from them"
            disabled={loading}
            invalid={Boolean(error)}
          />
        )}
      </Field>
      <Button type="submit" size="sm" disabled={loading}>
        {loading ? "Posting" : "Post comment"}
      </Button>
    </form>
  );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function AgencyCommentForm({
  workspaceId,
  versionId,
}: {
  workspaceId: string;
  versionId: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId, versionId, body }),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) setError(result.error || "Comment could not be added");
    else {
      setBody("");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Textarea
        aria-label="Comment"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Add a comment for the client"
        required
        disabled={loading}
      />
      <Button type="submit" size="sm" disabled={loading}>
        {loading ? "Posting..." : "Post comment"}
      </Button>
    </form>
  );
}

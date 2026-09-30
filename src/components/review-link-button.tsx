"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ReviewLinkButton({
  workspaceId,
  versionId,
}: {
  workspaceId: string;
  versionId: string;
}) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  async function createLink() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId, versionId }),
    });
    const result = (await response.json()) as {
      reviewUrl?: string;
      error?: string;
      emailSent?: boolean;
    };
    if (!response.ok) setError(result.error || "Could not create review link");
    else {
      setUrl(result.reviewUrl || "");
      setEmailSent(result.emailSent ?? false);
    }
    setLoading(false);
  }

  async function copyLink() {
    if (url) await navigator.clipboard.writeText(url);
  }

  return (
    <div className="space-y-2">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {url ? (
        <>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              aria-label="Review link"
              readOnly
              value={url}
              className="h-9 min-w-0 flex-1 rounded-md border bg-muted px-3 text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyLink}
            >
              Copy link
            </Button>
          </div>
          {emailSent === false ? (
            <p className="text-xs text-muted-foreground">
              The link was created, but email is not configured or the provider
              failed. Copy and send it manually.
            </p>
          ) : null}
        </>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={createLink}
          disabled={loading}
        >
          {loading ? "Creating..." : "Create review link"}
        </Button>
      )}
    </div>
  );
}

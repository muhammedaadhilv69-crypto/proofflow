"use client";

import { useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/ui/field";
import { useToast } from "@/hooks/use-toast";

/**
 * Creating a review link is the hinge of the whole workflow, so it is stated as
 * a sentence rather than a button label: the agency needs to know that the link
 * opens a specific version, for a named client, and needs no account.
 *
 * The generated URL is shown in a monospaced field because it is meant to be
 * copied and pasted somewhere, not read.
 */
export function ReviewLinkButton({
  workspaceId,
  versionId,
  clientName,
}: {
  workspaceId: string;
  versionId: string;
  clientName?: string | null;
}) {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

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
    if (!response.ok) {
      setError(result.error || "The review link could not be created.");
    } else {
      setUrl(result.reviewUrl || "");
      toast({
        variant: "success",
        title: "Review link created",
        description: result.emailSent
          ? `Sent to ${clientName ?? "your client"}.`
          : "Copy it and send it to your client yourself.",
      });
    }
    setLoading(false);
  }

  async function copyLink() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        variant: "destructive",
        title: "Could not copy the link",
        description: "Select the link and copy it manually.",
      });
    }
  }

  if (url) {
    return (
      <div className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            readOnly
            value={url}
            aria-label="Review link"
            onFocus={(event) => event.currentTarget.select()}
            className="font-mono text-xs"
          />
          <Button
            type="button"
            variant={copied ? "secondary" : "outline"}
            onClick={copyLink}
            className="shrink-0"
          >
            {copied ? (
              <Check aria-hidden="true" />
            ) : (
              <Copy aria-hidden="true" />
            )}
            {copied ? "Copied" : "Copy link"}
          </Button>
        </div>
        <p className="slug">anyone with this link can review this version</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {error ? <FormError>{error}</FormError> : null}
      <Button
        type="button"
        variant="outline"
        onClick={createLink}
        disabled={loading}
      >
        <Link2 aria-hidden="true" />
        {loading ? "Creating" : "Create review link"}
      </Button>
    </div>
  );
}
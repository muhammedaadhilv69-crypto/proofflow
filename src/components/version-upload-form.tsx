"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function VersionUploadForm({
  workspaceId,
  deliverableId,
}: {
  workspaceId: string;
  deliverableId: string;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Choose a file first");
      return;
    }
    setLoading(true);
    setError("");
    const data = new FormData();
    data.set("workspaceId", workspaceId);
    data.set("deliverableId", deliverableId);
    data.set("description", description);
    data.set("file", file);
    const response = await fetch("/api/versions", {
      method: "POST",
      body: data,
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) setError(result.error || "Upload failed");
    else {
      setFile(null);
      setDescription("");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error ? (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="version-file">File</Label>
        <Input
          id="version-file"
          type="file"
          accept="image/png,image/jpeg,image/webp,application/pdf,image/svg+xml"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
          required
          disabled={loading}
        />
        <p className="text-xs text-muted-foreground">
          PNG, JPG, WebP, PDF, or SVG up to 25 MB.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="version-description">
          What changed?{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="version-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          disabled={loading}
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Uploading..." : "Upload new version"}
      </Button>
    </form>
  );
}

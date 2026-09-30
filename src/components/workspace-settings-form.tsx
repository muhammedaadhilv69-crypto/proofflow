"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateWorkspaceAction } from "@/actions/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function WorkspaceSettingsForm({
  workspaceId,
  name,
  canEdit,
}: {
  workspaceId: string;
  name: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(name);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    const data = new FormData();
    data.set("workspaceId", workspaceId);
    data.set("name", value);
    const result = await updateWorkspaceAction(data);
    if (result && "error" in result && result.error) setError(result.error);
    else setMessage("Settings saved");
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
      <div className="space-y-2">
        <Label htmlFor="workspace-name">Workspace name</Label>
        <Input
          id="workspace-name"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={!canEdit || loading}
        />
      </div>
      {!canEdit ? (
        <p className="text-sm text-muted-foreground">
          Only the workspace owner can change these settings.
        </p>
      ) : (
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save settings"}
        </Button>
      )}
    </form>
  );
}

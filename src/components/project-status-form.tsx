"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProjectAction } from "@/actions/workspace";
import { Button } from "@/components/ui/button";

export function ProjectStatusForm({
  workspaceId,
  projectId,
  status,
}: {
  workspaceId: string;
  projectId: string;
  status: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData();
    data.set("workspaceId", workspaceId);
    data.set("projectId", projectId);
    data.set("status", value);
    const result = await updateProjectAction(data);
    if (result && "error" in result && result.error) setError(result.error);
    else router.refresh();
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="flex items-end gap-2">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div>
        <label
          htmlFor="project-status"
          className="mb-1 block text-xs font-medium text-muted-foreground"
        >
          Project status
        </label>
        <select
          id="project-status"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>
      <Button type="submit" size="sm" variant="outline" disabled={loading}>
        {loading ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}

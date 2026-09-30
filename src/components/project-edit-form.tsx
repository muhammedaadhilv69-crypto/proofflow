"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProjectDetailsAction } from "@/actions/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProjectRecord } from "@/lib/data";

export function ProjectEditForm({
  workspaceId,
  project,
}: {
  workspaceId: string;
  project: ProjectRecord;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: project.name,
    description: project.description || "",
    dueDate: project.due_date ? project.due_date.slice(0, 10) : "",
  });
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
    data.set("projectId", project.id);
    data.set("name", form.name);
    data.set("description", form.description);
    data.set("dueDate", form.dueDate);
    const result = await updateProjectDetailsAction(data);
    if (result && "error" in result && result.error) setError(result.error);
    else setMessage("Project updated");
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
        <Label htmlFor="edit-project-name">Project name</Label>
        <Input
          id="edit-project-name"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          disabled={loading}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-project-description">Description</Label>
        <Textarea
          id="edit-project-description"
          value={form.description}
          onChange={(event) =>
            setForm({ ...form, description: event.target.value })
          }
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-project-due">Due date</Label>
        <Input
          id="edit-project-due"
          type="date"
          value={form.dueDate}
          onChange={(event) =>
            setForm({ ...form, dueDate: event.target.value })
          }
          disabled={loading}
        />
      </div>
      <Button type="submit" size="sm" disabled={loading}>
        {loading ? "Saving..." : "Save project"}
      </Button>
    </form>
  );
}

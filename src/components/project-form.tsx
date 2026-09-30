"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProjectAction } from "@/actions/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ClientRecord } from "@/lib/data";

export function ProjectForm({
  workspaceId,
  clients,
}: {
  workspaceId: string;
  clients: ClientRecord[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    clientId: clients[0]?.id || "",
    description: "",
    dueDate: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData();
    data.set("workspaceId", workspaceId);
    Object.entries(form).forEach(([key, value]) => data.set(key, value));
    const result = await createProjectAction(data);
    if (result && "error" in result && result.error) setError(result.error);
    else if (result && "id" in result && result.id)
      router.push(`/projects/${result.id}`);
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
        <Label htmlFor="project-name">Project name</Label>
        <Input
          id="project-name"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          required
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="project-client">Client</Label>
        <select
          id="project-client"
          value={form.clientId}
          onChange={(event) =>
            setForm({ ...form, clientId: event.target.value })
          }
          required
          disabled={loading}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Choose a client</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name} ({client.email})
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="project-description">
          Description{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="project-description"
          value={form.description}
          onChange={(event) =>
            setForm({ ...form, description: event.target.value })
          }
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="project-due">
          Due date{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="project-due"
          type="date"
          value={form.dueDate}
          onChange={(event) =>
            setForm({ ...form, dueDate: event.target.value })
          }
          disabled={loading}
        />
      </div>
      <Button type="submit" disabled={loading || !clients.length}>
        {loading ? "Creating..." : "Create project"}
      </Button>
      {!clients.length ? (
        <p className="text-sm text-muted-foreground">
          Create a client before creating a project.
        </p>
      ) : null}
    </form>
  );
}

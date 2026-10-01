"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProjectDetailsAction } from "@/actions/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError } from "@/components/ui/field";
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
    description: project.description ?? "",
    dueDate: project.due_date ? project.due_date.slice(0, 10) : "",
  });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const dirty =
    form.name !== project.name ||
    form.description !== (project.description ?? "") ||
    form.dueDate !== (project.due_date ? project.due_date.slice(0, 10) : "");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setSaved(false);
    setError("");
    const data = new FormData();
    data.set("workspaceId", workspaceId);
    data.set("projectId", project.id);
    data.set("name", form.name);
    data.set("description", form.description);
    data.set("dueDate", form.dueDate);
    const result = await updateProjectDetailsAction(data);
    if (result && "error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setSaved(true);
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error ? <FormError>{error}</FormError> : null}
      {saved ? (
        <p role="status" className="text-sm text-ink-soft">
          Project details saved.
        </p>
      ) : null}

      <Field label="Name" required>
        {({ id }) => (
          <Input
            id={id}
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
            disabled={loading}
          />
        )}
      </Field>

      <Field label="Description" hint="Optional.">
        {({ id, describedBy }) => (
          <Textarea
            id={id}
            aria-describedby={describedBy}
            rows={3}
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
            disabled={loading}
          />
        )}
      </Field>

      <Field label="Due date" hint="Optional.">
        {({ id, describedBy }) => (
          <Input
            id={id}
            aria-describedby={describedBy}
            type="date"
            value={form.dueDate}
            onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
            disabled={loading}
          />
        )}
      </Field>

      <Button type="submit" size="sm" disabled={loading || !dirty}>
        {loading ? "Saving" : "Save details"}
      </Button>
    </form>
  );
}
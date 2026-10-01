"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createProjectAction } from "@/actions/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FormError } from "@/components/ui/field";
import { useToast } from "@/hooks/use-toast";
import type { ClientRecord } from "@/lib/data";

export function ProjectForm({
  workspaceId,
  clients,
}: {
  workspaceId: string;
  clients: ClientRecord[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "",
    clientId: clients[0]?.id ?? "",
    description: "",
    dueDate: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const noClients = clients.length === 0;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData();
    data.set("workspaceId", workspaceId);
    Object.entries(form).forEach(([key, value]) => data.set(key, value));
    const result = await createProjectAction(data);
    if (result && "error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    if (result && "id" in result && result.id) {
      toast({
        variant: "success",
        title: "Project created",
        description: "Add a deliverable to start collecting approvals.",
      });
      router.push(`/projects/${result.id}`);
      return;
    }
    setLoading(false);
  }

  if (noClients) {
    return (
      <FormError>
        A project needs a client. Add one first, then come back to create the
        project.
      </FormError>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error ? <FormError>{error}</FormError> : null}

      <Field label="Project name" required>
        {({ id }) => (
          <Input
            id={id}
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Northwind rebrand"
            required
            disabled={loading}
          />
        )}
      </Field>

      <Field
        label="Client"
        required
        hint="This is who will receive the review links."
      >
        {({ id, describedBy }) => (
          <Select
            value={form.clientId}
            onValueChange={(value) => setForm({ ...form, clientId: value })}
            disabled={loading}
          >
            <SelectTrigger id={id} aria-describedby={describedBy}>
              <SelectValue placeholder="Choose a client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name} · {client.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </Field>

      <Field
        label="Description"
        hint="Optional. Only your team sees this."
      >
        {({ id, describedBy }) => (
          <Textarea
            id={id}
            aria-describedby={describedBy}
            rows={3}
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
            placeholder="Homepage refresh and brand guide, due end of quarter"
            disabled={loading}
          />
        )}
      </Field>

      <Field label="Due date" hint="Optional. Shown on the projects list.">
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

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Creating" : "Create project"}
        </Button>
        <Button asChild variant="ghost" disabled={loading}>
          <Link href="/projects">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
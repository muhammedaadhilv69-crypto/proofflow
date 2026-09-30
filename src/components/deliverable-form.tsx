"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDeliverableAction } from "@/actions/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function DeliverableForm({
  workspaceId,
  projectId,
}: {
  workspaceId: string;
  projectId: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", description: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData();
    data.set("workspaceId", workspaceId);
    data.set("projectId", projectId);
    data.set("name", form.name);
    data.set("description", form.description);
    const result = await createDeliverableAction(data);
    if (result && "error" in result && result.error) setError(result.error);
    else {
      router.refresh();
      setForm({ name: "", description: "" });
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
        <Label htmlFor="deliverable-name">Name</Label>
        <Input
          id="deliverable-name"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          required
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="deliverable-description">
          Description{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="deliverable-description"
          value={form.description}
          onChange={(event) =>
            setForm({ ...form, description: event.target.value })
          }
          disabled={loading}
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Adding..." : "Add deliverable"}
      </Button>
    </form>
  );
}

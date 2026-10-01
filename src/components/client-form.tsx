"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientAction, updateClientAction } from "@/actions/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/ui/field";
import { useToast } from "@/hooks/use-toast";

type ClientValue = {
  id?: string;
  name?: string;
  email?: string;
  company?: string | null;
};

export function ClientForm({
  workspaceId,
  client,
  onSaved,
}: {
  workspaceId: string;
  client?: ClientValue;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: client?.name ?? "",
    email: client?.email ?? "",
    company: client?.company ?? "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const editing = Boolean(client?.id);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData();
    data.set("workspaceId", workspaceId);
    data.set("name", form.name);
    data.set("email", form.email);
    data.set("company", form.company);
    if (client?.id) data.set("clientId", client.id);
    const result = editing
      ? await updateClientAction(data)
      : await createClientAction(data);

    if (result && "error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    toast({
      variant: "success",
      title: editing ? "Client updated" : "Client added",
      description: editing
        ? undefined
        : "You can create a project for them now.",
    });
    onSaved?.();
    if (!onSaved) router.push("/clients");
    else router.refresh();
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error ? <FormError>{error}</FormError> : null}

      <Field label="Name" required hint="The person who will approve work.">
        {({ id, describedBy }) => (
          <Input
            id={id}
            aria-describedby={describedBy}
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Mira Vance"
            required
            disabled={loading}
          />
        )}
      </Field>

      <Field
        label="Email"
        required
        hint="Approval records store this address as proof of who signed off."
      >
        {({ id, describedBy }) => (
          <Input
            id={id}
            aria-describedby={describedBy}
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            placeholder="mira@northwind.com"
            required
            disabled={loading}
          />
        )}
      </Field>

      <Field label="Company" hint="Optional.">
        {({ id, describedBy }) => (
          <Input
            id={id}
            aria-describedby={describedBy}
            value={form.company}
            onChange={(event) => setForm({ ...form, company: event.target.value })}
            placeholder="Northwind Coffee"
            disabled={loading}
          />
        )}
      </Field>

      <Button type="submit" disabled={loading}>
        {loading ? "Saving" : editing ? "Save changes" : "Add client"}
      </Button>
    </form>
  );
}
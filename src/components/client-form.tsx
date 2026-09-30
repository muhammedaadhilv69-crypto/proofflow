"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientAction, updateClientAction } from "@/actions/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ClientValue = {
  id?: string;
  name?: string;
  email?: string;
  company?: string | null;
};

export function ClientForm({
  workspaceId,
  client,
}: {
  workspaceId: string;
  client?: ClientValue;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: client?.name || "",
    email: client?.email || "",
    company: client?.company || "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    const result = client?.id
      ? await updateClientAction(data)
      : await createClientAction(data);
    if (result && "error" in result && result.error) setError(result.error);
    else router.push("/clients");
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
        <Label htmlFor="client-name">Name</Label>
        <Input
          id="client-name"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          required
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="client-email">Email</Label>
        <Input
          id="client-email"
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          required
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="client-company">
          Company{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="client-company"
          value={form.company}
          onChange={(event) =>
            setForm({ ...form, company: event.target.value })
          }
          disabled={loading}
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : client?.id ? "Save changes" : "Create client"}
      </Button>
    </form>
  );
}

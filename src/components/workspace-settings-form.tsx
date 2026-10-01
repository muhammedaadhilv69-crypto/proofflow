"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { updateWorkspaceAction } from "@/actions/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/ui/field";

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
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const dirty = value.trim() !== name;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setSaved(false);
    setError("");
    const data = new FormData();
    data.set("workspaceId", workspaceId);
    data.set("name", value);
    const result = await updateWorkspaceAction(data);
    if (result && "error" in result && result.error) setError(result.error);
    else setSaved(true);
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error ? <FormError>{error}</FormError> : null}
      {saved ? (
        <p
          role="status"
          className="flex items-center gap-1.5 text-sm text-ink-soft"
        >
          <Check aria-hidden="true" className="size-4 text-seal-mark" />
          Workspace renamed.
        </p>
      ) : null}

      <Field
        label="Workspace name"
        hint="Shown to your team and used in the review links you send."
      >
        {({ id, describedBy }) => (
          <Input
            id={id}
            aria-describedby={describedBy}
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setSaved(false);
            }}
            disabled={!canEdit || loading}
          />
        )}
      </Field>

      {canEdit ? (
        <Button type="submit" disabled={loading || !dirty || !value.trim()}>
          {loading ? "Saving" : "Save name"}
        </Button>
      ) : null}
    </form>
  );
}
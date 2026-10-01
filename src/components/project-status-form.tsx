"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProjectAction } from "@/actions/workspace";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormError } from "@/components/ui/field";

const OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Complete" },
  { value: "ARCHIVED", label: "Archived" },
];

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

  const dirty = value !== status;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData();
    data.set("workspaceId", workspaceId);
    data.set("projectId", projectId);
    data.set("status", value);
    const result = await updateProjectAction(data);
    if (result && "error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <label htmlFor="project-status" className="sr-only">
        Project status
      </label>
      <Select
        value={value}
        onValueChange={setValue}
        disabled={loading}
      >
        <SelectTrigger id="project-status" className="h-8 w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="submit"
        size="sm"
        variant="outline"
        disabled={loading || !dirty}
      >
        {loading ? "Saving" : "Update"}
      </Button>
      {error ? <FormError>{error}</FormError> : null}
    </form>
  );
}
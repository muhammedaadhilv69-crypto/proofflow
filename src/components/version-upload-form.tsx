"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError } from "@/components/ui/field";
import { useToast } from "@/hooks/use-toast";
import { formatBytes } from "@/lib/utils";

/**
 * Uploading a proof is the slowest thing a user does in this product, so it is
 * the one place a progress readout earns its space. `fetch` cannot report
 * upload progress, so this posts through XMLHttpRequest; the percentage is real
 * bytes sent, not a timer.
 */
export function VersionUploadForm({
  workspaceId,
  deliverableId,
}: {
  workspaceId: string;
  deliverableId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const busy = progress !== null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Choose a file to upload.");
      return;
    }

    setError("");
    setProgress(0);

    const data = new FormData();
    data.set("workspaceId", workspaceId);
    data.set("deliverableId", deliverableId);
    data.set("description", description);
    data.set("file", file);

    try {
      const result = await postWithProgress("/api/versions", data, setProgress);
      if (!result.ok) {
        setError(result.error || "The upload did not finish. Try again.");
        setProgress(null);
        return;
      }
      setFile(null);
      setDescription("");
      setProgress(null);
      if (fileRef.current) fileRef.current.value = "";
      toast({
        variant: "success",
        title: "Version uploaded",
        description: "The client can now review it once you send the review link.",
      });
      router.refresh();
    } catch {
      setError("The upload could not reach the server. Check your connection.");
      setProgress(null);
    }
  }

  const drop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error ? <FormError>{error}</FormError> : null}

      <Field
        label="Proof file"
        required
        hint="PNG, JPG, WebP, PDF, or SVG up to 25 MB."
        error={!file && error.includes("file") ? error : undefined}
      >
        {({ id, describedBy, invalid }) => (
          <div className="space-y-2">
            <label
              htmlFor={id}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={drop}
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-field border border-dashed px-6 py-8 text-center transition-colors ${
                dragging
                  ? "border-signal bg-signal-wash"
                  : "border-rule-strong bg-sheet hover:border-ink-faint"
              } ${invalid ? "border-destructive" : ""}`}
            >
              <Upload aria-hidden="true" className="size-4 text-ink-faint" />
              <span className="text-sm text-ink-soft">
                {file ? file.name : "Choose a file or drop it here"}
              </span>
              {file ? (
                <span className="slug">{formatBytes(file.size)}</span>
              ) : (
                <span className="slug">or drag from your desktop</span>
              )}
            </label>
            <input
              ref={fileRef}
              id={id}
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf,image/svg+xml"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              disabled={busy}
              required
              className="sr-only"
            />
          </div>
        )}
      </Field>

      <Field
        label="What changed"
        hint="One line the client will read before they open the file."
      >
        {({ id, describedBy }) => (
          <Textarea
            id={id}
            aria-describedby={describedBy}
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={busy}
            placeholder="Darkened the headline and swapped the hero image"
          />
        )}
      </Field>

      {progress !== null ? (
        <UploadProgress progress={progress} />
      ) : null}

      <Button type="submit" disabled={busy} block>
        {busy
          ? "Uploading"
          : file
            ? "Upload this version"
            : "Upload a version"}
      </Button>
    </form>
  );
}

function UploadProgress({ progress }: { progress: number }) {
  const done = progress >= 100;
  return (
    <div>
      <div
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Upload progress"
        className="h-1 w-full overflow-hidden rounded-full bg-wash"
      >
        <div
          className="h-full bg-signal transition-[width] duration-150"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <p className="slug mt-1.5">
        {done ? "processing" : "sending"} {Math.round(Math.min(progress, 100))}%
      </p>
    </div>
  );
}

function postWithProgress(
  url: string,
  data: FormData,
  onProgress: (value: number) => void,
): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", url);
    request.withCredentials = true;

    request.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) return;
      // Cap at 99 so the bar never claims completion before the server has
      // actually processed the upload.
      onProgress(Math.min((event.loaded / event.total) * 100, 99));
    });

    request.addEventListener("load", () => {
      onProgress(100);
      let body: { error?: string } = {};
      try {
        body = JSON.parse(request.responseText) as { error?: string };
      } catch {
        body = {};
      }
      resolve({
        ok: request.status >= 200 && request.status < 300,
        error: body.error,
      });
    });

    request.addEventListener("error", () => reject(new Error("network")));
    request.addEventListener("abort", () => reject(new Error("aborted")));

    request.send(data);
  });
}
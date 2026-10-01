"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, MessageSquare, TriangleAlert } from "lucide-react";
import type { ReviewData } from "@/lib/data";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Wordmark } from "@/components/wordmark";
import { ApprovalSeal } from "@/components/approval-seal";
import { FilePreview } from "@/components/file-preview";
import { CommentItem } from "@/components/comment-item";
import { SlugLine } from "@/components/slug-line";

/**
 * The client review page.
 *
 * This surface is not a smaller version of the app. It has no navigation, no
 * workspace, no project tree and none of the internal vocabulary that comes
 * with them, because the person reading it is a client who has agreed to look at
 * one file and give a yes or a no. Everything on the page exists to answer one
 * of three questions: what am I looking at, how do I tell them what I think, and
 * what happens when I press approve.
 *
 * Two choices carry most of the weight.
 *
 * The version is named in the title, not in a badge. "Version 4" in the heading
 * means the client cannot mistake this for a general sign-off.
 *
 * Approving is confirmed in a dialog that restates the version and says plainly
 * that it cannot be changed afterwards. That is not friction for its own sake —
 * it is the moment the record becomes permanent, so it should feel like one.
 */
export function ReviewClient({ data }: { data: ReviewData }) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [changeRequest, setChangeRequest] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState<"comment" | "changes" | "approve" | "">("");
  const [approveOpen, setApproveOpen] = useState(false);
  const [changesOpen, setChangesOpen] = useState(false);

  const version = data.version.version_number;

  async function post(
    path: string,
    body: Record<string, string>,
    intent: "comment" | "changes" | "approve",
  ) {
    setPending(intent);
    setError("");
    try {
      const response = await fetch(`/api/review/${data.token}/${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-ProofFlow-Request": "1",
        },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error || "That did not go through. Try again.");
        return false;
      }
      return true;
    } catch {
      setError("That did not go through. Check your connection and try again.");
      return false;
    } finally {
      setPending("");
    }
  }

  async function submitComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!comment.trim()) {
      setError("Write your note before posting it.");
      return;
    }
    if (await post("comment", { body: comment }, "comment")) {
      setComment("");
      router.refresh();
    }
  }

  async function submitChanges(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await post("request-changes", { body: changeRequest }, "changes")) {
      setChangeRequest("");
      setChangesOpen(false);
      router.refresh();
    }
  }

  async function approve() {
    if (await post("approve", {}, "approve")) {
      setApproveOpen(false);
      router.refresh();
    }
  }

  const busy = Boolean(pending);

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-rule bg-sheet">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <Wordmark showName={false} />
          <p className="label-narrow text-[0.6875rem] text-ink-faint">
            Secure review link
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-40 pt-8 sm:px-6 sm:pb-16 sm:pt-10">
        <div className="space-y-1.5">
          <p className="label-narrow text-[0.6875rem] text-ink-faint">
            {data.project.name}
          </p>
          <h1 className="text-[1.625rem] font-semibold leading-[1.15] tracking-[-0.02em] text-ink sm:text-3xl">
            {data.deliverable.name}
          </h1>
          <SlugLine
            className="pt-1.5"
            items={[
              { key: "version", value: version, tone: "strong" },
              { key: "prepared for", value: data.client.name },
              {
                key: "state",
                value: data.approval
                  ? "approved"
                  : data.canAct
                    ? "awaiting your review"
                    : "closed",
              },
            ]}
          />
        </div>

        <div className="mt-8">
          <div className="overflow-hidden rounded-sheet border border-rule bg-sheet shadow-proof">
            <FilePreview
              url={data.signedFileUrl}
              mimeType={data.version.file?.mime_type || "application/octet-stream"}
              filename={data.version.file?.original_filename || "The file"}
              className="[&>*:first-child]:rounded-none [&>*:first-child]:border-0 [&>*:first-child]:shadow-none"
            />
          </div>
          {data.version.file ? (
            <p className="slug mt-2">{data.version.file.original_filename}</p>
          ) : null}
        </div>

        {data.version.description ? (
          <section className="mt-8">
            <h2 className="slug-key">What changed in this version</h2>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
              {data.version.description}
            </p>
          </section>
        ) : null}

        {data.approval ? (
          <section className="mt-10">
            <ApprovalSeal
              approval={data.approval}
              deliverableName={data.deliverable.name}
              versionNumber={version}
              projectName={data.project.name}
            />
          </section>
        ) : null}

        <section className="mt-10">
          <h2 className="label-narrow text-xs font-medium text-ink">
            {data.comments.length
              ? `Comments (${data.comments.length})`
              : "Comments"}
          </h2>
          {data.comments.length ? (
            <ul className="mt-3 space-y-4 border-l border-rule pl-4">
              {data.comments.map((item) => (
                <li key={item.id}>
                  <CommentItem comment={item} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-ink-faint">
              No comments yet. Anything you write here goes to the agency
              alongside version {version}.
            </p>
          )}

          {data.canAct ? (
            <form onSubmit={submitComment} className="mt-6 space-y-2.5">
              <Field label="Add a comment" error={error || undefined}>
                {({ id, invalid }) => (
                  <Textarea
                    id={id}
                    rows={3}
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder={`Your note about version ${version}`}
                    disabled={busy}
                    invalid={invalid}
                  />
                )}
              </Field>
              <Button type="submit" size="sm" disabled={busy}>
                <MessageSquare aria-hidden="true" />
                {pending === "comment" ? "Posting" : "Post comment"}
              </Button>
            </form>
          ) : null}
        </section>

        {!data.canAct && !data.approval ? (
          <section className="mt-10 rounded-sheet border border-rule bg-sheet px-5 py-4">
            <h2 className="text-sm font-medium text-ink">
              This review is closed
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              {data.unavailableReason ||
                "The agency has closed this link. They will send you a new one when the next version is ready."}
            </p>
          </section>
        ) : null}
      </main>

      {data.canAct ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-sheet/95 px-4 py-3 backdrop-blur sm:static sm:mt-10 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
          <div className="mx-auto max-w-3xl sm:px-6">
            <div className="mx-auto max-w-xl rounded-sheet border border-rule bg-sheet px-4 py-3.5 shadow-lift sm:border-none sm:bg-transparent sm:p-0 sm:shadow-none">
              <p className="text-sm leading-relaxed text-ink-soft">
                Approving accepts version {version} exactly as it appears
                above. It cannot be changed afterwards.
              </p>
              {error && pending === "" ? (
                <div className="mt-3">
                  <FormError>{error}</FormError>
                </div>
              ) : null}
              <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={() => setChangesOpen(true)}
                  disabled={busy}
                  className="sm:flex-1"
                >
                  <TriangleAlert aria-hidden="true" />
                  Request changes
                </Button>
                <Button
                  size="lg"
                  onClick={() => setApproveOpen(true)}
                  disabled={busy}
                  className="sm:flex-1"
                >
                  <Check aria-hidden="true" />
                  Approve version {version}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <Dialog open={changesOpen} onOpenChange={setChangesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>What needs to change?</DialogTitle>
            <DialogDescription>
              Tell the agency what to fix. Your note stays attached to version{" "}
              {version}, and they will send you the next one.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitChanges} className="space-y-4">
            <Field
              label="Your change request"
              required
              hint={`At least 10 characters. ${changeRequest.trim().length}/10`}
              error={error || undefined}
            >
              {({ id, describedBy, invalid }) => (
                <Textarea
                  id={id}
                  aria-describedby={describedBy}
                  rows={4}
                  value={changeRequest}
                  onChange={(event) => setChangeRequest(event.target.value)}
                  placeholder="The headline should be the other option, and the background needs more contrast."
                  disabled={busy}
                  invalid={invalid}
                  minLength={10}
                />
              )}
            </Field>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setChangesOpen(false)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={busy || changeRequest.trim().length < 10}
              >
                {pending === "changes" ? "Sending" : "Send change request"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Approve {data.deliverable.name} version {version}?
            </DialogTitle>
            <DialogDescription>
              ProofFlow records your name, the version number, and the time. The
              approval cannot be withdrawn or edited.
            </DialogDescription>
          </DialogHeader>
          <dl className="space-y-2 rounded-control bg-wash px-4 py-3">
            <div className="flex items-baseline gap-2">
              <dt className="slug-key">approving</dt>
              <dd className="text-sm text-ink">{data.client.name}</dd>
            </div>
            <div className="flex items-baseline gap-2">
              <dt className="slug-key">version</dt>
              <dd className="font-mono text-sm tabular-nums text-ink">
                {version}
              </dd>
            </div>
            <div className="flex items-baseline gap-2">
              <dt className="slug-key">recorded</dt>
              <dd className="font-mono text-xs tabular-nums text-ink-soft">
                {formatDateTime(new Date().toISOString())}
              </dd>
            </div>
          </dl>
          {error ? <FormError>{error}</FormError> : null}
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setApproveOpen(false)}
              disabled={busy}
            >
              Not yet
            </Button>
            <Button onClick={approve} disabled={busy}>
              <Check aria-hidden="true" />
              {pending === "approve" ? "Approving" : `Approve version ${version}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
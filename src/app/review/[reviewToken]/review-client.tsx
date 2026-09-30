"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  LockKeyhole,
  MessageSquare,
  Send,
  TriangleAlert,
} from "lucide-react";
import type { ReviewData } from "@/lib/data";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { FilePreview } from "@/components/file-preview";
import { CommentItem } from "@/components/comment-item";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ReviewClient({ data }: { data: ReviewData }) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [changeRequest, setChangeRequest] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");
  const [approvalOpen, setApprovalOpen] = useState(false);

  async function post(
    path: string,
    body: Record<string, string>,
    state: string,
  ) {
    setLoading(state);
    setError("");
    const response = await fetch(`/api/review/${data.token}/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-ProofFlow-Request": "1",
      },
      body: JSON.stringify(body),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok)
      setError(result.error || "Something went wrong. Please try again.");
    else router.refresh();
    setLoading("");
    return response.ok;
  }

  async function submitComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await post("comment", { body: comment }, "comment")) setComment("");
  }

  async function submitChanges(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await post("request-changes", { body: changeRequest }, "changes"))
      setChangeRequest("");
  }

  async function approve() {
    if (await post("approve", {}, "approve")) setApprovalOpen(false);
  }

  return (
    <main className="min-h-screen bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <p className="font-semibold">ProofFlow</p>
          <span className="text-xs text-muted-foreground">
            Secure client review
          </span>
        </div>
      </header>
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
        <div>
          <p className="text-sm text-muted-foreground">{data.project.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {data.deliverable.name}
            </h1>
            <StatusBadge
              status={data.approval ? "APPROVED" : data.deliverable.status}
            />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Version {data.version.version_number} · Prepared for{" "}
            {data.client.name}
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">File preview</CardTitle>
          </CardHeader>
          <CardContent>
            <FilePreview
              url={data.signedFileUrl}
              mimeType={
                data.version.file?.mime_type || "application/octet-stream"
              }
              filename={
                data.version.file?.original_filename || "Deliverable file"
              }
            />
            {data.version.description ? (
              <div className="mt-4 rounded-md bg-muted/50 p-3 text-sm">
                <span className="font-medium">Version note: </span>
                {data.version.description}
              </div>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.comments.length ? (
                data.comments.map((item) => (
                  <CommentItem key={item.id} comment={item} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No comments yet.
                </p>
              )}
            </div>
            {data.canAct ? (
              <form
                onSubmit={submitComment}
                className="mt-5 space-y-2 border-t pt-5"
              >
                <label htmlFor="review-comment" className="text-sm font-medium">
                  Add a comment
                </label>
                <Textarea
                  id="review-comment"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Share feedback about this version"
                  disabled={Boolean(loading)}
                  required
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={Boolean(loading) || !comment.trim()}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {loading === "comment" ? "Posting..." : "Post comment"}
                </Button>
              </form>
            ) : null}
          </CardContent>
        </Card>
        {data.canAct ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ready to decide?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Review the exact file above, then request changes or approve
                this version.
              </p>
              {error ? (
                <p
                  role="alert"
                  className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
                >
                  {error}
                </p>
              ) : null}
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1"
                      disabled={Boolean(loading)}
                    >
                      <TriangleAlert className="mr-2 h-4 w-4" />
                      Request changes
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>What needs to change?</DialogTitle>
                      <DialogDescription>
                        Give the agency a useful note so they can prepare the
                        next version.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitChanges} className="space-y-4">
                      <Textarea
                        aria-label="Change request"
                        value={changeRequest}
                        onChange={(event) =>
                          setChangeRequest(event.target.value)
                        }
                        placeholder="Describe the changes you need"
                        required
                        minLength={10}
                      />
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setChangeRequest("")}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={
                            Boolean(loading) || changeRequest.trim().length < 10
                          }
                        >
                          <Send className="mr-2 h-4 w-4" />
                          {loading === "changes"
                            ? "Sending..."
                            : "Submit changes"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                <Dialog open={approvalOpen} onOpenChange={setApprovalOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex-1" disabled={Boolean(loading)}>
                      <Check className="mr-2 h-4 w-4" />
                      Approve version {data.version.version_number}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        Approve {data.deliverable.name} v
                        {data.version.version_number}?
                      </DialogTitle>
                      <DialogDescription>
                        By approving, you confirm that this specific version has
                        been reviewed and approved.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="rounded-md border bg-muted/40 p-4 text-sm">
                      <p>
                        <span className="text-muted-foreground">
                          Approved by:{" "}
                        </span>
                        {data.client.name}
                      </p>
                      <p className="mt-1">
                        <span className="text-muted-foreground">Email: </span>
                        {data.client.email}
                      </p>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setApprovalOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={approve} disabled={Boolean(loading)}>
                        <LockKeyhole className="mr-2 h-4 w-4" />
                        {loading === "approve"
                          ? "Approving..."
                          : `Approve v${data.version.version_number}`}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex gap-3 p-5">
              <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {data.approval
                    ? "This version is approved"
                    : "This review is closed"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {data.unavailableReason ||
                    "The agency will notify you when a new version is ready."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        {data.approval ? (
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-green-800">
                <Check className="h-5 w-5" />
                Approval record
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-green-900">
              <p>
                <span className="text-green-700">What: </span>
                {data.deliverable.name} v{data.version.version_number}
              </p>
              <p>
                <span className="text-green-700">Who: </span>
                {data.approval.client_name} ({data.approval.client_email})
              </p>
              <p>
                <span className="text-green-700">When: </span>
                {formatDateTime(data.approval.approved_at)}
              </p>
              <p>
                <span className="text-green-700">Approval ID: </span>
                <span className="font-mono">
                  {data.approval.approval_number}
                </span>
              </p>
              <p>
                <span className="text-green-700">Status: </span>APPROVED
              </p>
              <p className="pt-2 text-xs text-green-800">
                This exact version is locked and cannot be changed.
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  );
}

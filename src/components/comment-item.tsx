import { formatDateSlug, formatDateTime } from "@/lib/utils";
import type { PublicComment } from "@/lib/data";
import { cn } from "@/lib/utils";

/**
 * A comment in a thread.
 *
 * Comments are prose, not status, so they are set in the body face at a
 * comfortable measure and get no card, no border, and no background. A change
 * request is marked by a magenta rule on the left instead, so the reader can
 * find the thing that needs work without reading every comment.
 */
export function CommentItem({
  comment,
  className,
}: {
  comment: PublicComment;
  className?: string;
}) {
  const isChangeRequest = comment.comment_type === "CHANGE_REQUEST";

  return (
    <article
      className={cn(
        "border-l-2 pl-4",
        isChangeRequest ? "border-revise" : "border-transparent",
        className,
      )}
    >
      <header className="flex flex-wrap items-baseline gap-x-2.5">
        <span className="text-sm font-medium text-ink">
          {comment.author_name}
        </span>
        <span className="rounded-control bg-wash px-2 py-0.5 text-[0.6875rem] font-medium text-ink-faint">
          {comment.author_type === "CLIENT" ? "Client" : "Agency"}
          {isChangeRequest ? " / change request" : ""}
        </span>
        <time
          dateTime={comment.created_at}
          title={formatDateTime(comment.created_at)}
          className="font-mono text-[0.6875rem] tabular-nums text-ink-faint"
        >
          {formatDateSlug(comment.created_at)}
        </time>
      </header>
      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
        {comment.body}
      </p>
    </article>
  );
}
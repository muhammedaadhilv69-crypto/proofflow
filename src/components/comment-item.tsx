import { formatDateTime } from "@/lib/utils";
import type { PublicComment } from "@/lib/data";

export function CommentItem({ comment }: { comment: PublicComment }) {
  return (
    <article className="rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{comment.author_name}</p>
          <p className="text-xs text-muted-foreground">
            {comment.author_type === "CLIENT" ? "Client" : "Agency"}
            {comment.comment_type === "CHANGE_REQUEST"
              ? " · Change request"
              : ""}
          </p>
        </div>
        <time className="text-xs text-muted-foreground">
          {formatDateTime(comment.created_at)}
        </time>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
        {comment.body}
      </p>
    </article>
  );
}

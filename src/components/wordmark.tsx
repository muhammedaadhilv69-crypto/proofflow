import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The mark is a registration target: an outer square and an inner one offset
 * from it. It is the same symbol used on the approval seal and the empty state,
 * so the identity carries the product's one idea rather than borrowing a
 * generic glyph.
 *
 * It is filled violet rather than outlined in ink, because on the grey canvas an
 * outline at 18px is the first thing to disappear, and the mark is the one piece
 * of the identity that has to survive on every page. That fill carries a white
 * registration square, so it uses the violet-as-a-ground token rather than the
 * violet-as-ink one — see `--color-signal-deep`.
 */
export function ProofFlowMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-grid size-7 shrink-0 place-items-center rounded-[0.5rem] bg-signal-deep text-white",
        className,
      )}
    >
      <span className="size-[0.4375rem] rounded-[0.125rem] bg-current" />
    </span>
  );
}

export function Wordmark({
  href = "/",
  className,
  showName = true,
}: {
  href?: string;
  className?: string;
  showName?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-control text-ink",
        className,
      )}
    >
      <ProofFlowMark />
      {showName ? (
        <span className="text-[1.0625rem] font-semibold tracking-[-0.03em]">
          ProofFlow
        </span>
      ) : (
        <span className="sr-only">ProofFlow</span>
      )}
    </Link>
  );
}
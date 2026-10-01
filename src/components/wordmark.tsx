import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The mark is a registration target: an outer square and an inner one offset
 * from it. It is the same symbol used on the approval seal and the empty state,
 * so the identity carries the product's one idea rather than borrowing a
 * generic glyph.
 */
export function ProofFlowMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-grid size-[1.125rem] shrink-0 place-items-center border border-current",
        className,
      )}
    >
      <span className="size-[0.3125rem] bg-current" />
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
        "group inline-flex items-center gap-2 rounded-control text-ink",
        className,
      )}
    >
      <ProofFlowMark />
      {showName ? (
        <span className="text-[0.9375rem] font-semibold tracking-[-0.015em]">
          ProofFlow
        </span>
      ) : (
        <span className="sr-only">ProofFlow</span>
      )}
    </Link>
  );
}
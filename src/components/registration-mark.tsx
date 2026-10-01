import { cn } from "@/lib/utils";

/**
 * Registration marks.
 *
 * Press registration marks sit at the corners of a sheet so a misfed page can be
 * caught before it prints. ProofFlow puts them on the approval seal and on the
 * states that are fixed for good, where the same argument applies: these
 * artifacts are the ones you must be able to align, verify, and trust later.
 *
 * Drawn as a border rather than an SVG so it scales and stays crisp on any
 * device pixel ratio, and so it cannot be mistaken for an icon.
 */
export function RegistrationCorners({
  className,
  inset = 0,
}: {
  className?: string;
  inset?: number;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("pointer-events-none absolute", className)}
      style={{ inset }}
    >
      <Corner className="left-0 top-0 border-l border-t" />
      <Corner className="right-0 top-0 border-r border-t" />
      <Corner className="bottom-0 left-0 border-b border-l" />
      <Corner className="bottom-0 right-0 border-b border-r" />
    </span>
  );
}

function Corner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "absolute size-2 border-current opacity-45",
        className,
      )}
    />
  );
}
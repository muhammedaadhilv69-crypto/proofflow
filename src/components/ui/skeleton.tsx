import { cn } from "@/lib/utils";

/**
 * Skeletons mirror the shape of the content they stand in for, so the page
 * does not reflow when data lands. `text` produces a line that ends short,
 * which is what a paragraph of unknown length actually looks like.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("skeleton rounded-field", className)}
      {...props}
    />
  );
}

/** A page header waiting for its title and slug line. */
export function SkeletonHeader() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="h-9 w-72 rounded-sheet" />
      <Skeleton className="h-3 w-56" />
    </div>
  );
}

/** A row in a list that has not arrived yet. */
export function SkeletonRow() {
  return (
    <div
      className="flex items-center gap-4 px-6 py-4.5"
      aria-hidden="true"
    >
      <Skeleton className="size-8 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3.5 w-2/5" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
    </div>
  );
}

/**
 * Announces a pending region once, without claiming a shape it does not have.
 */
export function LoadingRegion({ label }: { label: string }) {
  return (
    <span role="status" aria-live="polite" className="sr-only">
      {label}
    </span>
  );
}
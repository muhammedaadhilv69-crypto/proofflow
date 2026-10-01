import { CircleAlert, Compass } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RegistrationCorners } from "@/components/registration-mark";

/**
 * Failure and emptiness states.
 *
 * An error message has two jobs and this component enforces both: say what
 * happened, and say what to do about it. It never apologises, never blames the
 * reader, and never stops at "Something went wrong" — which tells the reader
 * nothing and is the single most common way a generated interface gives up.
 */
export function ErrorBlock({
  title = "That did not load",
  children,
  action,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  action?: { label: string; onClick?: () => void; href?: string };
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "relative overflow-hidden rounded-sheet border border-destructive/30 bg-fault-wash px-5 py-4",
        className,
      )}
    >
      <div className="flex gap-3">
        <CircleAlert
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-destructive"
        />
        <div className="min-w-0 flex-1 space-y-2">
          <h2 className="text-sm font-medium text-ink">{title}</h2>
          <div className="text-sm leading-relaxed text-ink-soft">{children}</div>
          {action ? (
            <div className="pt-1">
              {action.href ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={action.href}>{action.label}</Link>
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={action.onClick}>
                  {action.label}
                </Button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * The not-found state. It is deliberately given the same shape as
 * `ErrorBlock` but in neutral ink: a wrong URL is not an error in the product,
 * it is a page that does not exist.
 */
export function NotFoundBlock({
  title = "That page does not exist",
  children = "The link may be out of date, or the item may have been deleted.",
  className,
}: {
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-sheet border border-rule bg-sheet px-6 py-10 sm:px-10",
        className,
      )}
    >
      <RegistrationCorners className="text-ink" inset={12} />
      <div className="max-w-md">
        <Compass aria-hidden="true" className="size-5 text-ink-faint" />
        <h1 className="mt-3 text-lg font-semibold tracking-[-0.015em] text-ink">
          {title}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{children}</p>
        <div className="mt-5">
          <Button asChild size="sm">
            <Link href="/dashboard">Go to the dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
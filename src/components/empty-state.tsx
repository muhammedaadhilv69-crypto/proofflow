import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RegistrationCorners } from "@/components/registration-mark";

/**
 * An empty screen is an invitation to act, not a mood.
 *
 * So it says what this collection is for, what the next step is, and offers
 * exactly one action. No illustration, no reassurance, and never two competing
 * CTAs — the choice of what to create belongs to the product, not the reader.
 */
export function EmptyState({
  title,
  description,
  nextStep,
  action,
  secondaryAction,
  className,
}: {
  title: string;
  description: string;
  /** The concrete step that follows. Read as an instruction, not a slogan. */
  nextStep?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-sheet border border-dashed border-rule-strong bg-wash p-8 sm:p-12",
        className,
      )}
    >
      <RegistrationCorners className="text-ink-faint" inset={12} />
      <div className="max-w-md">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          {description}
        </p>
        {nextStep ? (
          <p className="slug mt-4 inline-flex items-center gap-2 rounded-control bg-sheet px-3 py-1.5">
            <span className="slug-key">next</span> {nextStep}
          </p>
        ) : null}
        {action ? (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {action.href ? (
              <Button asChild>
                <Link href={action.href}>{action.label}</Link>
              </Button>
            ) : (
              <Button onClick={action.onClick}>{action.label}</Button>
            )}
            {secondaryAction ? (
              <Button asChild variant="ghost">
                <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * The empty state for a list that exists but has nothing in it yet, sitting
 * inside a plate. Smaller, because the plate already supplies the frame.
 */
export function EmptyNote({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "rounded-field bg-wash px-4 py-3 text-sm leading-relaxed text-ink-soft",
        className,
      )}
    >
      {children}
    </p>
  );
}
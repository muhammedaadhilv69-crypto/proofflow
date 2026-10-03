"use client";

import * as React from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

/**
 * Label, control, hint, error — wired together.
 *
 * Every form in the product routes through this so that an error is announced
 * (role="alert"), associated with its control via aria-describedby, and
 * communicated by an icon and a sentence as well as by red. The "state" string
 * is generated rather than written by hand, because hand-written validation
 * messages drift into vagueness ("Invalid input") the moment someone is in a
 * hurry.
 */
export function Field({
  label,
  hint,
  error,
  required,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  /** Receives the ids the control must be given: `id`, `describedBy`, `invalid`. */
  children: (ids: {
    id: string;
    describedBy?: string;
    invalid: boolean;
  }) => React.ReactNode;
}) {
  const reactId = React.useId();
  const id = `f-${reactId}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>
        {label}
        {required ? (
          <span className="ml-1 text-fault" aria-hidden="true">
            *
          </span>
        ) : null}
      </Label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && !error ? (
        <p id={hintId} className="text-xs leading-relaxed text-ink-faint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="flex items-start gap-1.5 text-xs leading-relaxed text-destructive"
        >
          <CircleAlert aria-hidden="true" className="mt-px size-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

/** The message shown under a whole form when submission fails for a shared reason. */
export function FormError({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2.5 rounded-field bg-fault-wash px-4 py-3 text-sm leading-relaxed text-destructive"
    >
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
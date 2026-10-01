import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

/**
 * Fields sit on white with a full-strength border. The border does the work of
 * separating the field from its plate, so the field never needs a tinted ground
 * of its own — which means a form looks identical on a plate and on paper.
 */
const inputBase =
  "flex h-9 w-full rounded-control border border-rule-strong bg-sheet px-2.5 text-sm text-ink transition-colors placeholder:text-ink-faint hover:border-ink-faint focus-visible:border-signal disabled:cursor-not-allowed disabled:bg-wash disabled:text-ink-faint file:mr-3 file:rounded-control file:border-0 file:bg-wash file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-ink-soft";

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, type, ...props }, ref) => (
    <input
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(
        inputBase,
        invalid && "border-destructive focus-visible:border-destructive",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input, inputBase };
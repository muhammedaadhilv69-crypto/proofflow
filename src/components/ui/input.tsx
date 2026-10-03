import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

/**
 * Fields sit on white with a soft, generous radius.
 *
 * They are deliberately not pills. A pill reads as a control you pick from a
 * set; a field is somewhere you put something you already know. Keeping the two
 * shapes distinct is what stops a form looking like a row of buttons.
 *
 * The border does the work of separating the field from its plate, so the field
 * never needs a tinted ground of its own — which means a form looks identical on
 * a plate and on paper.
 */
const inputBase =
  "flex h-11 w-full rounded-field border border-rule-strong bg-sheet px-4 text-sm text-ink transition-colors placeholder:text-ink-faint hover:border-ink-faint focus-visible:border-signal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-signal/12 disabled:cursor-not-allowed disabled:bg-wash disabled:text-ink-faint file:mr-3 file:rounded-control file:border-0 file:bg-wash file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-ink-soft";

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, type, ...props }, ref) => (
    <input
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(
        inputBase,
        invalid &&
          "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/12",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input, inputBase };

import * as React from "react";
import { cn } from "@/lib/utils";
import { inputBase } from "@/components/ui/input";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, rows = 4, ...props }, ref) => (
    <textarea
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(
        inputBase,
        "h-auto min-h-24 resize-y px-4 py-3 leading-relaxed",
        invalid &&
          "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/12",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export { Textarea };
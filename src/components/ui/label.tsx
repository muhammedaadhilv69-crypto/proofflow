import * as React from "react";
import { cn } from "@/lib/utils";

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "label-narrow text-xs font-medium text-ink-soft peer-disabled:opacity-60",
        className,
      )}
      {...props}
    />
  ),
);
Label.displayName = "Label";

export { Label };
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Buttons are operated, so they use --radius-control and sit one step denser
 * than a marketing size would suggest. The press state is a 1px descent rather
 * than a scale: it reads as a physical key going down, and it costs nothing on
 * large blocks of text.
 *
 * `default` is ink, because the primary action in this product is usually
 * "Approve this version", and an approval is a stamp. Nothing that is merely
 * available-for-action should outrank it.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-100 active:translate-y-px disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-ink text-sheet hover:bg-ink-soft active:bg-ink-soft",
        outline:
          "border border-rule-strong bg-sheet text-ink hover:border-ink-faint hover:bg-wash",
        secondary: "bg-wash text-ink-soft hover:bg-rule hover:text-ink",
        ghost: "text-ink-soft hover:bg-wash hover:text-ink",
        quiet: "text-ink-faint hover:bg-wash hover:text-ink",
        danger:
          "border border-destructive/35 bg-destructive/8 text-destructive hover:border-destructive/60 hover:bg-destructive/14",
        link: "text-signal underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-2.5 text-[0.8125rem] [&_svg]:size-3.5",
        default: "h-9 px-3.5 text-sm [&_svg]:size-4",
        lg: "h-11 px-5 text-[0.9375rem] [&_svg]:size-4",
        icon: "size-9 [&_svg]:size-4",
        "icon-sm": "size-8 [&_svg]:size-4",
      },
      block: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, block, asChild = false, type, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        // A button inside a form defaults to submit, which turns any stray
        // click into an unintended record. Callers opt in explicitly.
        type={asChild ? undefined : (type ?? "button")}
        className={cn(buttonVariants({ variant, size, block }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
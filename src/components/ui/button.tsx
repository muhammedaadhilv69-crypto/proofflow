import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Buttons are pills.
 *
 * That is the single most load-bearing shape in this system's visual language —
 * the reference it was drawn from builds its whole hierarchy out of pills: the
 * nav, the segmented control, the tag chips, both calls to action. Carrying that
 * through to every button here is what makes the product feel like one thing
 * rather than a marketing page with an app bolted underneath.
 *
 * A pill needs more horizontal padding than a rounded rectangle to look
 * deliberate, so the sizes below are looser than the heights suggest. The press
 * state stays a 1px descent rather than a scale: on a pill, a scale reads as a
 * wobble.
 *
 * `default` is violet because violet is the only interactive colour in the
 * product. The old system made the primary action ink on the argument that an
 * approval is a stamp; that argument still holds, and it now lives in the
 * approval seal, which is the one object that should be the heaviest thing on
 * any page it appears on.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control font-medium transition-[background-color,border-color,color,box-shadow,transform,filter] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-signal-deep text-white shadow-[0_6px_16px_-6px_hsl(258_84%_58%/0.55)] hover:bg-signal-deep/90",
        ink: "bg-ink text-sheet hover:bg-ink-soft",
        outline:
          "border border-rule-strong bg-sheet text-ink hover:border-ink-faint hover:bg-wash",
        secondary: "bg-wash text-ink-soft hover:bg-rule/60 hover:text-ink",
        ghost: "text-ink-soft hover:bg-wash hover:text-ink",
        quiet: "text-ink-faint hover:bg-wash hover:text-ink",
        danger:
          "border border-destructive/30 bg-destructive/8 text-destructive hover:border-destructive/55 hover:bg-destructive/14",
        link: "text-signal underline underline-offset-4 decoration-signal/40 hover:decoration-signal",
      },
      size: {
        sm: "h-8 px-3.5 text-[0.8125rem] [&_svg]:size-3.5",
        default: "h-10 px-5 text-sm [&_svg]:size-4",
        lg: "h-12 px-6 text-[0.9375rem] [&_svg]:size-[1.125rem]",
        icon: "size-10 [&_svg]:size-4",
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

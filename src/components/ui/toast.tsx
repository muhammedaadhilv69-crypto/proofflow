"use client";

import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, CircleAlert, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed inset-x-0 bottom-0 z-100 flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:inset-x-auto sm:right-0 sm:max-w-sm",
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

/**
 * A toast carries a 3px rule on its leading edge, not a coloured background,
 * and names its state with an icon as well as a colour.
 *
 * Success is violet rather than green. The old system spent green exactly once,
 * on the approval seal, on the argument that green means "a record exists" and
 * never "something you just did". That argument survives the redesign intact —
 * approval still owns the deepest ink in the product — so green stays out of the
 * toast, and success takes the brand colour instead.
 */
const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-sheet border border-rule/70 bg-sheet py-4 pl-5 pr-4 shadow-lift transition-[transform,opacity] data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none",
  {
    variants: {
      variant: {
        default: "border-l-[3px] border-l-ink [&_svg]:text-ink",
        success: "border-l-[3px] border-l-signal [&_svg]:text-signal",
        destructive:
          "border-l-[3px] border-l-destructive [&_svg]:text-destructive",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

const TOAST_ICONS = {
  default: Info,
  success: Check,
  destructive: CircleAlert,
} as const;

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  const Icon = TOAST_ICONS[variant ?? "default"];
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      {props.children}
    </ToastPrimitives.Root>
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "ml-auto inline-flex h-8 shrink-0 items-center rounded-control border border-rule-strong px-3.5 text-xs font-medium text-ink-soft transition-colors hover:bg-wash hover:text-ink",
      className,
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-1.5 top-1.5 rounded-control p-1 text-ink-faint opacity-0 transition-opacity hover:bg-wash hover:text-ink focus-visible:opacity-100 group-hover:opacity-100",
      className,
    )}
    toast-close=""
    {...props}
  >
    <X aria-hidden="true" className="size-3.5" />
    <span className="sr-only">Dismiss</span>
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-medium leading-snug text-ink", className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("mt-0.5 text-xs leading-relaxed text-ink-soft", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;
type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
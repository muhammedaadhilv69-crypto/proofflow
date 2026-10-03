import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * One surface for the whole product.
 *
 * A plate is a sheet of paper lying on the light table: white, generously
 * rounded, sitting slightly proud of the grey. That is the whole metaphor and it
 * is why `rounded-sheet` is as large as it is — at 24px an edge reads as a
 * physical object with a soft corner rather than as a box someone drew.
 *
 * The old kit was identical rounded rectangles at one small radius with one soft
 * grey shadow, which made a version history, a settings form, and a marketing
 * tile read as the same object. A plate is a different object: it holds
 * something a person reads closely, and it only casts a shadow when it is
 * genuinely raised off the desk.
 *
 * `flat` drops the shadow for use directly on another plate. `raised` is
 * reserved for the proof preview, which stands for a sheet on a light table.
 */
export type PlateProps = React.HTMLAttributes<HTMLDivElement> & {
  flat?: boolean;
  raised?: boolean;
  /** Draws a heavier top rule, used where a plate opens a section. */
  accentTop?: boolean;
};

const Plate = React.forwardRef<HTMLDivElement, PlateProps>(
  ({ className, flat, raised, accentTop, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-sheet bg-sheet text-ink",
        !flat && "border border-rule/70",
        raised && "shadow-proof",
        !raised && !flat && "shadow-sheet",
        accentTop && "border-t-2 border-t-signal",
        className,
      )}
      {...props}
    />
  ),
);
Plate.displayName = "Plate";

/**
 * The head of a plate carries the plate's title and nothing else. No icon slot,
 * no eyebrow: a heading that needs a subtitle gets one below it, in the body.
 */
const PlateHeader = React.forwardRef<HTMLDivElement, PlateProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-between gap-4 border-b border-rule/70 px-6 py-4",
        className,
      )}
      {...props}
    />
  ),
);
PlateHeader.displayName = "PlateHeader";

const PlateTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "label-narrow text-[0.9375rem] font-semibold text-ink",
      className,
    )}
    {...props}
  />
));
PlateTitle.displayName = "PlateTitle";

const PlateBody = React.forwardRef<HTMLDivElement, PlateProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6", className)} {...props} />
  ),
);
PlateBody.displayName = "PlateBody";

const PlateFooter = React.forwardRef<HTMLDivElement, PlateProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-3 border-t border-rule/70 px-6 py-4",
        className,
      )}
      {...props}
    />
  ),
);
PlateFooter.displayName = "PlateFooter";

export { Plate, PlateHeader, PlateTitle, PlateBody, PlateFooter };

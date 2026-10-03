"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

/**
 * The switch.
 *
 * A switch is a physical control before it is a semantic one: something you put
 * a thumb on and push across. So the two halves are coloured like physical
 * halves rather than like UI — `--rule-strong` for the track it sits in, and the
 * thumb on `--stock`, the system's one paper-white surface.
 *
 * That last choice is what makes this the second consumer of `--stock`. A thumb
 * on `--sheet` would be near-white in daylight and near-black after hours, which
 * would turn the control off in the dark room — the one place it most needs to
 * stay legible. A switch that disappears when the lights go out is not a subtle
 * control, it is a bug.
 *
 * Off is `--rule-strong` rather than `--rule` because a track has to read as a
 * track: it needs to be visible against the `--sheet` it sits on before the
 * thumb is even part of the picture.
 */
const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      // h-5 w-9 with a 2px transparent border leaves a 32px inner track, so a
      // 16px thumb lands flush against the end at translate-x-4 with nothing to
      // hand-tune. The border is transparent rather than `border-0` because
      // removing it would change the box model and the thumb would jump 2px.
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-control border-2 border-transparent transition-colors duration-150",
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal",
      "disabled:cursor-not-allowed disabled:opacity-45",
      "data-[state=checked]:bg-signal-deep",
      "data-[state=unchecked]:bg-rule-strong",
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "pointer-events-none block size-4 rounded-full bg-stock shadow-sheet",
        "transition-transform duration-150",
        "data-[state=checked]:translate-x-4",
        "data-[state=unchecked]:translate-x-0",
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;

export { Switch };
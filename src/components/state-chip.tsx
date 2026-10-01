import { cn } from "@/lib/utils";
import {
  stateLabel,
  stateMeta,
  type Audience,
  type StateKey,
} from "@/lib/status";

/**
 * The state indicator.
 *
 * Three things make it readable without relying on hue: the state is always
 * spelled out, and each weight carries a distinct shape — a hollow ring for
 * something inert, a dot for something live, a filled block for something final
 * and permanent. Colour is the third signal, not the only one.
 *
 * Approved renders as a filled block in ink. It is deliberately the darkest,
 * squarest thing on the page: heavier than every live state it sits beside, so
 * scanning a version list finds the approved proof first.
 */
export function StateChip({
  state,
  audience = "agency",
  size = "default",
  className,
}: {
  state: StateKey;
  audience?: Audience;
  size?: "default" | "large";
  className?: string;
}) {
  const meta = stateMeta(state);

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-mark font-medium",
        size === "large" ? "px-2 py-1 text-sm" : "px-1.5 py-0.5 text-xs",
        meta.wash,
        meta.text,
        className,
      )}
    >
      <StateMark state={state} />
      {stateLabel(state, audience)}
    </span>
  );
}

export function StateMark({ state, className }: { state: StateKey; className?: string }) {
  const meta = stateMeta(state);
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block size-[0.5em] shrink-0",
        meta.weight === "quiet" && "rounded-full border-[1.5px] border-current",
        meta.weight === "live" && "rounded-full bg-current",
        meta.weight === "final" && "rounded-[1px] bg-current",
        className,
      )}
    />
  );
}
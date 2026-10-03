"use client";

import { useId, useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import {
  DropdownMenuCheckboxItem,
  type DropdownMenuCheckboxItemProps,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";

/**
 * Appearance.
 *
 * Appearance is a three-way choice, not a two-way one, and the third option is
 * the reason the canonical control is a segmented group of native radios rather
 * than a switch. A switch has to guess what "on" means when the truth is
 * "whatever this machine says", and a person who wants their app to track their OS
 * at breakfast and override it at night has no way to ask for that with an
 * on/off control. So: three pills, one radio group, and `System` as a
 * first-class answer.
 *
 * Radios rather than buttons with `aria-pressed`, because a native radio group
 * already moves between options with the arrow keys and already announces
 * "2 of 3". Re-implementing that on three divs is how a segmented control ends up
 * needing its own keyboard handler.
 */
const OPTIONS = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
] as const;

const isServer = () => false;

/**
 * Whether the dark room is the one currently painted.
 *
 * This reads the class off `<html>` rather than asking next-themes, and that is
 * deliberate. `useTheme().resolvedTheme` is `undefined` during server rendering
 * *and* during the hydration render, so an icon bound to it paints the wrong
 * glyph on a dark page and corrects itself a render later — the theme class is
 * already on `<html>` from the blocking script, so the room is right and only the
 * icon is wrong, which is exactly the kind of first-paint error that gets
 * screenshotted as a bug.
 *
 * The DOM is also the only source that is true for all three states at once.
 * With `theme === "system"` there is no `resolvedTheme` to read on the server,
 * because "what does this person's OS say" is not knowable until it is asked.
 *
 * Observing the class rather than polling also means a theme change made in
 * another tab, or by the switch in the account menu, updates every icon on
 * screen without a shared context.
 */
function subscribeToTheme(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function getIsDark() {
  return document.documentElement.classList.contains("dark");
}

/**
 * Hooked at module scope so the identity is stable. An inline arrow here is a new
 * function on every render, and `useSyncExternalStore` unsubscribes and
 * resubscribes whenever `subscribe` changes — which would put a MutationObserver
 * on the document on every render of every control that uses this.
 */
const noopSubscribe = () => () => {};
const clientHydrated = () => true;

function useIsDark() {
  return useSyncExternalStore(subscribeToTheme, getIsDark, isServer);
}

/**
 * The three-way control in Settings.
 *
 * This is the only control that needs `theme` rather than "is it dark", because
 * `System` is a distinct answer that no boolean can represent. It keeps the
 * hydration gate: `theme` is `undefined` on the server, so binding `checked`
 * straight to it renders three unchecked radios in the server HTML and one
 * checked radio on the client.
 */
function useSelectedTheme() {
  const { theme, setTheme } = useTheme();
  const hydrated = useSyncExternalStore(noopSubscribe, clientHydrated, isServer);

  return { selected: hydrated ? theme : undefined, setTheme };
}

export function ThemePicker({ className }: { className?: string }) {
  const { selected, setTheme } = useSelectedTheme();
  // The label/input pairing needs ids, and ids have to be unique per page. There
  // is one of these today; `useId` is what keeps that true if there is ever a
  // second — a mobile sheet, say — rather than a silent duplicate-id bug.
  const groupId = useId();

  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className="slug-key mb-2">theme</legend>
      {/*
        `p-1.5` and `gap-1`, matching the one segmented track the system already
        had — the marketing nav. The pills inside are a segmented control either
        way; they should not measure differently from the other one.
      */}
      <div className="flex w-fit items-center gap-1 rounded-control bg-wash p-1.5">
        {OPTIONS.map(({ value, label, Icon }) => (
          <div key={value} className="relative">
            <input
              type="radio"
              name={`pf-theme${groupId}`}
              id={`pf-theme${groupId}-${value}`}
              value={value}
              checked={selected === value}
              onChange={() => setTheme(value)}
              className="peer sr-only"
            />
            <label
              htmlFor={`pf-theme${groupId}-${value}`}
              className={cn(
                "label-narrow flex cursor-pointer select-none items-center gap-2 rounded-control px-4 py-2 text-sm text-ink-soft transition-colors hover:text-ink",
                "peer-checked:bg-signal-deep peer-checked:text-white peer-checked:hover:text-white",
                // The radio itself is the focusable thing and it is visually
                // hidden, so the ring has to be re-drawn on the label or focus
                // lands on something nobody can see.
                "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-signal",
              )}
            >
              <Icon aria-hidden="true" className="size-4" />
              {label}
            </label>
          </div>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * The switch row in the account menu.
 *
 * The switch is `aria-hidden` and un-focusable on purpose, and that is the whole
 * trick. A Radix menu owns its arrow keys and roving focus, so a focusable
 * `<button role="switch">` inside menu content would compete with the menu for
 * every key press. So the semantics live on the menu item, which Radix already
 * renders as `role="menuitemcheckbox"` with `aria-checked` — the same thing a
 * switch announces — and the switch is drawn inside it as a mirror of that state.
 * One focusable element, one keyboard model, and the state is still announced.
 *
 * `System` is absent for the same reason it is absent from any two-state control:
 * this row answers "dark, yes or no", and the three-way answer lives in Settings.
 */
/** `checked` is owned by the DOM class, so it is not a caller-supplied prop. */
type ThemeSwitchItemProps = Omit<DropdownMenuCheckboxItemProps, "checked">;

export function ThemeSwitchItem(props: ThemeSwitchItemProps) {
  const { setTheme } = useTheme();
  const isDark = useIsDark();

  return (
    <DropdownMenuCheckboxItem
      {...props}
      hideIndicator
      checked={isDark}
      onCheckedChange={() => setTheme(isDark ? "light" : "dark")}
    >
      Dark theme
      <Switch
        checked={isDark}
        aria-hidden
        tabIndex={-1}
        className="pointer-events-none"
      />
    </DropdownMenuCheckboxItem>
  );
}

/**
 * The icon button for the mobile header.
 *
 * Present because the account menu is `hidden lg:flex` — on a phone there is no
 * menu to open, so this is the only quick way to flip the room. It states the
 * current theme rather than the target one, which is why it is labelled by
 * action: "Switch to light theme" while the moon is showing. Labelling it
 * "Dark theme" and toggling would leave a screen-reader user with no idea which
 * way it will move.
 */
export function ThemeToggleButton({ className }: { className?: string }) {
  const { setTheme } = useTheme();
  const isDark = useIsDark();

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(
        // Same shape as the hamburger beside it, so the two read as one control
        // cluster rather than as a button and a decoration.
        "grid size-8 shrink-0 place-items-center rounded-control text-ink-soft transition-colors hover:bg-wash hover:text-ink",
        className,
      )}
    >
      {isDark ? (
        <Moon aria-hidden="true" className="size-4" />
      ) : (
        <Sun aria-hidden="true" className="size-4" />
      )}
    </button>
  );
}
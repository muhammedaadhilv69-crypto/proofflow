"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/wordmark";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeSwitchItem, ThemeToggleButton } from "@/components/theme-toggle";

export type NavItem = { href: string; label: string };

/**
 * The navigation rail.
 *
 * Navigation is text-only. Five items do not need icons, and stripping them
 * removes the single biggest cue that a sidebar is a template — an icon per row
 * reads as a framework default, where a word reads as a decision.
 *
 * Each item is a pill, because that is the shape this system uses for anything
 * you can choose. The active item is filled violet rather than marked with a bar
 * in the leading edge: on a pill, an edge rule reads as an artefact of the
 * container rather than as a state.
 */
function NavLinks({
  items,
  onNavigate,
}: {
  items: NavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="space-y-1">
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            className={cn(
              "flex items-center rounded-control px-4 py-2 text-sm transition-colors",
              active
                ? "bg-signal-deep font-medium text-white shadow-[0_4px_12px_-4px_hsl(258_84%_58%/0.5)]"
                : "text-ink-soft hover:bg-wash hover:text-ink",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function AccountMenu({
  displayName,
  email,
  workspaceName,
  settingsHref,
  children,
}: {
  displayName: string;
  email: string | null;
  workspaceName: string;
  settingsHref: string;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-control px-3 py-2 text-left transition-colors hover:bg-wash"
        >
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-signal-wash text-xs font-semibold text-signal"
          >
            {children}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-ink">
              {displayName}
            </span>
            <span className="block truncate text-xs text-ink-faint">
              {workspaceName}
            </span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-60">
        <DropdownMenuLabel className="text-sm">
          {displayName}
          {email ? ` / ${email}` : ""}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ThemeSwitchItem />
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={settingsHref}>Workspace settings</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Sign-out lives outside the account menu on purpose: it ends the session and
 * can never be triggered by a mis-click on a neighbouring row.
 */
type ServerAction = (formData: FormData) => void | Promise<void>;

function SignOut({ action }: { action: ServerAction }) {
  return (
    <form action={action} className="w-full">
      <button
        type="submit"
        className="flex w-full items-center gap-2.5 rounded-control px-3 py-2 text-left text-sm text-ink-faint transition-colors hover:bg-wash hover:text-ink"
      >
        <LogOut aria-hidden="true" className="size-4" />
        Sign out
      </button>
    </form>
  );
}

export function AppShell({
  items,
  displayName,
  email,
  workspaceName,
  dashboardHref,
  settingsHref,
  logoutAction,
  initials,
  children,
}: {
  items: NavItem[];
  displayName: string;
  email: string | null;
  workspaceName: string;
  dashboardHref: string;
  settingsHref: string;
  logoutAction: ServerAction;
  initials: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/*
        The rail is a white card floating on the grey desk, inset from the edge
        on every side. That is the same trick the marketing sheet uses, at a
        smaller scale, and it is what stops the app feeling like a different
        product from the site that advertises it.
      */}
      <aside className="sticky top-0 hidden h-[calc(100vh-2rem)] lg:my-4 lg:ml-4 lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:overflow-y-auto lg:rounded-sheet lg:border lg:border-rule/70 lg:bg-sheet lg:shadow-sheet">
        <div className="px-6 pb-5 pt-6">
          <Wordmark href={dashboardHref} />
          <p className="slug mt-2 truncate" title={workspaceName}>
            {workspaceName}
          </p>
        </div>

        <div className="flex-1 px-4">
          <NavLinks items={items} />
        </div>

        <div className="border-t border-rule/70 p-4">
          <AccountMenu
            displayName={displayName}
            email={email}
            workspaceName={workspaceName}
            settingsHref={settingsHref}
          >
            {initials}
          </AccountMenu>
          <div className="mt-1 px-1">
            <SignOut action={logoutAction} />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/*
          A `<header>`, not a `<div>`. This bar is a sibling of `<main>`, so
          while it was a plain div the wordmark and the workspace name sat
          outside every landmark — invisible to the desktop audit only because
          the bar is `lg:hidden`. The page's own PageHeader is a `<header>` too,
          but it lives inside `<main>`, so it carries no banner role and the two
          do not collide.
        */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-rule/70 bg-paper/90 px-4 py-3 backdrop-blur lg:hidden">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? (
              <X aria-hidden="true" />
            ) : (
              <Menu aria-hidden="true" />
            )}
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          </Button>
          <Wordmark href={dashboardHref} />
          <p className="slug ml-auto max-w-32 truncate">{workspaceName}</p>
          {/*
            The account menu that carries the theme switch is inside the desktop
            rail, which is `hidden lg:flex` — so without this button a phone has
            no quick way to change the room and has to go via Settings. It sits at
            the trailing edge rather than beside the wordmark because it is the
            last thing the thumb reaches for, and the hamburger keeps the leading
            edge to itself.
          */}
          <ThemeToggleButton />
        </header>

        {open ? (
          <div
            id="mobile-nav"
            className="border-b border-rule/70 bg-sheet px-4 py-4 lg:hidden"
          >
            <NavLinks items={items} onNavigate={() => setOpen(false)} />
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-rule/70 pt-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">
                  {displayName}
                </p>
                {email ? (
                  <p className="slug truncate">{email}</p>
                ) : null}
              </div>
              <SignOut action={logoutAction} />
            </div>
          </div>
        ) : null}

        <main className="mx-auto w-full max-w-[78rem] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
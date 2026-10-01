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

export type NavItem = { href: string; label: string };

/**
 * The masthead column.
 *
 * Navigation is text-only. Five items do not need icons, and stripping them
 * removes the single biggest cue that a sidebar is a template — an icon per row
 * reads as a framework default, where a word reads as a decision. Active state
 * is a 2px ink bar on the leading edge plus full-contrast ink, so position is
 * legible without a filled pill behind it.
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
    <nav aria-label="Main" className="space-y-0.5">
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
              "relative -ml-3 flex items-center rounded-control py-1.5 pl-3 pr-2 text-sm transition-colors",
              active
                ? "font-medium text-ink before:absolute before:inset-y-1 before:-left-px before:w-0.5 before:bg-ink"
                : "text-ink-faint hover:bg-wash hover:text-ink-soft",
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
          className="flex w-full items-center gap-2.5 rounded-control px-2 py-1.5 text-left transition-colors hover:bg-wash"
        >
          <span
            aria-hidden="true"
            className="grid size-7 shrink-0 place-items-center rounded-full bg-wash text-[0.625rem] font-semibold text-ink-soft"
          >
            {children}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[0.8125rem] font-medium text-ink">
              {displayName}
            </span>
            <span className="block truncate text-[0.6875rem] text-ink-faint">
              {workspaceName}
            </span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-56">
        <DropdownMenuLabel>
          {displayName}
          {email ? ` / ${email}` : ""}
        </DropdownMenuLabel>
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
        className="flex w-full items-center gap-2 rounded-control px-2 py-1.5 text-left text-sm text-ink-faint transition-colors hover:bg-wash hover:text-ink"
      >
        <LogOut aria-hidden="true" className="size-3.5" />
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
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-rule bg-sheet lg:flex">
        <div className="px-6 pb-4 pt-5">
          <Wordmark href={dashboardHref} />
          <p className="slug mt-1.5 truncate" title={workspaceName}>
            {workspaceName}
          </p>
        </div>

        <div className="flex-1 px-6">
          <NavLinks items={items} />
        </div>

        <div className="border-t border-rule p-4">
          <AccountMenu
            displayName={displayName}
            email={email}
            workspaceName={workspaceName}
            settingsHref={settingsHref}
          >
            {initials}
          </AccountMenu>
          <div className="mt-1 px-2">
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
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-rule bg-paper/95 px-4 backdrop-blur lg:hidden">
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
        </header>

        {open ? (
          <div
            id="mobile-nav"
            className="border-b border-rule bg-sheet px-4 py-3 lg:hidden"
          >
            <NavLinks items={items} onNavigate={() => setOpen(false)} />
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-rule pt-3">
              <div className="min-w-0">
                <p className="truncate text-[0.8125rem] font-medium text-ink">
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

        <main className="mx-auto w-full max-w-[74rem] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
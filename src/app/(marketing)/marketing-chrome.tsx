import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { Wordmark } from "@/components/wordmark";
import { Button } from "@/components/ui/button";

/**
 * Marketing chrome is deliberately thin: a wordmark, four links, one action.
 * The landing page's job is to show the product's record, and every extra piece
 * of navigation competes with that.
 */
export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Wordmark />
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          <Link
            href={ROUTES.features}
            className="hidden rounded-control px-2.5 py-1.5 text-sm text-ink-soft transition-colors hover:bg-wash hover:text-ink sm:block"
          >
            Features
          </Link>
          <Link
            href={ROUTES.pricing}
            className="rounded-control px-2.5 py-1.5 text-sm text-ink-soft transition-colors hover:bg-wash hover:text-ink"
          >
            Pricing
          </Link>
          <Link
            href={ROUTES.login}
            className="rounded-control px-2.5 py-1.5 text-sm text-ink-soft transition-colors hover:bg-wash hover:text-ink"
          >
            Sign in
          </Link>
          <Button asChild size="sm">
            <Link href={ROUTES.signup}>Start free</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-rule bg-sheet">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <Wordmark />
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-faint">
            Client proofing and approval for agencies, freelancers, and studios.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
          {[
            { href: ROUTES.features, label: "Features" },
            { href: ROUTES.pricing, label: "Pricing" },
            { href: ROUTES.login, label: "Sign in" },
            { href: ROUTES.signup, label: "Create a workspace" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { Wordmark } from "@/components/wordmark";
import { Button } from "@/components/ui/button";

/**
 * Marketing chrome.
 *
 * The reference this system was drawn from puts the entire site inside one large
 * white card floating on a cool grey field, with the navigation as a centred
 * pill. That single move does most of the work: the grey is a room, the white is
 * a sheet on a desk, and every page is visibly the same object seen from a
 * different height.
 *
 * It is reproduced here as a shell rather than a page treatment, so the landing
 * page, features and pricing all sit on the same sheet and the grey never shows
 * through between them.
 */
export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper px-3 py-3 sm:px-5 sm:py-5 lg:px-8 lg:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[86rem] flex-col overflow-hidden rounded-sheet bg-sheet shadow-float sm:min-h-[calc(100vh-2.5rem)] lg:min-h-[calc(100vh-4rem)]">
        <MarketingHeader />
        <main className="flex-1">{children}</main>
        <MarketingFooter />
      </div>
    </div>
  );
}

/**
 * Navigation is a centred pill.
 *
 * Centring it rather than left-aligning it under the wordmark is the reference's
 * signature, and it works because the marketing pages have no sidebar to compete
 * with. On a narrow screen the pill would push the wordmark and the two actions
 * into each other, so below `sm` the links fall back to a plain row.
 */
export function MarketingHeader() {
  return (
    <header className="border-b border-rule/60 px-5 py-5 sm:px-8 sm:py-6">
      <div className="flex items-center justify-between gap-4">
        <Wordmark />

        <nav
          aria-label="Main"
          className="hidden items-center gap-1 rounded-control bg-wash p-1.5 sm:flex"
        >
          {[
            { href: ROUTES.features, label: "Features" },
            { href: ROUTES.pricing, label: "Pricing" },
            { href: ROUTES.login, label: "Sign in" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-control px-4 py-2 text-sm text-ink-soft transition-colors hover:bg-sheet hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={ROUTES.login}
            className="hidden rounded-control px-4 py-2 text-sm text-ink-soft transition-colors hover:bg-wash hover:text-ink sm:block lg:hidden"
          >
            Sign in
          </Link>
          <Button asChild>
            <Link href={ROUTES.signup}>Start free</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-rule/60 px-5 py-10 sm:px-8 sm:py-12">
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div>
          <Wordmark />
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-faint">
            Client proofing and approval for agencies, freelancers, and studios.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-2">
          {[
            { href: ROUTES.features, label: "Features" },
            { href: ROUTES.pricing, label: "Pricing" },
            { href: ROUTES.login, label: "Sign in" },
            { href: ROUTES.signup, label: "Create a workspace" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-control px-4 py-2 text-sm text-ink-soft transition-colors hover:bg-wash hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
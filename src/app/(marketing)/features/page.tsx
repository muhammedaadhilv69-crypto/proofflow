import Link from "next/link";
import {
  FileClock,
  Link2,
  MessageSquare,
  ShieldCheck,
  Users,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { MarketingFooter, MarketingHeader } from "@/app/(marketing)/marketing-chrome";
import { Button } from "@/components/ui/button";
import { SlugLine } from "@/components/slug-line";

/**
 * Features are grouped by the four questions a buyer actually has — what does
 * the client see, what does my team see, what gets recorded, and who can do it —
 * rather than listed as an undifferentiated grid of five tiles, which is the
 * shape every SaaS features page converges on and therefore the shape that
 * communicates nothing.
 */
const GROUPS = [
  {
    id: "client",
    question: "What the client sees",
    items: [
      {
        icon: Link2,
        title: "A link, not an account",
        body: "Clients review through a single link. No invite, no password, no onboarding call to explain software they will use once.",
      },
      {
        icon: MessageSquare,
        title: "Comments on the version they saw",
        body: "Feedback posts against the exact version it refers to, so a note about round two is never read as a note about round four.",
      },
      {
        icon: FileClock,
        title: "A clear approve or request changes",
        body: "Two actions, both confirmed before they take effect, because one of them is permanent.",
      },
    ],
  },
  {
    id: "team",
    question: "What your team sees",
    items: [
      {
        icon: FileClock,
        title: "A revision rail per deliverable",
        body: "Every round on one ruled spine, newest first, with the approved round carrying the heaviest rule on the page.",
      },
      {
        icon: ShieldCheck,
        title: "The next action, named",
        body: "The dashboard says whether to send a review link, upload the next version, or wait — not just what state something is in.",
      },
    ],
  },
  {
    id: "record",
    question: "What gets recorded",
    items: [
      {
        icon: ShieldCheck,
        title: "An approval record per version",
        body: "Client name, email, version number, UTC timestamp, and an approval ID. One per version, and never reassigned.",
      },
      {
        icon: ShieldCheck,
        title: "Locked once approved",
        body: "An approved version cannot be edited, replaced, or re-reviewed. New work goes on the next version number.",
      },
    ],
  },
  {
    id: "team-access",
    question: "Who can do it",
    items: [
      {
        icon: Users,
        title: "Owners and members",
        body: "Owners manage the workspace and the team. Members run projects, deliverables, and versions.",
      },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />

      <main className="flex-1">
        <section className="border-b border-rule">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
            <h1 className="max-w-2xl text-[2.125rem] font-semibold leading-[1.08] tracking-[-0.03em] text-ink sm:text-5xl">
              Everything in ProofFlow exists to make an approval trustworthy.
            </h1>
            <SlugLine
              className="mt-5"
              items={[
                { key: "works for", value: "agencies, freelancers, studios" },
                { key: "client login", value: "not required" },
              ]}
            />
          </div>
        </section>

        {GROUPS.map((group) => (
          <section
            key={group.id}
            className="border-b border-rule"
          >
            <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
              <h2 className="label-narrow text-xs font-medium text-ink-faint">
                {group.question}
              </h2>
              <div className="mt-6 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item) => (
                  <div key={item.title}>
                    <item.icon aria-hidden="true" className="size-4 text-ink" />
                    <h3 className="mt-3 text-sm font-semibold tracking-[-0.01em] text-ink">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-soft">
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}

        <section className="bg-ink text-sheet">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-lg">
              <h2 className="text-[1.625rem] font-semibold leading-tight tracking-[-0.025em] sm:text-3xl">
                Try it on one real deliverable.
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-sheet/75">
                The free plan is enough to run a project end to end and see what
                the approval record looks like.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className="bg-sheet text-ink hover:bg-sheet/90"
              >
                <Link href={ROUTES.signup}>Create a free workspace</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-sheet/35 bg-transparent text-sheet hover:bg-sheet/10 hover:text-sheet"
              >
                <Link href={ROUTES.pricing}>See pricing</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
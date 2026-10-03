import Link from "next/link";
import {
  FileClock,
  Link2,
  MessageSquare,
  ShieldCheck,
  Users,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { MarketingShell } from "@/app/(marketing)/marketing-chrome";
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
    <MarketingShell>
      <section className="border-b border-rule/60">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-[2.25rem] font-semibold leading-[1.06] tracking-[-0.035em] text-ink sm:text-5xl lg:text-[3.5rem]">
              Everything in ProofFlow exists to make an approval trustworthy.
            </h1>
            <div className="mt-7 flex justify-center">
              <SlugLine
                items={[
                  { key: "works for", value: "agencies, freelancers, studios" },
                  { key: "client login", value: "not required" },
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      {GROUPS.map((group, index) => (
        <section
          key={group.id}
          className="border-b border-rule/60"
        >
          <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
            {/*
              The eyebrow takes a loud fill from the same cycle the landing
              steps use, which is what ties the two pages together without
              repeating a single illustration.
            */}
            <span
              className={
                "inline-flex rounded-control px-3.5 py-1.5 text-xs font-semibold " +
                (index % 2 === 0
                  ? "bg-signal-wash text-signal"
                  : "flare-amber")
              }
            >
              {group.question}
            </span>
            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item) => (
                <div key={item.title} className="rounded-sheet bg-wash p-6">
                  <span
                    aria-hidden="true"
                    className="grid size-10 place-items-center rounded-full bg-sheet text-signal shadow-sheet"
                  >
                    <item.icon className="size-4" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="gradient-brand-soft">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-16 sm:px-8 sm:py-20 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-lg">
            <h2 className="text-[2rem] font-semibold leading-tight tracking-[-0.03em] text-white sm:text-4xl">
              Try it on one real deliverable.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/85">
              The free plan is enough to run a project end to end and see what
              the approval record looks like.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-white text-[hsl(253_69%_41%)] shadow-[0_8px_20px_-8px_hsl(253_69%_30%/0.5)] hover:bg-white/90"
            >
              <Link href={ROUTES.signup}>Create a free workspace</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:border-white/70 hover:bg-white/10 hover:text-white"
            >
              <Link href={ROUTES.pricing}>See pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { MarketingFooter, MarketingHeader } from "@/app/(marketing)/marketing-chrome";
import { Button } from "@/components/ui/button";
import { SlugLine } from "@/components/slug-line";
import { ApprovalSeal } from "@/components/approval-seal";
import { RevisionRail, type RailVersion } from "@/components/revision-rail";
import { StateMark } from "@/components/state-chip";

/**
 * The hero is the product's actual artifact, not a promise about it.
 *
 * A headline-plus-subhead-plus-metric-cards hero would have to ask a visitor to
 * take the central claim on faith. Showing a real revision rail — four rounds,
 * one of them unmistakably heavier, with the approval record sitting beside it —
 * answers "which version did they approve?" before a word of body copy is read.
 * That question is the whole product, so it is the right thing to open with.
 */
const DEMO_VERSIONS: RailVersion[] = [
  {
    id: "v4",
    version_number: 4,
    state: "APPROVED",
    status: "APPROVED",
    created_at: "2026-09-30T18:02:00.000Z",
    description: "Headline contrast raised to AA, hero image swapped to the final shoot.",
    file: {
      original_filename: "homepage-hero-v4.jpg",
      mime_type: "image/jpeg",
      size_bytes: 2411520,
    },
    comments: [],
    approval: {
      approval_number: "APR-7C1E4A9B2D08F615",
      client_name: "Mira Vance",
      client_email: "mira@northwind.coffee",
      approved_at: "2026-09-30T18:02:00.000Z",
      ip_address: "203.0.113.42",
      user_agent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
    },
  },
  {
    id: "v3",
    version_number: 3,
    state: "CHANGES_REQUESTED",
    status: "IN_REVIEW",
    created_at: "2026-09-29T09:41:00.000Z",
    description: "Alternate hero image, warmer background.",
    file: {
      original_filename: "homepage-hero-v3.jpg",
      mime_type: "image/jpeg",
      size_bytes: 2294784,
    },
    comments: [
      {
        id: "c1",
        author_name: "Mira Vance",
        author_type: "CLIENT",
        comment_type: "CHANGE_REQUEST",
        created_at: "2026-09-29T15:20:00.000Z",
        body: "The headline still drops below the contrast minimum on mobile. Can we darken it and use the original hero image?",
      },
    ],
    approval: null,
  },
  {
    id: "v2",
    version_number: 2,
    state: "CHANGES_REQUESTED",
    status: "IN_REVIEW",
    created_at: "2026-09-27T11:05:00.000Z",
    description: "Second round of crops.",
    file: {
      original_filename: "homepage-hero-v2.jpg",
      mime_type: "image/jpeg",
      size_bytes: 2203392,
    },
    comments: [
      {
        id: "c2",
        author_name: "Devon Ruiz",
        author_type: "AGENCY",
        comment_type: "COMMENT",
        created_at: "2026-09-27T12:00:00.000Z",
        body: "Pulled in the wider crops you asked for.",
      },
    ],
    approval: null,
  },
  {
    id: "v1",
    version_number: 1,
    state: "SUPERSEDED",
    status: "LOCKED",
    created_at: "2026-09-25T08:30:00.000Z",
    description: "First proof for review.",
    file: {
      original_filename: "homepage-hero-v1.jpg",
      mime_type: "image/jpeg",
      size_bytes: 1984512,
    },
    comments: [],
    approval: null,
  },
];

const STEPS = [
  {
    title: "Upload a version",
    body: "PNG, JPG, WebP, PDF, or SVG. Add one line about what changed, which is the first thing the client reads.",
  },
  {
    title: "Send a review link",
    body: "One link, for one version, for one client. No account needed, and it can be revoked or expired.",
  },
  {
    title: "They comment or request changes",
    body: "Everything stays attached to that version, so a note about round 2 can never be confused with round 4.",
  },
  {
    title: "Approval becomes a record",
    body: "Name, email, version number, timestamp, and address, locked and uneditable from that moment on.",
  },
];

export default function MarketingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />

      <main className="flex-1">
        <section className="border-b border-rule">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-16 lg:py-20">
            <div className="lg:pt-4">
              <h1 className="text-[2.125rem] font-semibold leading-[1.08] tracking-[-0.03em] text-ink sm:text-5xl">
                Know which version they approved.
              </h1>
              <p className="mt-5 max-w-md text-[0.9375rem] leading-relaxed text-ink-soft">
                ProofFlow sends a client one review link for one specific
                version. When they approve it, you get a permanent record of who,
                which version, and exactly when.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href={ROUTES.signup}>Create a free workspace</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="#how-it-works">See the flow</Link>
                </Button>
              </div>
              <p className="slug mt-5 flex flex-wrap gap-x-4">
                <span>free plan</span>
                <span>no client accounts</span>
                <span>approval records included</span>
              </p>
            </div>

            <div className="min-w-0 space-y-6">
              <div className="rounded-sheet border border-rule bg-sheet p-5 shadow-sheet">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <SlugLine
                    items={[
                      { key: "project", value: "Northwind rebrand" },
                      { key: "deliverable", value: "Homepage hero images" },
                    ]}
                  />
                  <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
                    <StateMark state="APPROVED" />
                    v4 approved
                  </p>
                </div>

                <div className="mt-4 border-t border-rule pt-4">
                  <RevisionRail
                    versions={DEMO_VERSIONS}
                    currentVersionId="v4"
                  />
                </div>
              </div>

              <ApprovalSeal
                approval={DEMO_VERSIONS[0].approval!}
                deliverableName="Homepage hero images"
                versionNumber={4}
                projectName="Northwind rebrand"
              />
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-b border-rule bg-sheet">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
            <div className="max-w-xl">
              <h2 className="text-[1.625rem] font-semibold leading-tight tracking-[-0.025em] text-ink sm:text-3xl">
                Four steps, and the last one is permanent.
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">
                The whole product exists to make step four trustworthy. The first
                three are table stakes.
              </p>
            </div>

            {/*
              Numbered markers are used here because this content genuinely is a
              sequence — each step cannot happen before the one before it, and
              the reader is meant to follow the order. They would be decoration
              anywhere else in the design.
            */}
            <ol className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, index) => (
                <li key={step.title} className="border-t-2 border-ink pt-4">
                  <span className="font-mono text-xs tabular-nums text-ink-faint">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 text-sm font-semibold tracking-[-0.01em] text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-b border-rule">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16">
              <div>
                <h2 className="text-[1.625rem] font-semibold leading-tight tracking-[-0.025em] text-ink sm:text-3xl">
                  What an approval actually says
                </h2>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">
                  Not &ldquo;Mira approved the homepage&rdquo;. The specific
                  version, the address it came from, and a time that does not
                  depend on anyone&rsquo;s timezone.
                </p>
                <Button asChild variant="outline" className="mt-6">
                  <Link href={ROUTES.features}>All features</Link>
                </Button>
              </div>

              <ul className="space-y-4">
                {[
                  {
                    title: "Bound to one version",
                    body: "An approval record cannot be reassigned. Approving v4 never leaves v3 looking approved.",
                  },
                  {
                    title: "Stored with the client’s address",
                    body: "The email the review link was issued to is recorded against the approval.",
                  },
                  {
                    title: "Timestamped in UTC",
                    body: "Recorded to the minute, so a dispute six months later has something to point at.",
                  },
                  {
                    title: "Locked on approval",
                    body: "No upload, edit, or re-review can touch an approved version afterwards.",
                  },
                ].map((item) => (
                  <li
                    key={item.title}
                    className="flex gap-3 border-b border-rule pb-4 last:border-b-0 last:pb-0"
                  >
                    <Check
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-ink"
                    />
                    <div>
                      <h3 className="text-sm font-semibold text-ink">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                        {item.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-ink text-sheet">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:py-16">
            <div className="max-w-lg">
              <h2 className="text-[1.625rem] font-semibold leading-tight tracking-[-0.025em] sm:text-3xl">
                Stop keeping approvals in your inbox.
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-sheet/75">
                Start with a free workspace. Add a project, upload a version, and
                send the link.
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
                <Link href={ROUTES.pricing}>
                  <Lock aria-hidden="true" />
                  See pricing
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
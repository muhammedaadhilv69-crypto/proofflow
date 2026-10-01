import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { MarketingFooter, MarketingHeader } from "@/app/(marketing)/marketing-chrome";
import { Button } from "@/components/ui/button";
import { SlugLine } from "@/components/slug-line";

type Plan = {
  id: string;
  name: string;
  price: number;
  for: string;
  /** Marks the recommended plan without enlarging it or tinting it. */
  recommended?: boolean;
};

const PLANS: Plan[] = [
  { id: "free", name: "Free", price: 0, for: "One project, end to end" },
  { id: "solo", name: "Solo", price: 12, for: "Independent freelancers" },
  {
    id: "agency",
    name: "Agency",
    price: 39,
    for: "Small client-facing teams",
    recommended: true,
  },
  { id: "pro", name: "Pro", price: 79, for: "Growing agencies" },
];

/**
 * A comparison grid, not four price cards.
 *
 * Cards force the reader to hold one plan in their head while scanning the
 * next, which is exactly the wrong way to compare. A grid with plans as columns
 * puts the variable on the horizontal axis, where the eye already scans. The
 * recommended plan is marked with a rule and a note rather than a colour wash
 * and a bigger box, because nothing here is urgent.
 *
 * On narrow screens the grid scrolls horizontally under a sticky label column,
 * which keeps the comparison intact instead of collapsing it into four separate
 * stacks the reader has to reassemble by hand.
 */
const CAPABILITIES: Array<{
  label: string;
  perPlan: Record<string, string | true | false>;
}> = [
  {
    label: "Projects",
    perPlan: { free: "1", solo: "10", agency: "Unlimited", pro: "Unlimited" },
  },
  {
    label: "Deliverables per project",
    perPlan: { free: "3", solo: "Unlimited", agency: "Unlimited", pro: "Unlimited" },
  },
  {
    label: "Versions per deliverable",
    perPlan: { free: "3", solo: "20", agency: "Unlimited", pro: "Unlimited" },
  },
  {
    label: "Approval records",
    perPlan: { free: true, solo: true, agency: true, pro: true },
  },
  {
    label: "Client review links",
    perPlan: { free: true, solo: true, agency: true, pro: true },
  },
  {
    label: "Team members",
    perPlan: { free: "1", solo: "1", agency: "10", pro: "Unlimited" },
  },
  {
    label: "Link expiry and revocation",
    perPlan: { free: true, solo: true, agency: true, pro: true },
  },
  {
    label: "Client accounts required",
    perPlan: { free: false, solo: false, agency: false, pro: false },
  },
];

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />

      <main className="flex-1">
        <section className="border-b border-rule">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-16">
            <h1 className="max-w-2xl text-[2.125rem] font-semibold leading-[1.08] tracking-[-0.03em] text-ink sm:text-4xl">
              Priced per workspace. Approval records are never behind a paywall.
            </h1>
            <SlugLine
              className="mt-5"
              items={[
                { key: "billing", value: "monthly, cancel any time" },
                { key: "client accounts", value: "never required" },
              ]}
            />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] border-separate border-spacing-0">
              <caption className="sr-only">
                Plan comparison for ProofFlow, listing what each plan includes
              </caption>
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="sticky left-0 z-10 w-56 border-b-2 border-ink bg-paper py-3 pr-4 text-left align-bottom"
                  >
                    <span className="slug-key">included</span>
                  </th>
                  {PLANS.map((plan) => (
                    <th
                      key={plan.id}
                      scope="col"
                      className={
                        plan.recommended
                          ? "border-b-2 border-ink border-x-2 border-t-2 px-4 py-3 text-left align-bottom"
                          : "border-b-2 border-ink px-4 py-3 text-left align-bottom"
                      }
                    >
                      {plan.recommended ? (
                        <span className="slug-key block text-ink">
                          recommended
                        </span>
                      ) : null}
                      <span className="block text-base font-semibold tracking-[-0.01em] text-ink">
                        {plan.name}
                      </span>
                      <span className="mt-1 block font-mono text-lg tabular-nums text-ink">
                        {plan.price === 0 ? "$0" : `$${plan.price}`}
                        <span className="ml-1 text-xs text-ink-faint">/mo</span>
                      </span>
                      <span className="mt-0.5 block text-xs font-normal leading-snug text-ink-faint">
                        {plan.for}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CAPABILITIES.map((row) => (
                  <tr key={row.label}>
                    <th
                      scope="row"
                      className="sticky left-0 z-10 border-b border-rule bg-paper py-3 pr-4 text-left text-sm font-normal text-ink-soft"
                    >
                      {row.label}
                    </th>
                    {PLANS.map((plan) => {
                      const value = row.perPlan[plan.id];
                      const featured = plan.recommended;
                      return (
                        <td
                          key={plan.id}
                          className={
                            featured
                              ? "border-b border-l border-r border-rule bg-sheet px-4 py-3 text-sm text-ink"
                              : "border-b border-rule px-4 py-3 text-sm text-ink-soft"
                          }
                        >
                          {value === true ? (
                            <>
                              <Check
                                aria-hidden="true"
                                className="size-4 text-ink"
                              />
                              <span className="sr-only">Included</span>
                            </>
                          ) : value === false ? (
                            <>
                              <Minus
                                aria-hidden="true"
                                className="size-4 text-ink-faint"
                              />
                              <span className="sr-only">Not included</span>
                            </>
                          ) : (
                            <span className="font-mono tabular-nums">
                              {value}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr>
                  <td className="sticky left-0 z-10 bg-paper py-4" />
                  {PLANS.map((plan) => (
                    <td
                      key={plan.id}
                      className={
                        plan.recommended
                          ? "border-x-2 border-b-2 border-ink px-4 py-4"
                          : "px-4 py-4"
                      }
                    >
                      <Button asChild block variant={plan.recommended ? "default" : "outline"}>
                        <Link href={ROUTES.signup}>
                          {plan.price === 0 ? "Start free" : `Choose ${plan.name}`}
                        </Link>
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-ink-faint">
            Every plan includes the full approval record: client name, email,
            version number, UTC timestamp, and approval ID. Upgrading changes how
            much work you can hold, not what you are allowed to prove.
          </p>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
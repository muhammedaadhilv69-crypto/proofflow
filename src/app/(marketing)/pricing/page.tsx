import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  { name: "Free", price: "$0", description: "For trying the workflow" },
  { name: "Solo", price: "$12", description: "For independent freelancers" },
  {
    name: "Agency",
    price: "$39",
    description: "For small client teams",
    featured: true,
  },
  { name: "Agency Pro", price: "$79", description: "For growing agencies" },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
          <Link href="/" className="font-semibold">
            ProofFlow
          </Link>
          <Button asChild size="sm" variant="outline">
            <Link href="/signup">Start free</Link>
          </Button>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">Simple pricing</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            Choose the workspace that fits your agency.
          </h1>
          <p className="mt-4 text-muted-foreground">
            Start free. Upgrade when your workflow grows.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border bg-background p-6 ${plan.featured ? "border-primary shadow-md" : ""}`}
            >
              {plan.featured ? (
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary">
                  Most popular
                </p>
              ) : null}
              <h2 className="text-lg font-semibold">{plan.name}</h2>
              <p className="mt-4 text-3xl font-bold">
                {plan.price}
                <span className="text-sm font-normal text-muted-foreground">
                  /month
                </span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {plan.description}
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Version-specific approvals",
                  "Client review links",
                  "Approval history",
                ].map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className="mt-7 w-full"
                variant={plan.featured ? "default" : "outline"}
              >
                <Link href="/signup">Get started</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  ["Version-specific approvals", "Know exactly which version was approved."],
  ["Client review links", "Send one simple link. No client account required."],
  ["Revision tracking", "Keep every version and comment in one timeline."],
  ["Approval records", "Know who approved what and when."],
];

export default function MarketingPage() {
  return (
    <main>
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              PF
            </span>
            ProofFlow
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/pricing"
              className="text-muted-foreground hover:text-foreground"
            >
              Pricing
            </Link>
            <Link href="/login" className="hover:text-foreground">
              Sign in
            </Link>
            <Button asChild size="sm">
              <Link href="/signup">Start free</Link>
            </Button>
          </nav>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-primary">
            Client approvals without the guesswork
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">
            Stop searching through WhatsApp for client approvals.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            ProofFlow gives every client deliverable a clear review, revision,
            and version-specific approval record.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/signup">
                Start free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#how-it-works">See how it works</Link>
            </Button>
          </div>
        </div>
      </section>
      <section className="border-y bg-muted/20">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {features.map(([title, description]) => (
            <div key={title} className="rounded-lg border bg-background p-5">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="mt-4 font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>
      <section
        id="how-it-works"
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6"
      >
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-primary">The core workflow</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">
            A provable path from review to approval.
          </h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            "Upload a version",
            "Send a review link",
            "Collect feedback",
            "Record approval",
          ].map((step, index) => (
            <div key={step} className="rounded-lg border p-5">
              <p className="text-sm font-semibold text-primary">0{index + 1}</p>
              <p className="mt-6 font-medium">{step}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Each step stays attached to the exact deliverable version.
              </p>
            </div>
          ))}
        </div>
      </section>
      <section className="border-t bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-5 px-4 py-12 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 className="text-2xl font-bold">Make approval easy to prove.</h2>
            <p className="mt-2 text-sm opacity-80">
              Start with a free workspace for your agency.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/signup">
              Create your workspace <Check className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

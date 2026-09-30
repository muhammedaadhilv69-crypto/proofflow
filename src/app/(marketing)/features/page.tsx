import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileClock,
  Link2,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: ShieldCheck,
    title: "Version-specific approvals",
    body: "Every approval is attached to one immutable version, with a permanent record of who approved it and when.",
  },
  {
    icon: Link2,
    title: "Client review links",
    body: "Send a secure, expiring link to the exact version. Clients do not need an account or onboarding.",
  },
  {
    icon: FileClock,
    title: "Revision tracking",
    body: "Keep every upload, comment, change request, and approval in one chronological deliverable timeline.",
  },
  {
    icon: MessageSquare,
    title: "Client comments",
    body: "Feedback stays attached to the version it refers to, so revisions never lose context.",
  },
  {
    icon: CheckCircle2,
    title: "Approval records",
    body: "See the client, email, exact version, timestamp, and approval ID whenever you need to prove what happened.",
  },
];

export default function FeaturesPage() {
  return (
    <main className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
          <Link href="/" className="font-semibold">
            ProofFlow
          </Link>
          <Button asChild size="sm">
            <Link href="/signup">Start free</Link>
          </Button>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="text-sm font-medium text-primary">
          Built for approval clarity
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight">
          Everything your team needs to review, revise, and prove client
          approval.
        </h1>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border bg-background p-6"
            >
              <feature.icon className="h-6 w-6 text-primary" />
              <h2 className="mt-4 text-lg font-semibold">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {feature.body}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-12 rounded-xl bg-primary p-8 text-primary-foreground">
          <h2 className="text-2xl font-bold">
            Ready to make approvals provable?
          </h2>
          <Button asChild variant="secondary" className="mt-5">
            <Link href="/signup">
              Create your workspace <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

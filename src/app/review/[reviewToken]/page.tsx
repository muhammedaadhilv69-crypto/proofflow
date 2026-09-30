import type { Metadata } from "next";
import { getReviewByToken } from "@/lib/data";
import { ReviewClient } from "./review-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Client review | ProofFlow",
  robots: { index: false, follow: false },
};

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ reviewToken: string }>;
}) {
  const { reviewToken } = await params;
  const result = await getReviewByToken(reviewToken);
  if (result.error || !result.data)
    return <ReviewError message={result.error || "Review link is invalid"} />;
  return <ReviewClient data={result.data} />;
}

function ReviewError({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md rounded-xl border bg-background p-8 text-center shadow-sm">
        <p className="text-sm font-semibold text-primary">ProofFlow</p>
        <h1 className="mt-4 text-2xl font-bold">Review link unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <p className="mt-6 text-xs text-muted-foreground">
          Ask the agency to send you a new review link.
        </p>
      </div>
    </main>
  );
}

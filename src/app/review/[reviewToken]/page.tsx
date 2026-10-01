import type { Metadata } from "next";
import { getReviewByToken } from "@/lib/data";
import { Wordmark } from "@/components/wordmark";
import { ReviewClient } from "./review-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Client review",
  robots: { index: false, follow: false },
};

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ reviewToken: string }>;
}) {
  const { reviewToken } = await params;
  const result = await getReviewByToken(reviewToken);
  if (result.error || !result.data) {
    return <ReviewUnavailable message={result.error ?? "Review link is invalid"} />;
  }
  return <ReviewClient data={result.data} />;
}

/**
 * A dead review link is the most likely thing a client will ever see, so it
 * gets the same care as the review itself: plain wording, no apology, and the
 * one instruction that actually resolves it.
 */
function ReviewUnavailable({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="border-b border-rule bg-sheet">
        <div className="mx-auto flex max-w-3xl items-center px-4 py-3.5 sm:px-6">
          <Wordmark showName={false} />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink">
            This review link does not work
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{message}</p>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            Ask the agency to send you a new link. Links can expire or be turned
            off after a review is finished.
          </p>
        </div>
      </main>
    </div>
  );
}
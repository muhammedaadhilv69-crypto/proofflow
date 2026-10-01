"use client";

import Link from "next/link";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { ErrorBlock } from "@/components/feedback";

export default function ReviewErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, { tags: { boundary: "review" } });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center bg-paper px-4 py-12">
      <div className="mx-auto w-full max-w-md space-y-4">
        <ErrorBlock
          title="This review did not load"
          action={{ label: "Try again", onClick: () => reset() }}
        >
          The page failed before it could show the file. This is usually
          temporary.
        </ErrorBlock>
        <p className="text-sm text-ink-faint">
          If it keeps failing, ask the agency to send you a new review link.
        </p>
        <Button asChild variant="ghost" size="sm">
          <Link href="/">Go to ProofFlow</Link>
        </Button>
      </div>
    </div>
  );
}
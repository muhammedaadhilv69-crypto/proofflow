"use client";

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
    Sentry.captureException(error, {
      tags: { boundary: "review" },
    });
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <div className="w-full space-y-4">
        <ErrorBlock message="This review could not be loaded. The link may be invalid or the service may be unavailable." />
        <Button onClick={() => reset()}>Try again</Button>
      </div>
    </main>
  );
}

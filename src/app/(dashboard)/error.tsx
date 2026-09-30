"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { ErrorBlock } from "@/components/feedback";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, { tags: { boundary: "dashboard" } });
  }, [error]);

  return (
    <div className="mx-auto max-w-xl space-y-4 py-12">
      <ErrorBlock message="ProofFlow could not load this workspace. Check your connection and try again." />
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}

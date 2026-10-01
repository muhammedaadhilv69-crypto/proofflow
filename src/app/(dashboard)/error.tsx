"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { ErrorBlock } from "@/components/feedback";
import { Button } from "@/components/ui/button";

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
    <div className="mx-auto max-w-lg py-6">
      <ErrorBlock
        title="This page did not load"
        action={{ label: "Try again", onClick: () => reset() }}
      >
        Nothing in your workspace has changed. The page failed while it was
        loading, which is usually temporary — try again, and if it keeps
        happening the reference below will identify it.
      </ErrorBlock>
      {error.digest ? (
        <p className="slug mt-3">reference {error.digest}</p>
      ) : null}
      <div className="mt-4">
        <Button asChild variant="ghost" size="sm">
          <a href="/dashboard">Go to the dashboard</a>
        </Button>
      </div>
    </div>
  );
}
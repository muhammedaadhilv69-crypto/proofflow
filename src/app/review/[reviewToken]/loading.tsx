import { Skeleton } from "@/components/ui/skeleton";
import { LoadingRegion } from "@/components/ui/skeleton";

/**
 * The review page loads a file preview, so its skeleton reserves that box up
 * front. Reserving the space keeps the approve bar from jumping up once the
 * proof renders — on this page that jump would land right where the client is
 * about to press a permanent button.
 */
export default function ReviewLoading() {
  return (
    <div className="min-h-screen bg-paper">
      <LoadingRegion label="Loading the review" />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-3 w-56" />
        </div>
        <Skeleton className="mt-8 h-96 w-full rounded-sheet" />
        <div className="mt-10 space-y-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </div>
    </div>
  );
}
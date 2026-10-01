import { Skeleton } from "@/components/ui/skeleton";
import { LoadingRegion } from "@/components/ui/skeleton";

/**
 * The auth shell reserves the form's own height so the split layout does not
 * jump when the real form arrives.
 */
export default function AuthLoading() {
  return (
    <div className="space-y-6">
      <LoadingRegion label="Loading" />
      <div className="space-y-2" aria-hidden="true">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-3 w-64" />
      </div>
      <div className="space-y-5 pt-4" aria-hidden="true">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-9 w-full" />
        </div>
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  );
}
import { SkeletonHeader, SkeletonRow, LoadingRegion } from "@/components/ui/skeleton";

/**
 * The dashboard's loading shape mirrors what it actually renders: a header, then
 * two ruled lists. Announced once as a status region rather than a decorative
 * shimmer, so a screen reader is told what is arriving.
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <LoadingRegion label="Loading your workspace" />
      <SkeletonHeader />
      <div className="space-y-8">
        <section className="space-y-3">
          <div className="h-3 w-40" aria-hidden="true">
            <div className="skeleton h-3 w-40 rounded-mark" />
          </div>
          <div className="rounded-sheet border border-rule bg-sheet">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="border-b border-rule last:border-b-0"
              >
                <SkeletonRow />
              </div>
            ))}
          </div>
        </section>
        <section className="space-y-3">
          <div className="skeleton h-3 w-32 rounded-mark" aria-hidden="true" />
          <div className="rounded-sheet border border-rule bg-sheet">
            {Array.from({ length: 2 }, (_, index) => (
              <div key={index} className="border-b border-rule last:border-b-0">
                <SkeletonRow />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
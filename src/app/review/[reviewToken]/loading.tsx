import { LoadingBlock } from "@/components/feedback";

export default function ReviewLoading() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-10">
      <LoadingBlock label="Loading review" />
    </main>
  );
}

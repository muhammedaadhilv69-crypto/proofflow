import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border bg-background p-8 text-center shadow-sm">
        <p className="text-sm font-semibold text-primary">ProofFlow</p>
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          That page does not exist or has moved. If you followed a review link, ask
          the agency to send you a new one.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href={ROUTES.home}>Go home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={ROUTES.login}>Sign in</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

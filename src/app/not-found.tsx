import { ROUTES } from "@/lib/routes";
import { Wordmark } from "@/components/wordmark";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="border-b border-rule bg-sheet">
        <div className="mx-auto flex max-w-6xl items-center px-4 py-4 sm:px-6">
          <Wordmark />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-16 sm:px-6">
        <div className="max-w-md">
          <p className="slug">error 404</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-ink">
            This page does not exist
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            The address may be mistyped, or the page may have moved. If you
            followed a review link, ask the agency to send you a new one.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <a href={ROUTES.home}>Go home</a>
            </Button>
            <Button asChild variant="outline">
              <a href={ROUTES.login}>Sign in</a>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
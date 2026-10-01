import { Wordmark } from "@/components/wordmark";

/**
 * The auth shell is a split: form on the left, the product's actual promise on
 * the right. The right half is not decoration — someone opening this page has
 * just arrived from an invitation or a forgotten password, and the thing worth
 * showing them is the record they will end up holding, not a stock illustration.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <main className="flex flex-col justify-center px-4 py-12 sm:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Wordmark />
          <div className="mt-8">{children}</div>
        </div>
      </main>

      <aside className="hidden border-l border-rule bg-sheet lg:flex lg:flex-col lg:justify-center lg:px-12">
        <div className="max-w-sm">
          <div className="rounded-sheet border border-rule bg-paper p-5">
            <p className="label-narrow text-[0.6875rem] text-ink-faint">
              Northwind rebrand / Homepage design
            </p>
            <p className="label-narrow mt-3 text-xl font-semibold uppercase leading-none tracking-[0.16em] text-ink">
              Approved
            </p>
            <dl className="mt-4 space-y-1.5 border-t border-rule pt-3">
              {[
                ["record", "APR-7C1E4A9B2D08F615"],
                ["version", "v4"],
                ["approved by", "Mira Vance"],
                ["recorded", "2026-09-30 18:02 UTC"],
              ].map(([key, value]) => (
                <div key={key} className="flex items-baseline gap-3">
                  <dt className="slug-key w-20 shrink-0">{key}</dt>
                  <dd className="truncate font-mono text-xs tabular-nums text-ink">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <p className="mt-5 text-sm leading-relaxed text-ink-soft">
            When a client approves a proof, ProofFlow records which version they
            saw, who they were, and exactly when. That record cannot be edited
            afterwards.
          </p>
        </div>
      </aside>
    </div>
  );
}
import { Wordmark } from "@/components/wordmark";

/**
 * The auth shell is a split: form on the left, the product's actual promise on
 * the right. The right half is not decoration — someone opening this page has
 * just arrived from an invitation or a forgotten password, and the thing worth
 * showing them is the record they will end up holding, not a stock illustration.
 *
 * It is shown as the real gradient seal rather than a muted sketch of one, for
 * the same reason the landing page shows the real revision rail: a promise drawn
 * in the product's own materials reads differently from a promise described in
 * words.
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

      <aside className="hidden items-center justify-center bg-sheet px-12 lg:flex">
        <div className="max-w-sm">
          <div className="gradient-brand rounded-sheet p-6 shadow-lift">
            <p className="text-xs font-medium text-white/80">
              Northwind rebrand / Homepage design
            </p>
            <p className="mt-2 text-2xl font-semibold uppercase leading-none tracking-[0.08em] text-white">
              Approved
            </p>
            <dl className="mt-5 space-y-2 rounded-field bg-[hsl(253_69%_22%)] p-4">
              {[
                ["record", "APR-7C1E4A9B2D08F615"],
                ["version", "v4"],
                ["approved by", "Mira Vance"],
                ["recorded", "2026-09-30 18:02 UTC"],
              ].map(([key, value]) => (
                <div key={key} className="flex items-baseline gap-3">
                  <dt className="w-20 shrink-0 text-[0.6875rem] font-medium text-white/60">
                    {key}
                  </dt>
                  <dd className="truncate font-mono text-xs tabular-nums text-white">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <p className="mt-6 text-sm leading-relaxed text-ink-soft">
            When a client approves a proof, ProofFlow records which version they
            saw, who they were, and exactly when. That record cannot be edited
            afterwards.
          </p>
        </div>
      </aside>
    </div>
  );
}
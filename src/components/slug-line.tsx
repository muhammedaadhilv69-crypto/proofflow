import { cn } from "@/lib/utils";

export type SlugItem = {
  key: string;
  value: React.ReactNode;
  /** Renders the value in the state ink rather than neutral mono. */
  tone?: "default" | "strong";
};

/**
 * The slug line.
 *
 * Prepress runs a monospaced metadata strip along the foot of a sheet, and that
 * strip is the moment a print job stops being a picture and becomes a record.
 * ProofFlow uses it for the same job: version numbers, approval IDs, dates,
 * file facts — the facts that identify a document rather than decorate it.
 *
 * It is a run of key/value pairs sitting on one baseline, deliberately never a
 * middot-joined string. A middot forces the reader to re-parse which fragment
 * is which; aligned columns do not. Where two numbers will be compared down a
 * list — version dates, file sizes — this is the only shape that works.
 */
export function SlugLine({
  items,
  className,
  size = "default",
}: {
  items: SlugItem[];
  className?: string;
  size?: "default" | "compact";
}) {
  const visible = items.filter((item) => item.value !== null && item.value !== undefined);
  if (!visible.length) return null;

  return (
    <dl
      className={cn(
        "flex flex-wrap items-baseline gap-x-5 gap-y-1.5",
        className,
      )}
    >
      {visible.map((item) => (
        <div key={item.key} className="flex items-baseline gap-1.5">
          <dt className={cn("slug-key", size === "compact" && "text-[0.625rem]")}>
            {item.key}
          </dt>
          <dd
            className={cn(
              "font-mono tabular-nums",
              size === "compact" ? "text-[0.6875rem]" : "text-xs",
              item.tone === "strong" ? "font-medium text-ink" : "text-ink-soft",
            )}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * A single key/value pair where the key is too small to justify a run — the
 * facts that sit under a title inside a plate.
 */
export function Slug({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline gap-1.5", className)}>
      <span className="slug-key">{label}</span>
      <span className="font-mono text-xs tabular-nums text-ink-soft">
        {children}
      </span>
    </div>
  );
}
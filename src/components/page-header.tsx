import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SlugLine, type SlugItem } from "@/components/slug-line";

/**
 * Every authenticated page opens with this, and it replaces the "eyebrow label
 * above a heading" pattern on principle: a small line of text above a large one
 * is decoration, whereas a path above a title tells you where you are and how
 * to get back. The second line is a slug line of real facts, never a
 * middot-joined summary.
 */
export function PageHeader({
  path,
  title,
  slug,
  actions,
  className,
}: {
  /** Breadcrumb trail. The last segment is the current page and is not a link. */
  path: Array<{ label: string; href?: string }>;
  title: React.ReactNode;
  slug?: SlugItem[];
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-5 border-b border-rule/70 pb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-6",
        className,
      )}
    >
      <div className="min-w-0">
        <Breadcrumb path={path} />
        <h1 className="mt-2.5 text-[2rem] font-semibold leading-[1.1] tracking-[-0.03em] text-ink sm:text-[2.5rem]">
          {title}
        </h1>
        {slug?.length ? (
          <SlugLine items={slug} className="mt-4" size="compact" />
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pt-8">
          {actions}
        </div>
      ) : null}
    </header>
  );
}

function Breadcrumb({
  path,
}: {
  path: Array<{ label: string; href?: string }>;
}) {
  if (!path.length) return null;
  return (
    <nav aria-label="Breadcrumb">
      <ol className="label-narrow flex flex-wrap items-center gap-1 text-[0.6875rem] text-ink-faint">
        {path.map((crumb, index) => {
          const last = index === path.length - 1;
          return (
            <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
              {crumb.href && !last ? (
                <Link
                  href={crumb.href}
                  className="rounded-mark transition-colors hover:text-ink"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={last ? "text-ink-soft" : undefined}>
                  {crumb.label}
                </span>
              )}
              {last ? null : (
                <ChevronRight aria-hidden="true" className="size-3 opacity-50" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Groups that sit under a page header without needing their own title. */
export function Section({
  title,
  slug,
  action,
  className,
  bodyClassName,
  children,
}: {
  title: string;
  slug?: SlugItem[];
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1.5">
          <h2 className="text-[0.9375rem] font-semibold text-ink">{title}</h2>
          {slug?.length ? <SlugLine items={slug} size="compact" /> : null}
        </div>
        {action}
      </div>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
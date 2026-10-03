import Image from "next/image";
import { Download, FileWarning } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The proof preview.
 *
 * This is the one place in the product where a real drop shadow is used on
 * purpose: the image stands for a sheet of paper lying on a light table, and
 * giving it lift is the only way to say so without a caption. Everything else
 * in ProofFlow is interface and stays flat.
 *
 * The ground here is `--stock`, not `--sheet`, and that is the one place in the
 * product where the theme deliberately does not get a vote. A proof is the
 * artefact under judgement: if the surface under it turned near-black in the
 * evening, the same file would read as a different deliverable to the person
 * deciding whether to approve it. So the sheet stays paper-coloured in both
 * rooms, and dark mode is the light table after hours rather than a dark room.
 */
export function FilePreview({
  url,
  mimeType,
  filename,
  className,
}: {
  url: string | null;
  mimeType: string;
  filename: string;
  className?: string;
}) {
  if (!url) {
    return (
    <div
      className={cn(
        "flex min-h-48 flex-col items-center justify-center gap-2.5 rounded-sheet border border-dashed border-rule-strong bg-wash p-8 text-center",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="grid size-11 place-items-center rounded-full bg-sheet text-ink-faint shadow-sheet"
      >
        <FileWarning className="size-5" />
      </span>
      <p className="text-sm text-ink-soft">
        This file could not be loaded. It may have been removed from storage.
      </p>
    </div>
  );
  }

  if (mimeType === "application/pdf") {
    return (
      <div className={cn("space-y-2.5", className)}>
        <iframe
          title={filename}
          src={`${url}#view=FitH`}
          className="h-[32rem] w-full rounded-sheet border border-rule bg-stock"
        />
        <OpenLink href={url} label="Open the PDF" />
      </div>
    );
  }

  if (mimeType === "image/svg+xml") {
    return (
      <div className={cn("space-y-2.5", className)}>
        <iframe
          title={filename}
          src={url}
          sandbox=""
          className="min-h-72 w-full rounded-sheet border border-rule bg-stock shadow-proof"
        />
        <OpenLink href={url} label="Download the SVG" download />
      </div>
    );
  }

  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="relative min-h-64 overflow-hidden rounded-sheet border border-rule bg-stock shadow-proof">
        <Image
          src={url}
          alt={filename}
          fill
          unoptimized
          sizes="(max-width: 1024px) 100vw, 720px"
          className="object-contain"
        />
      </div>
      <OpenLink href={url} label="Open the original file" />
    </div>
  );
}

function OpenLink({
  href,
  label,
  download,
}: {
  href: string;
  label: string;
  download?: boolean;
}) {
  return (
    <a
      href={href}
      {...(download ? { download: true } : { target: "_blank", rel: "noreferrer" })}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-signal underline underline-offset-4 decoration-signal/40 hover:decoration-signal"
    >
      <Download aria-hidden="true" className="size-3.5" />
      {label}
    </a>
  );
}
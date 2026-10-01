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
          "flex min-h-48 flex-col items-center justify-center gap-2 rounded-sheet border border-dashed border-rule-strong bg-wash/40 px-6 text-center",
          className,
        )}
      >
        <FileWarning aria-hidden="true" className="size-5 text-ink-faint" />
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
          className="h-[32rem] w-full rounded-sheet border border-rule bg-sheet"
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
          className="min-h-72 w-full rounded-sheet border border-rule bg-sheet shadow-proof"
        />
        <OpenLink href={url} label="Download the SVG" download />
      </div>
    );
  }

  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="relative min-h-64 overflow-hidden rounded-sheet border border-rule bg-sheet shadow-proof">
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
      className="inline-flex items-center gap-1.5 text-sm text-signal underline-offset-4 hover:underline"
    >
      <Download aria-hidden="true" className="size-3.5" />
      {label}
    </a>
  );
}
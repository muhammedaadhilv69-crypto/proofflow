import Image from "next/image";
import { Download, FileText } from "lucide-react";

export function FilePreview({
  url,
  mimeType,
  filename,
}: {
  url: string | null;
  mimeType: string;
  filename: string;
}) {
  if (!url)
    return (
      <div className="flex min-h-48 items-center justify-center rounded-lg border bg-muted text-sm text-muted-foreground">
        Preview unavailable
      </div>
    );
  if (mimeType === "application/pdf")
    return (
      <div className="space-y-3">
        <iframe
          title={filename}
          src={url}
          className="h-112 w-full rounded-lg border"
        />
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <Download className="h-4 w-4" />
          Open PDF
        </a>
      </div>
    );
  if (mimeType === "image/svg+xml")
    return (
      <div className="space-y-3">
        <iframe
          title={filename}
          src={url}
          sandbox=""
          className="min-h-64 w-full rounded-lg border bg-white"
        />
        <a
          href={url}
          download={filename}
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <Download className="h-4 w-4" />
          Download SVG
        </a>
      </div>
    );
  return (
    <div className="space-y-3">
      <div className="relative min-h-64 overflow-hidden rounded-lg border bg-white">
        <Image
          src={url}
          alt={filename}
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-contain"
        />
      </div>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
      >
        <Download className="h-4 w-4" />
        Open original
      </a>
    </div>
  );
}

export function FileTypeLabel({ mimeType }: { mimeType: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <FileText className="h-3 w-3" />
      {mimeType === "application/pdf"
        ? "PDF"
        : mimeType.split("/")[1]?.toUpperCase()}
    </span>
  );
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** The em dash, written as an escape so file encoding can never corrupt it. */
const EM_DASH = "\u2014";

/**
 * Prose date, e.g. "Oct 14, 2026". Use where a date is read as part of a
 * sentence.
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return EM_DASH;
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Slug-line date, e.g. "2026-10-14". Fixed-width and unambiguous, so a column
 * of them can be scanned for the sequence a proof was worked through.
 */
export function formatDateSlug(
  date: Date | string | null | undefined,
): string {
  if (!date) return EM_DASH;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return EM_DASH;
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${parsed.getFullYear()}-${month}-${day}`;
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return EM_DASH;
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * The stamp used on the approval seal: ISO 8601 to the minute in UTC.
 *
 * An approval record is a contractual artifact, so the time on it must not
 * depend on whose timezone the reader happens to be in.
 */
export function formatStampUtc(
  date: Date | string | null | undefined,
): string {
  if (!date) return EM_DASH;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return EM_DASH;
  return `${parsed.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

/** The same instant in the reader's own timezone, for cross-checking. */
export function formatStampLocal(
  date: Date | string | null | undefined,
): string {
  if (!date) return EM_DASH;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return EM_DASH;
  const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16).replace("T", " ");
}

/** "4 min ago", "3 hr ago", "Sep 14" once it is older than a week. */
export function formatRelative(date: Date | string | null | undefined): string {
  if (!date) return EM_DASH;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return EM_DASH;
  const seconds = Math.round((Date.now() - parsed.getTime()) / 1000);
  if (seconds < 45) return "just now";
  if (seconds < 5400) return `${Math.round(seconds / 60)} min ago`;
  if (seconds < 172800) return `${Math.round(seconds / 3600)} hr ago`;
  if (seconds < 604800) return `${Math.round(seconds / 86400)} d ago`;
  return formatDate(parsed);
}

const BYTE_UNITS = ["B", "KB", "MB", "GB"];

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return EM_DASH;
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < BYTE_UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const decimals = unit === 0 || value >= 10 ? 0 : 1;
  return `${value.toFixed(decimals)} ${BYTE_UNITS[unit]}`;
}

const MIME_LABELS: Record<string, string> = {
  "image/png": "PNG",
  "image/jpeg": "JPEG",
  "image/webp": "WebP",
  "image/svg+xml": "SVG",
  "application/pdf": "PDF",
};

export function fileTypeLabel(mimeType: string | null | undefined): string {
  if (!mimeType) return EM_DASH;
  return MIME_LABELS[mimeType] ?? mimeType.split("/").pop()?.toUpperCase() ?? EM_DASH;
}

export function generateSlug(name: string): string {
  const slug = name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || "workspace";
}

export function generateReviewToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

export function generateApprovalToken(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return `APR-${Array.from(array, (byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

/** Initials for an avatar. Falls back to a single glyph, never an empty box. */
export function initials(name: string | null | undefined): string {
  const parts = (name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
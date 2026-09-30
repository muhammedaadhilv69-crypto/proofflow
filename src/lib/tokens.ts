import { createHash, randomBytes } from "node:crypto";

export function createOpaqueToken() {
  return randomBytes(32).toString("hex");
}

export function hashReviewToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getFileExtension(mimeType: string) {
  const extensions: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "application/pdf": "pdf",
    "image/svg+xml": "svg",
  };
  return extensions[mimeType] ?? "bin";
}

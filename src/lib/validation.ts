import { z } from "zod";

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter your name")
    .max(100, "Name is too long"),
  email: z.string().trim().email("Enter a valid email address").max(254),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
  confirmPassword: z.string().min(8, "Confirm your password"),
});

export const loginSchema = z.object({
  // Bounded like every other email schema here. Without a cap the address runs
  // through normalisation and hashing in full on every rejected login.
  email: z.string().trim().email("Enter a valid email address").max(254),
  password: z.string().min(1, "Enter your password"),
});

export const clientSchema = z.object({
  name: z.string().trim().min(2, "Enter a client name").max(120),
  email: z.string().trim().email("Enter a valid client email").max(254),
  company: z.string().trim().max(120).optional().or(z.literal("")),
});

export const projectSchema = z.object({
  name: z.string().trim().min(2, "Enter a project name").max(160),
  clientId: z.string().uuid("Choose a client"),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
});

export const projectEditSchema = z.object({
  name: z.string().trim().min(2, "Enter a project name").max(160),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
});

export const deliverableSchema = z.object({
  name: z.string().trim().min(2, "Enter a deliverable name").max(160),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const versionSchema = z.object({
  description: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const commentSchema = z.object({
  body: z.string().trim().min(1, "Write a comment").max(5000),
});

export const changeRequestSchema = z.object({
  body: z
    .string()
    .trim()
    .min(10, "Tell the agency what needs to change")
    .max(5000),
});

export const inviteSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address")
    .max(254),
});

export const memberRoleSchema = z.object({
  role: z.enum(["OWNER", "MEMBER"]),
});

export const uuidSchema = z
  .string()
  .trim()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    "Invalid identifier",
  );

export const allowedMimeTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "image/svg+xml",
] as const;
export const maxFileSize = 25 * 1024 * 1024;

export function validateFile(file: File) {
  if (
    !allowedMimeTypes.includes(file.type as (typeof allowedMimeTypes)[number])
  ) {
    return {
      valid: false as const,
      error: "Upload a PNG, JPG, WebP, PDF, or SVG file",
    };
  }

  if (file.size <= 0 || file.size > maxFileSize) {
    return { valid: false as const, error: "Files must be smaller than 25 MB" };
  }

  return { valid: true as const };
}

export async function validateFileSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const startsWith = (...values: number[]) =>
    values.every((value, index) => bytes[index] === value);
  const isPng = startsWith(137, 80, 78, 71, 13, 10, 26, 10);
  const isJpeg = startsWith(255, 217, 255);
  const isWebp =
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  const isPdf = String.fromCharCode(...bytes.slice(0, 4)) === "%PDF";
  let isSvg = false;
  if (file.type === "image/svg+xml") {
    const source = await file.text();
    const hasUnsafeSvgContent =
      /<script[\s>]|<foreignObject[\s>]|\bon[a-z]+\s*=|(?:href|xlink:href)\s*=\s*["'](?:javascript:|data:text\/html|https?:)/i.test(
        source,
      );
    isSvg = /<svg[\s>]/i.test(source) && !hasUnsafeSvgContent;
  }

  const valid =
    (file.type === "image/png" && isPng) ||
    (file.type === "image/jpeg" && isJpeg) ||
    (file.type === "image/webp" && isWebp) ||
    (file.type === "application/pdf" && isPdf) ||
    (file.type === "image/svg+xml" && isSvg);
  return valid
    ? { valid: true as const }
    : {
        valid: false as const,
        error: "The file contents do not match its file type",
      };
}

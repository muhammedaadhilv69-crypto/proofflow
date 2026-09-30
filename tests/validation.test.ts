import assert from "node:assert/strict";
import test from "node:test";
import {
  changeRequestSchema,
  clientSchema,
  commentSchema,
  inviteSchema,
  loginSchema,
  maxFileSize,
  memberRoleSchema,
  signupSchema,
  uuidSchema,
  validateFile,
  validateFileSignature,
} from "@/lib/validation";

function fileOf(bytes: number[] | string, type: string, name = "upload") {
  const body =
    typeof bytes === "string"
      ? new TextEncoder().encode(bytes)
      : new Uint8Array(bytes);
  return new File([body], name, { type });
}

const PNG_HEADER = [137, 80, 78, 71, 13, 10, 26, 10];

test("signup requires a matching, long enough password pair", () => {
  assert.equal(signupSchema.safeParse({
    name: "Aadhil",
    email: "a@example.com",
    password: "correct-horse",
    confirmPassword: "correct-horse",
  }).success, true);

  assert.equal(signupSchema.safeParse({
    name: "A",
    email: "a@example.com",
    password: "correct-horse",
    confirmPassword: "correct-horse",
  }).success, false, "single character names are not useful");

  assert.equal(signupSchema.safeParse({
    name: "Aadhil",
    email: "not-an-email",
    password: "correct-horse",
    confirmPassword: "correct-horse",
  }).success, false);

  assert.equal(signupSchema.safeParse({
    name: "Aadhil",
    email: "a@example.com",
    password: "short",
    confirmPassword: "short",
  }).success, false);
});

test("login allows any non-empty password so it cannot leak length rules", () => {
  assert.equal(loginSchema.safeParse({ email: "a@example.com", password: "x" }).success, true);
  assert.equal(loginSchema.safeParse({ email: "a@example.com", password: "" }).success, false);
  assert.equal(loginSchema.safeParse({ email: "nope", password: "x" }).success, false);
});

test("comment and change request bounds are enforced", () => {
  assert.equal(commentSchema.safeParse({ body: "Looks good" }).success, true);
  assert.equal(commentSchema.safeParse({ body: "   " }).success, false, "whitespace is not a comment");
  assert.equal(commentSchema.safeParse({ body: "x".repeat(5001) }).success, false);

  assert.equal(changeRequestSchema.safeParse({ body: "Please change the headline" }).success, true);
  assert.equal(changeRequestSchema.safeParse({ body: "too short" }).success, false);
});

test("invitations require a valid email and normalise it", () => {
  assert.equal(inviteSchema.safeParse({ email: "  Teammate@Agency.COM " }).data?.email, "teammate@agency.com");
  assert.equal(inviteSchema.safeParse({ email: "nope" }).success, false);
  assert.equal(inviteSchema.safeParse({ email: "" }).success, false);
});

test("member roles are limited to the two known values", () => {
  assert.equal(memberRoleSchema.safeParse({ role: "OWNER" }).success, true);
  assert.equal(memberRoleSchema.safeParse({ role: "MEMBER" }).success, true);
  assert.equal(memberRoleSchema.safeParse({ role: "ADMIN" }).success, false);
  assert.equal(memberRoleSchema.safeParse({ role: "owner" }).success, false);
});

test("identifiers passed into SQL must be uuids", () => {
  assert.equal(uuidSchema.safeParse("123e4567-e89b-12d3-a456-426614174000").success, true);
  assert.equal(uuidSchema.safeParse("123e4567e89b12d3a456426614174000").success, false);
  assert.equal(uuidSchema.safeParse("'; drop table workspace_members; --").success, false);
  assert.equal(uuidSchema.safeParse("").success, false);
});

test("client records require a name and a deliverable email", () => {
  assert.equal(clientSchema.safeParse({ name: "Sarah", email: "sarah@valacafe.test", company: "" }).success, true);
  assert.equal(clientSchema.safeParse({ name: "S", email: "sarah@valacafe.test", company: "" }).success, false);
  assert.equal(clientSchema.safeParse({ name: "Sarah", email: "nope", company: "" }).success, false);
});

test("uploads are limited to the allowed media types and size", () => {
  const png = fileOf(PNG_HEADER, "image/png");
  assert.equal(validateFile(png).valid, true);

  const executable = fileOf([0x4d, 0x5a, 0x90, 0x00], "application/x-msdownload");
  assert.equal(validateFile(executable).valid, false, "only the allowlist may be uploaded");

  const empty = new File([], "empty.png", { type: "image/png" });
  assert.equal(validateFile(empty).valid, false);

  const oversized = new File(
    [new Uint8Array(PNG_HEADER)],
    "big.png",
    { type: "image/png" },
  );
  Object.defineProperty(oversized, "size", { value: maxFileSize + 1 });
  assert.equal(validateFile(oversized).valid, false);
});

test("file contents must match the declared media type", async () => {
  // A PNG extension with PHP inside is the classic polyglot upload attempt.
  const disguised = fileOf("<?php system($_GET['c']); ?>", "image/png", "shell.png");
  assert.equal((await validateFileSignature(disguised)).valid, false);

  const truncatedPng = fileOf([137, 80, 78], "image/png", "truncated.png");
  assert.equal((await validateFileSignature(truncatedPng)).valid, false);

  const realPng = fileOf(PNG_HEADER, "image/png", "real.png");
  assert.equal((await validateFileSignature(realPng)).valid, true);

  const fakePdf = fileOf("this is not a pdf", "application/pdf", "fake.pdf");
  assert.equal((await validateFileSignature(fakePdf)).valid, false);
});

test("svg uploads are rejected when they carry script or external references", async () => {
  const inert = fileOf(
    '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>',
    "image/svg+xml",
    "safe.svg",
  );
  assert.equal((await validateFileSignature(inert)).valid, true);

  const scripted = fileOf(
    '<svg xmlns="http://www.w3.org/2000/svg"><script>fetch("http://evil.example.com")</script></svg>',
    "image/svg+xml",
    "xss.svg",
  );
  assert.equal((await validateFileSignature(scripted)).valid, false);

  const eventHandler = fileOf(
    '<svg xmlns="http://www.w3.org/2000/svg"><rect onload="alert(1)" width="10" height="10"/></svg>',
    "image/svg+xml",
    "handler.svg",
  );
  assert.equal((await validateFileSignature(eventHandler)).valid, false);

  const foreignObject = fileOf(
    '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><body onload="alert(1)"/></foreignObject></svg>',
    "image/svg+xml",
    "foreign.svg",
  );
  assert.equal((await validateFileSignature(foreignObject)).valid, false);

  const remoteHref = fileOf(
    '<svg xmlns="http://www.w3.org/2000/svg"><a href="https://evil.example.com">click</a></svg>',
    "image/svg+xml",
    "remote.svg",
  );
  assert.equal((await validateFileSignature(remoteHref)).valid, false);

  const dataHtml = fileOf(
    '<svg xmlns="http://www.w3.org/2000/svg"><a href="data:text/html,<script>alert(1)</script>">click</a></svg>',
    "image/svg+xml",
    "data.svg",
  );
  assert.equal((await validateFileSignature(dataHtml)).valid, false);

  // An svg claim on non-svg bytes must not pass either.
  const notSvg = fileOf("plain text", "image/svg+xml", "fake.svg");
  assert.equal((await validateFileSignature(notSvg)).valid, false);
});

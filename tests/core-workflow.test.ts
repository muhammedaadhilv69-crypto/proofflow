import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  canApproveVersion,
  isVersionLocked,
  nextVersionNumber,
  statusAfterChangeRequest,
  statusAfterNewVersion,
} from "@/lib/workflow";
import { hashReviewToken } from "@/lib/tokens";

test("server-side version numbering never reuses a number", () => {
  assert.equal(nextVersionNumber([]), 1);
  assert.equal(
    nextVersionNumber([{ versionNumber: 1 }, { versionNumber: 3 }]),
    4,
  );
});

test("only the current in-review version can be approved", () => {
  assert.deepEqual(
    canApproveVersion({ status: "IN_REVIEW" }, true, false, "IN_REVIEW"),
    { allowed: true },
  );
  assert.deepEqual(
    canApproveVersion({ status: "IN_REVIEW" }, false, false, "IN_REVIEW"),
    { allowed: false, reason: "not_current" },
  );
  assert.deepEqual(
    canApproveVersion({ status: "IN_REVIEW" }, true, true, "IN_REVIEW"),
    { allowed: false, reason: "already_approved" },
  );
});

test("approved versions are locked and deliverable transitions are stable", () => {
  assert.equal(isVersionLocked({ status: "IN_REVIEW" }, true), true);
  assert.equal(isVersionLocked({ status: "APPROVED" }, false), true);
  assert.equal(statusAfterNewVersion(), "IN_REVIEW");
  assert.equal(statusAfterChangeRequest(), "CHANGES_REQUESTED");
});

test("review token hashes are deterministic and do not expose the raw token", () => {
  const token = "a".repeat(64);
  const hash = hashReviewToken(token);
  assert.equal(hash.length, 64);
  assert.equal(hash, hashReviewToken(token));
  assert.notEqual(hash, token);
});

test("database workflow contract includes atomic approval and immutable records", async () => {
  const sql = await readFile("src/db/sql/001_initial_schema.sql", "utf8");
  const workflowSql = await readFile(
    "src/db/sql/002_security_and_workflow.sql",
    "utf8",
  );
  assert.match(
    workflowSql,
    /create or replace function public\.approve_version/,
  );
  assert.match(workflowSql, /approval_records_immutable/);
  assert.match(workflowSql, /versions_immutable/);
  assert.match(sql, /unique \(deliverable_id, version_number\)/);
  assert.match(
    workflowSql,
    /create or replace function public\.create_version/,
  );
  assert.match(sql, /version_id uuid not null unique/i);
  assert.match(sql, /unique \(id, workspace_id\)/);
  assert.match(sql, /create extension if not exists pgcrypto/i);
  assert.match(workflowSql, /already been approved/);
  assert.match(workflowSql, /public\.is_workspace_member/);
  // Every table holding tenant data must be behind row level security.
  for (const table of [
    "users",
    "workspaces",
    "workspace_members",
    "clients",
    "projects",
    "deliverables",
    "files",
    "versions",
    "comments",
    "approval_records",
    "review_tokens",
    "activity_events",
    "notifications",
  ]) {
    assert.match(
      workflowSql,
      new RegExp(`alter table public\\.${table} enable row level security`),
      `${table} must have row level security enabled`,
    );
  }
  // Client-facing writes must go through the service role, never the user token.
  for (const fn of [
    "create_version",
    "create_review_token",
    "add_review_comment",
    "approve_version",
    "add_agency_comment",
  ]) {
    assert.match(
      workflowSql,
      new RegExp(
        `grant\\s+execute on function public\\.${fn}\\s*\\([^)]*\\) to service_role`,
      ),
      `${fn} must not be executable by anon or authenticated`,
    );
  }
});

test("the service role key is never referenced from client-side code", async () => {
  const { readdir } = await import("node:fs/promises");
  const path = await import("node:path");

  async function walk(dir: string): Promise<string[]> {
    const entries = await readdir(dir, { withFileTypes: true });
    const nested = await Promise.all(
      entries.map(async (entry) => {
        const full = path.join(dir, entry.name);
        return entry.isDirectory() ? walk(full) : [full];
      }),
    );
    return nested.flat();
  }

  const files = (await walk("src")).filter(
    (file) => /\.(ts|tsx)$/.test(file) && !file.includes(`${path.sep}lib${path.sep}supabase${path.sep}admin.ts`),
  );

  const offenders: string[] = [];
  for (const file of files) {
    const contents = await readFile(file, "utf8");
    if (!contents.includes("SUPABASE_SERVICE_ROLE_KEY")) continue;
    // The admin client is server-only, but the constant must never be inlined
    // into a file marked "use client" or handed to the browser.
    if (/^\s*["']use client["']/m.test(contents)) {
      offenders.push(path.relative(process.cwd(), file));
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `service role key referenced from client components:\n${offenders.join("\n")}`,
  );
});

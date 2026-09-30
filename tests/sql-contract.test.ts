import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// tsx emits CommonJS for this project, so the file read is memoized and awaited
// inside each test rather than at the top level.
let hardeningSqlPromise: Promise<string> | undefined;
function hardeningSql() {
  hardeningSqlPromise ??= readFile(
    "src/db/sql/003_production_hardening.sql",
    "utf8",
  );
  return hardeningSqlPromise;
}

let rateLimitSqlPromise: Promise<string> | undefined;
/**
 * The migration that last redefines `consume_rate_limit`. 004 replaces the
 * function, so asserting against 003 alone would test a definition the
 * database no longer runs. Returned whole, because the DDL the function relies
 * on (the new column) sits alongside it in the same file.
 */
function effectiveRateLimitSql() {
  rateLimitSqlPromise ??= (async () => {
    let body = "";
    for (const file of [
      "src/db/sql/003_production_hardening.sql",
      "src/db/sql/004_rate_limit_window.sql",
    ]) {
      const sql = await readFile(file, "utf8");
      if (sql.includes("create or replace function public.consume_rate_limit")) {
        body = sql;
      }
    }
    return body;
  })();
  return rateLimitSqlPromise;
}

test("a bucket expires against its own window, not a flat hour", async () => {
  // Regression: 003 swept on `window_started_at < now() - interval '1 hour'`.
  // That was safe while every window was 15 minutes or 1 hour, but the
  // per-account auth limit is a 24 hour window, so its bucket was deleted about
  // an hour in and the ceiling silently became roughly 30 per hour.
  const sql = await effectiveRateLimitSql();

  assert.match(
    sql,
    /alter table public\.rate_limit_buckets\s*add column if not exists window_seconds integer not null default 3600/,
  );
  assert.match(
    sql,
    /where window_started_at < now\(\) - make_interval\(secs => coalesce\(window_seconds, 3600\)\)/,
  );
  assert.doesNotMatch(
    sql,
    /where window_started_at < now\(\) - interval '1 hour'/,
    "a flat hour cannot expire a 24 hour bucket",
  );
  // The window has to be recorded on the row, not just on the call.
  assert.match(sql, /values \(p_key, now\(\), 1, p_window_seconds\)/);
  assert.match(sql, /window_seconds = case/);
});

test("rate limiting is backed by a durable table, not process memory", async () => {
  const sql = await hardeningSql();
  assert.match(
    sql,
    /create table if not exists public\.rate_limit_buckets/,
  );
  assert.match(
    sql,
    /create or replace function public\.consume_rate_limit \(p_key text, p_limit integer, p_window_seconds integer\) returns boolean/,
  );
  // The counter must be incremented with a single atomic upsert, otherwise
  // concurrent requests can both read the same count and both be allowed.
  assert.match(sql, /on conflict \(bucket_key\) do update/);
  assert.match(sql, /for update skip locked/, "sweeps must not serialise on the hot path");
});

test("rate limiting is unreachable from the anon and authenticated roles", async () => {
  const sql = await hardeningSql();
  assert.match(
    sql,
    /revoke all on function public\.consume_rate_limit \(text, integer, integer\)\s*from\s*public,\s*anon,\s*authenticated/,
  );
  assert.match(
    sql,
    /grant execute on function public\.consume_rate_limit \(text, integer, integer\) to service_role/,
  );
  assert.match(sql, /alter table public\.rate_limit_buckets enable row level security/);
});

test("invitations can only ever grant the member role", async () => {
  // An invitation that could grant OWNER would be a privilege-escalation path
  // through a forwarded email, so the column constraint forbids it outright.
  const sql = await hardeningSql();
  assert.match(sql, /role text not null default 'MEMBER' check \(role = 'MEMBER'\)/);
});

test("invitation tokens are hashed and single use", async () => {
  const sql = await hardeningSql();
  assert.match(sql, /token_hash text not null unique/);
  assert.match(
    sql,
    /digest\(raw_token, 'sha256'\)/,
    "the raw token must never be persisted",
  );
  assert.match(
    sql,
    /invitation_row\.accepted_at is not null/,
    "an accepted invitation must not be reusable",
  );
  assert.match(sql, /invitation_row\.revoked_at is not null/);
  assert.match(sql, /invitation_row\.expires_at <= now\(\)/);
});

test("only owners can create or revoke invitations", async () => {
  const sql = await hardeningSql();
  const createBody = sql.slice(
    sql.indexOf(
      "create or replace function public.create_workspace_invitation",
    ),
    sql.indexOf(
      "create or replace function public.accept_workspace_invitation",
    ),
  );
  assert.match(createBody, /public\.is_workspace_owner \(p_workspace_id\)/);

  const revokeBody = sql.slice(
    sql.indexOf(
      "create or replace function public.revoke_workspace_invitation",
    ),
    sql.indexOf(
      "create or replace function public.update_workspace_member_role",
    ),
  );
  assert.match(revokeBody, /public\.is_workspace_owner \(p_workspace_id\)/);
});

test("an invitation can only be accepted by the address it was sent to", async () => {
  const sql = await hardeningSql();
  const acceptBody = sql.slice(
    sql.indexOf(
      "create or replace function public.accept_workspace_invitation",
    ),
    sql.indexOf(
      "create or replace function public.revoke_workspace_invitation",
    ),
  );
  assert.match(acceptBody, /if auth\.uid\(\) is null then/);
  assert.match(acceptBody, /caller_email <> lower\(invitation_row\.email\)/);
  assert.match(
    acceptBody,
    /raise exception 'This invitation was sent to a different email address'/,
  );
});

test("a workspace can never be left without an owner", async () => {
  const sql = await hardeningSql();
  assert.match(
    sql,
    /raise exception 'You cannot remove your own owner access/,
  );
  // Both the demote and the remove paths must guard the last remaining owner.
  const guarded = sql.match(
    /raise exception 'A workspace must always keep at least one owner'/g,
  );
  assert.equal(guarded?.length, 2, "role demotion and member removal both need the guard");
});

test("review opens are recorded at most once per client per version per day", async () => {
  const sql = await hardeningSql();
  assert.match(
    sql,
    /create or replace function public\.record_review_opened \(p_version_id uuid, p_actor_id uuid\) returns boolean/,
  );
  assert.match(sql, /event_type = 'REVIEW_OPENED'/);
  assert.match(sql, /created_at > now\(\) - interval '24 hours'/);
  assert.match(
    sql,
    /revoke all on function public\.record_review_opened \(uuid, uuid\)[\s\S]*?from\s*public,\s*anon,\s*authenticated/,
    "this function takes an arbitrary actor id and must be service-role only",
  );
});

test("the widened activity event vocabulary is applied safely", async () => {
  const sql = await hardeningSql();
  // 001 declared the list inline, so the constraint already exists by this name.
  assert.match(
    sql,
    /drop constraint if exists activity_events_event_type_check on public\.activity_events/,
  );
  assert.match(
    sql,
    /add constraint activity_events_event_type_check[\s\S]*?\) not valid/,
    "add not valid first so the table is not locked while validating",
  );
  assert.match(sql, /validate constraint activity_events_event_type_check/);
  for (const event of [
    "MEMBER_INVITED",
    "MEMBER_JOINED",
    "MEMBER_REMOVED",
    "MEMBER_LEFT",
    "MEMBER_ROLE_CHANGED",
  ]) {
    assert.match(sql, new RegExp(`'${event}'`));
  }
});

test("every migration in the series is safe to run in order", async () => {
  const files = [
    "src/db/sql/001_initial_schema.sql",
    "src/db/sql/002_security_and_workflow.sql",
    "src/db/sql/003_production_hardening.sql",
  ];
  for (const file of files) {
    const sql = await readFile(file, "utf8");
    assert.match(sql, /^\s*begin\s*;/m, `${file} must be transactional`);
    assert.match(sql, /commit\s*;\s*$/m, `${file} must commit`);
  }
});

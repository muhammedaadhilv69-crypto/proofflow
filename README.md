# ProofFlow

ProofFlow is a client approval workspace built around one invariant: the client approved this exact version.

## Stack

- Next.js App Router and TypeScript
- Supabase Auth, PostgreSQL, Storage, and Row-Level Security
- Tailwind CSS and shadcn-style UI primitives
- Zod validation and server-side authorization
- Sentry for error monitoring, Resend-compatible email abstraction

## Local setup

1. Use Node.js 20.9 or newer.
2. Copy `.env.example` to `.env.local` and set the Supabase URL, anon key, service-role key, and app URL.
3. Run the migrations in `src/db/sql/` in order in the Supabase SQL editor. `001` creates the schema, `002` adds RLS, triggers, and the workflow functions, and `003` adds rate-limit buckets, workspace invitations, and review-open deduplication. `003` is required: the app calls `consume_rate_limit` on every request, and rate limiting fails closed.
4. In Supabase Auth, add your app URL and `${NEXT_PUBLIC_APP_URL}/reset-password` to the redirect URL allowlist.
5. Install dependencies and start the app:

```bash
npm install
npm run dev
```

The service-role key is used only by server modules and must never be exposed to the browser. Public review requests are resolved by a hashed, expiring review token. Raw review tokens are returned only when a link is created and are not stored in the database.

## Routing

`src/lib/routes.ts` is the single source of truth for internal paths. The auth pages live in the `(auth)` route group, which is organisational only, so the real URLs are `/login`, `/signup`, `/forgot-password`, and `/reset-password` — there is no `/auth` prefix. `tests/routes.test.ts` walks the real `src/app` tree and fails if any `ROUTES` entry, `href`, `redirect()`, or `router.push()` target does not resolve to a page, so adding a route to the table without creating the page (or linking to a path that does not exist) breaks the build rather than shipping a dead link.

## Production configuration

`NEXT_PUBLIC_APP_URL` must be an absolute `https` URL in production. `requireAppUrl()` throws if it is missing, non-absolute, not https, or points at localhost, because every client-facing link is built from it. The non-throwing `getAppUrl()` is used only for `robots.txt` and `sitemap.xml`, which must not break the build.

Rate limiting lives in Postgres (`public.consume_rate_limit`) rather than process memory, so limits are shared across instances and survive cold starts. It fails closed: if the database is unreachable the request is rejected rather than passing through an absent guard.

## Team management

Workspace owners invite teammates from **Settings → Team**. Invitations are single use, expire after 7 days, are stored only as a SHA-256 hash, and can only ever grant the `MEMBER` role — an owner promotes a member from the same page. The SQL functions refuse to accept an invitation from a signed-in user whose account email does not match the address it was sent to, and refuse any change that would leave a workspace without an owner.

## Demo data

Demo data is never created automatically. Set the explicit seed variables in `.env.local` and run:

```bash
npm run seed
```

The seed creates an isolated demo workspace, uploads real SVG files to the private storage bucket, exercises comments and change requests, and records an approval for the final demo version. It is safe to stop using the seed command after testing. Set `SEED_DEMO_PRINT_REVIEW_LINK=true` only when you explicitly need the generated demo review URL printed to the terminal.

## Verification

```bash
npm run verify
```

This runs, in order: `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`. The suites cover route integrity, input validation and upload signature checks, app-URL and redirect safety, token generation, and the SQL contract for RLS coverage, immutability triggers, rate limiting, and invitation authorization.

The SQL workflow functions in `002_security_and_workflow.sql` are the source of truth for version numbering, review-token creation, client actions, and atomic approval. Authenticated data access is checked again in server code and protected by RLS in PostgreSQL. After changing any migration, run `npm run db:types` with the project linked so `src/lib/supabase/database.types.ts` stays in sync.

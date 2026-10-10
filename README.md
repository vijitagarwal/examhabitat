# ExamHabitat

A CAT preparation workspace built with Next.js 15, React 19, TypeScript, Tailwind and Supabase.

## Implemented

- Magic-link sign-in UI, PKCE callback, server-verified protected pages, cookie refresh, and local-session sign-out.
- A versioned **42-topic preparation taxonomy** covering VARC, DILR and QA; search, section/status filters and collapsible groups.
- Saved topic states, confidence, priority, manually logged study minutes and review dates.
- Dashboard metrics calculated from saved progress, with genuine new-account states.
- Saved study preferences and deterministic daily plans constrained by available time and task slots.
- Explanations for scheduled tasks, explicit start/complete/skip, and regeneration that retains finished and in-progress work.
- Recent plan history, persistence-first forms, retry receipts and stale-write protection.

The catalog is curated, **not an official or exhaustive CAT syllabus**. Progress is self-reported, not predicted CAT performance. Task completion confirms an estimated block; it does not infer mastery. Question banks, timed exams, automated scoring and other exam workflows are not implemented.

## Local setup

Use Node.js **22.12+ or 24** and npm. Node 24 is the verified environment.

```powershell
npm ci
Copy-Item .env.example .env.local
```

Set only these public values in `.env.local`, using an isolated development/local Supabase project:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Use the project's publishable/anonymous key, never a service-role/secret key. Never commit `.env.local`.

Apply migrations **in filename order** using a development Supabase SQL editor or your local SQL tooling:

1. `supabase/migrations/0001_foundation.sql`
2. `supabase/migrations/0002_cat_syllabus_progress_plans.sql`
3. `supabase/migrations/0003_atomic_cat_workspace.sql`

Apply all three before using the feature. They are ordered, one-time migrations. The catalog seed itself is ID-based and duplicate-safe. No script automatically applies these to any external service.

In Supabase Auth, configure email delivery and allow `http://localhost:3000/auth/callback` as a redirect URL. For local browser integration tests also allow `http://127.0.0.1:3100/auth/callback`. Open a magic link in the browser that requested it (PKCE).

```powershell
npm run dev
# http://localhost:3000
```

With missing/invalid config, protected pages show an explicit setup state. They do not show private demo data, write local storage as a substitute, or bypass authentication. Missing migrations and database failures show recovery states.

## Checks

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npm run start
```

`npm test` includes domain, component, mocked HTTP/server-boundary, and **embedded PostgreSQL** tests. `@electric-sql/pglite` runs the actual migrations in memory with local test roles and an `auth.uid()` stand-in. No credentials, Docker, external database or persistent test data is required. SQL/RLS tests do not prove hosted Supabase Auth, PostgREST configuration or multi-connection contention behavior.

Useful focused commands:

```powershell
npm test -- tests/database.test.ts
npm test -- tests/server-workspace.test.ts
npm test -- tests/workspace-ui.test.tsx
npm run test:http
```

`test:http` starts an isolated development server on port 3101, explicitly blanks Supabase configuration, verifies protected setup pages/cache headers and fixed callback recovery, then stops its own process. Do not run it simultaneously with another Next dev/build process in this workspace. It does not exercise client-side browser interactions.

### Optional Playwright tests

Chromium is a separate prerequisite. It was unavailable during this implementation, so browser journeys have **not** been executed. Install only when you want to run them; the following keeps browser files inside the workspace's ignored dependency directory:

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = "$PWD\node_modules\.cache\ms-playwright"
npx playwright install chromium
npm run test:e2e
```

The default browser run explicitly disables Supabase and checks setup, mobile navigation and expired-link recovery. It starts its own server on port 3100 rather than reusing an unknown process.

For the authenticated workflow, use a **fresh disposable account in local Supabase**, with migrations applied. Set these process environment variables locally (do not share or commit values):

- `CAT_E2E_AUTH=1`
- `NEXT_PUBLIC_SUPABASE_URL` — loopback URL only (localhost/127.0.0.1/::1)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — local project's public key
- `CAT_E2E_EMAIL`, `CAT_E2E_PASSWORD` — disposable local test account

Then run `npm run test:e2e`. The runner refuses a non-loopback Supabase URL. Test-only password login provisions the browser session; the app's sign-in remains magic-link only. The test changes the disposable student's progress/plans and verifies refresh and sign-out. Browser traces are disabled to avoid saving auth cookies. This suite has not been run against a live/local Supabase service here.

## Design and data integrity

See [CAT_WORKSPACE.md](docs/CAT_WORKSPACE.md) for the catalog/version policy, schema, RLS, transition rules, progress index, planner weights, timezone handling, regeneration and failure semantics.

Key modules:

- `lib/cat-syllabus.ts`, `lib/progress.ts`, `lib/planner.ts`, `lib/dates.ts`: deterministic domain logic.
- `lib/workspace.ts`: Zod-validated snapshot contract and derived summary.
- `lib/server/`: authenticated reads and mutation orchestration.
- `app/dashboard/actions.ts`: server-action entry points; never accepts ownership from the browser.
- `components/workspace/`: persisted dashboard, syllabus editor and study planner.
- `supabase/migrations/`: constraints, RLS, seeds and atomic RPCs.

The small handwritten `Database` type exposes only the two RPCs used by the application; it is not presented as generated table types. Runtime snapshots are validated and tested against the real migration output. The Supabase SSR/client versions are pinned as a compatible pair after the foundation's older SSR declarations failed typed persistence checks.

## Limits and next verification

No development Supabase credentials were supplied. Hosted email delivery, live cookie refresh, cloud persistence through PostgREST and real-browser accessibility/responsiveness remain unverified. The SQL persistence and RLS checks run in embedded PostgreSQL; the UI/server tests use isolated fixtures/transports.

Plans show the latest 14 planning days; older records remain stored. There is no realtime cross-tab subscription: stale submissions are rejected and the user can reload. Receipt retention is currently unlimited. Catalog evolution requires an explicit migration and progress-mapping review. The next integration gate is a disposable local Supabase + Chromium run before starting question practice.

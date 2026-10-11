# Local integration verification

This guide is for a disposable local environment only. Do not point the commands at a hosted or production Supabase project, and do not commit any credentials.

## Prerequisites

- Node.js 22.12+ or 24.
- npm dependencies installed with `npm ci`.
- Docker Desktop running.
- Supabase CLI compatible with the installed local stack.
- Chromium installed through the repository's Playwright version.

The current repository test harness does not include a Supabase CLI configuration file. Use a disposable local Supabase project or local stack and apply the SQL migrations in filename order:

```text
supabase/migrations/0001_foundation.sql
supabase/migrations/0002_cat_syllabus_progress_plans.sql
supabase/migrations/0003_atomic_cat_workspace.sql
supabase/migrations/0004_cat_practice_engine.sql
supabase/migrations/0005_original_cat_practice.sql
supabase/migrations/0006_practice_aware_planning.sql
supabase/migrations/0007_practice_performance_intelligence.sql
```

The migration sequence has been executed in the repository's PGlite harness. A real local Supabase run additionally verifies Supabase Auth, PostgREST permissions, schema cache behavior, and the actual network/session boundary.

## Browser installation

Keep Playwright browsers inside the ignored project dependency directory:

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = "$PWD\node_modules\.cache\ms-playwright"
npx playwright install chromium
```

The setup-only browser suite can then run without Supabase credentials:

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = "$PWD\node_modules\.cache\ms-playwright"
npm run test:e2e
```

Without `CAT_E2E_AUTH=1`, the suite verifies four protected setup routes, mobile navigation, and expired-link recovery. The authenticated test is skipped intentionally.

## Disposable authenticated workflow

1. Start the local Supabase stack with Docker and confirm its URL is loopback-only.
2. Apply all seven migrations to the clean local database.
3. Create two disposable Auth users, A and B, in the local Auth UI or supported local admin tooling. Do not use real email addresses or production accounts.
4. Set the local public URL/key and user A credentials in the current PowerShell process:

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = "$PWD\node_modules\.cache\ms-playwright"
$env:CAT_E2E_AUTH = "1"
$env:NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321"
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = "<local-public-anon-key>"
$env:CAT_E2E_EMAIL = "<disposable-user-a-email>"
$env:CAT_E2E_PASSWORD = "<disposable-user-a-password>"
```

5. Run:

```powershell
npm run test:e2e
```

The authenticated browser journey uses password login only to provision a local test session; the product UI remains magic-link based. It exercises syllabus/progress persistence, planner completion, question answering and reload recovery, server-generated results, mistake retry, performance visibility, timed deadline preservation across reload, final submission, and sign-out. Use a fresh disposable user when the test requires empty initial topic state.

The current test suite does not provision or clean up Supabase users automatically. Remove only the disposable records created by the test from the disposable local project after verification. Never run the authenticated suite with a non-loopback URL; the Playwright configuration rejects it.

## Verification commands

```powershell
npm run typecheck
npm run lint
npm test
npm run test:http
npm run build
$env:PLAYWRIGHT_BROWSERS_PATH = "$PWD\node_modules\.cache\ms-playwright"
npm run test:e2e
```

`npm test` runs the actual seven migrations in PGlite with local test roles and covers SQL, RLS, practice persistence, scoring, analytics aggregation, and server/UI boundaries. It does not prove hosted Supabase behavior. `test:http` runs with deliberately blank Supabase configuration and does not exercise authenticated persistence.

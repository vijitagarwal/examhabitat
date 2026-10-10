# ExamHabitat

ExamHabitat is a focused preparation workspace for competitive exams. The first release is a CAT preparation vertical slice with an exam-aware syllabus, practice sessions, review, and evidence-based recommendations. Other examinations remain disabled until their rules and content are validated.

## Local setup

Requirements:

- Node.js 20 or newer
- npm 10 or newer
- A Supabase project for authenticated persistence, or a local Supabase instance

```bash
npm install
copy .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` before using authentication or persisted application routes. The app intentionally fails with a setup message rather than silently switching to fake persistence.

## Checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

The browser suite is available with `npm run test:e2e` after configuring a test Supabase environment.

## Database

SQL migrations live in `supabase/migrations`. Apply them to a development Supabase project before testing authenticated workflows. Production services are never modified by this repository automatically.

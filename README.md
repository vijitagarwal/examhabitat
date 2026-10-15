# ExamHabitat

ExamHabitat is a premium exam-preparation platform for students preparing for CAT, NEET, JEE, UPSC, GATE, and CLAT. The product is built around a single exam-specific dashboard that adapts to the user’s chosen target exam, tracks topic progress, mock scores, error logs, and strategic milestones.

## Product goals

- Personalize the platform by target exam, not by a generic student dashboard
- Surface a premium exam mission system with countdowns, strategy guidance, and analytics
- Keep the app fast, deployable, and production-ready for Vercel + Supabase
- Give users a clear path from onboarding to daily revision execution

## Stack

- TanStack Start + Vite
- React 19 + TypeScript
- Tailwind CSS v4
- Supabase Auth + Postgres
- Framer Motion + Recharts
- shadcn/ui primitives

## Local setup

```bash
npm install
cp .env.example .env
npm run dev
```

Add your Supabase values in `.env`:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

## Production build

```bash
npm run build
```

## Deployment

This project is designed for Vercel with the Nitro preset. Recommended configuration:

```bash
NITRO_PRESET=vercel
```

and ensure the Supabase environment variables are configured in the deployment environment.

## Project structure

```bash
src/
  components/exam-dashboard/
  hooks/
  integrations/supabase/
  lib/exams/
  routes/
  styles.css
supabase/migrations/
```

## Notes

- The app intentionally keeps exam logic in `src/lib/exams` so the dashboard is driven by data, not hardcoded assumptions.
- The `target_exam` field in the user profile controls the active exam identity and dashboard theming.
- The app should be deployed only with a proper Supabase project and row-level security policies applied.

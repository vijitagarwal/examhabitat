# CAT practice engine

## Content and scope

`0004_cat_practice_engine.sql` adds the persistence boundary; `0005_original_cat_practice.sql` seeds 32 original questions: 8 VARC, 8 DILR and 16 QA. Four VARC questions share one original reading passage. Eight DILR questions share a lending table and a four-talk scheduling case. Content is **original practice**, not official CAT material. MCQ and exact decimal numeric/TITA answers are supported; multi-select is not.

Questions reference existing syllabus topics. Shared stimuli use text and semantic table data, never HTML. A content trigger validates section/topic consistency, set type, four unique MCQ options and numeric keys. IDs remain stable; future content revisions increment the version. Each attempt freezes question text, shared material, keys, explanations and policy, so future edits cannot change its result.

## Ownership and lifecycle

Apply migrations `0001` through `0007` in filename order to an isolated development Supabase project. No application script applies migrations remotely. Migration `0006` keeps the existing planning RPC atomic while allowing the practice-aware planner algorithm version. Migration `0007` adds the aggregate performance projection; see [CAT_PERFORMANCE.md](CAT_PERFORMANCE.md).

- `practice_sets` and `practice_questions`: trusted, read-only authored bank; no direct student access to key-bearing rows.
- `practice_attempts`: owner, request identity, configuration, mode, server start/deadline, revision and immutable finalized result.
- `practice_attempt_items`: ordered question snapshots and keys. Direct SELECT is denied to students.
- `practice_answers`: one answer per scoped attempt/question, with composite ownership foreign keys.
- `practice_receipts`: exact command payload for safe retries.
- `practice_bookmarks`: one per user/question; independent of attempts.
- `practice_reviews`: one per attempt/question for incorrect, skipped and unanswered questions. Marking reviewed or retrying never rewrites the historical answer.

All tables have RLS. User tables expose owner-scoped reads where safe. Direct student writes are revoked. Authenticated, empty-search-path security-definer RPCs enforce explicit ownership and validate every write. Internal helpers have no student EXECUTE grant. No service-role credential is needed. Bank and active-attempt projections never contain keys, explanations or correctness flags. Submitted results disclose only that owner's frozen answers and solutions.

## Scoring and timing

Both modes give feedback only after submission. `practice-v1` is a sample policy: +3 correct, -1 incorrect MCQ, 0 incorrect numeric, 0 unanswered/skipped. Setup can select a no-negative variant. Policy is frozen on creation, not accepted from the client during submission. Accuracy is correct / (correct + incorrect); no attempted answers means unassessed (`null`). Skips are a subset of unanswered. Section scores use the same policy. PostgreSQL calculates final results; a deterministic TypeScript scorer independently checks agreement in tests.

Numeric inputs accept signed decimal notation, at most 12 integer and 6 fractional digits. Surrounding spaces, leading zeroes and trailing decimal zeroes do not change numeric value. Fractions, scientific notation, commas, `.5`, `1.` and implicit rounding are rejected. Use `0.5`, for example. MCQs store option IDs A–D.

Practice has no deadline. Timed sessions last 1–120 minutes with an immutable server deadline. Every read/save/submit locks the attempt before checking `clock_timestamp()`. At or after the deadline, it finalizes as expired using previously saved answers; late drafts are discarded. Submission can atomically save its last draft and finalize while eligible. Repeated submissions return the one existing result. Stale draft revisions fail without overwriting newer answers. Expiry is lazy (on next access), not a background job; it always uses the original deadline. Total elapsed time is server wall-clock time, capped at the deadline for expiry, not measured active study or per-question time.

## Verification boundary

`tests/practice-database.test.ts` executes all actual migrations in PGlite with isolated roles and an `auth.uid()` stand-in. It covers key protection, ownership, snapshots, answer changes, stale writes, duplicate requests, expiration, atomic submission, reviews and score parity. It does not prove hosted Supabase/PostgREST, email delivery or multi-connection contention. No production database or credentials are used.

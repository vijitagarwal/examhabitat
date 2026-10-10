# CAT workspace: engineering model

## Scope and catalog

This release implements CAT syllabus tracking and study planning. `cat-2026-v1` / `2026.1` is a **curated preparation taxonomy**, not an official or exhaustive CAT syllabus. It has 42 topics in VARC, DILR and QA, grouped into nine subject areas. Time estimates describe a focused block, not time to mastery. Other exams and question practice are not enabled.

`lib/cat-syllabus.ts` is the versioned seed specification used by domain tests. `0002` contains the deterministic SQL seed; runtime catalog access comes from the database. Catalog IDs, hierarchy, planning metadata and prerequisite integrity are checked against the migration in tests. Re-running the seed upserts by stable IDs.

The application deliberately pins this catalog version. A future version needs an explicit migration and compatibility review: retain old topics referenced by progress/plans (`ON DELETE RESTRICT`), preserve IDs for unchanged concepts, use new IDs for different concepts, and provide an explicit progress mapping before switching catalogs. No automatic progress reset or version switch is implemented. Historical records are never deleted merely because taxonomy content changes.

## Relationships and ownership

- Catalog → sections → groups → topics is shared read-only data.
- `topic_progress`: unique `(user_id, topic_id)`, state, confidence/priority 1–5, accumulated manual minutes, timestamp and review date.
- `study_preferences`: one row/user; 15–360 daily minutes, 1–12 tasks, IANA timezone, optional personal target date.
- `study_plans`: one row/user/local planning date. Holds catalog/algorithm versions, budget and generation time.
- `study_plan_tasks`: unique `(plan_id, topic_id)` and `(plan_id, position)`. Composite parent/owner foreign key prevents cross-owner attachment.
- `cat_workspace_versions`: concurrency revision per user.
- `cat_mutation_receipts`: request UUID + payload hash, scoped to user. Retained for retry safety; no automatic receipt expiry yet.

Apply `0001`, `0002`, then `0003` in filename order, in a **development** Supabase database. `0001` remains unchanged. `0003` replaces the initial mutation helpers with the final atomic RPC boundary and revokes direct student writes. Apply the whole migration set before using the UI.

All user-owned tables have RLS. Students can SELECT only their rows; authenticated students can read the shared catalog. Mutations use `mutate_cat_workspace`, a narrowly granted `SECURITY DEFINER` function with empty search path, `auth.uid()` ownership, explicit input validation and one transaction. No service-role credential is used by the application. All other application-table DML grants are revoked from student roles. The function accepts no owner ID.

## State and time

Learning states: not started → learning → practising → mastered, with needs-revision available from learning/practising/mastered. Mastered may return to practising or revision. A save cannot jump straight from untouched to mastery. Invalid status values and transitions are also rejected by PostgreSQL.

Study time is explicitly logged, at most 240 minutes per save. Changing priority alone does not claim study activity or postpone review. Starting a new state or logging time schedules a review: learning 2/4 days, practising 3/7, revision 2, mastered 7/14, based on low (≤2) vs higher confidence. These intervals are product heuristics, not learning-science guarantees.

Task states: planned → in progress/completed/skipped; in progress → completed/skipped. Finished tasks are immutable. Completing a task records a **self-confirmed planned block**, not measured time, mastery or confidence. Manual topic minutes and confirmed block minutes are shown separately to avoid double-counting.

Review/planning days are PostgreSQL `date` values calculated in saved timezone. Study/completion instants are `timestamptz`. The personal target date is an informational goal, not an official CAT date or a schedule input.

## Deterministic planner

`lib/planner.ts` takes catalog, progress, preferences, reference day and existing tasks. No random values, current-clock calls, LLMs or external planning services are used.

- Due review gets enough weight to precede untouched topics, even when previously mastered.
- Untouched foundations, low confidence, user priority and default topic priority determine remaining order; stable IDs break ties.
- Prerequisite chains are recursively ordered before dependents. Practising or mastered prerequisites need no extra foundation block.
- A complete chain must fit remaining minutes **and** task slots. Oversized candidates are skipped with an explanation; other fitting topics are considered.
- Non-due mastered topics are omitted.
- Completed and in-progress tasks reserve capacity; skipped tasks reserve their topic but not time. Generation replaces only unstarted tasks in the same daily plan. Finished work is retained and cannot be scheduled twice that day.
- Lowering limits below already committed work rejects regeneration. Saving preferences alone does not rewrite an existing plan.

The progress index is a transparent heuristic, not predicted CAT performance: not started 0%, learning 30%, practising 60%, revision 45%, mastery 84–100% according to confidence. Section/overall values are averages. Confidence averages exclude unstarted topics; an empty account is unassessed.

## Failure and concurrency contract

The browser submits a request UUID and expected workspace revision, never an owner ID. Server actions authenticate and validate before making user-scoped RPC calls. PostgreSQL serializes mutations per user with a transaction-scoped advisory lock. Stale revisions reject the whole transaction. A duplicate request with the same payload returns the current saved snapshot without adding time or duplicating tasks; a changed payload under that UUID is rejected.

Plan calculation uses a single consistent snapshot, then a revision-checked atomic save. Completion racing generation therefore invalidates the stale plan. A failure after an insert rolls back preferences, tasks and plan changes together. The UI is persistence-first, retains editable input on failure, and updates only from a validated saved snapshot. A lost response can be retried or checked by reloading. A plan retry may require reload after its original save advanced the revision; it never erases completed work or silently creates a duplicate plan.

`read_cat_workspace` returns a single statement snapshot of catalog, preferences, progress and the latest 14 planning days. Older records stay stored. Pages are dynamic/private, with no shared personalized-data cache.

## Verification boundaries

`tests/database.test.ts` runs the actual migrations in PGlite (embedded PostgreSQL) with local `anon`/`authenticated` roles and a test implementation of `auth.uid()`. It tests SQL, grants, RLS and transactional behavior. This does **not** validate hosted Supabase configuration, email delivery, PostgREST schema caching, or multiple real network connections. Domain/component/server-boundary tests are separate. See README for commands and current integration prerequisites.

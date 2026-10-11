# CAT performance intelligence

## Data source and window

Migration `0007_practice_performance_intelligence.sql` adds the authenticated `read_practice_analytics` RPC. It reads only the current user's attempts and answer rows. The default dashboard window is the last **90 days**; the RPC accepts 7–3650 days. Every metric in the dashboard is calculated from this window. Attempts with status `active` are excluded from performance, score, timing, topic and section aggregates. They remain in the started-attempt count so completion rate is transparent:

`completion rate = finalized attempts / all started attempts`

Finalized means `submitted` or `expired`. An expired timed attempt contributes the answers saved before its server deadline.

The query uses `practice_attempt_items.question` snapshots, not a fresh join to mutable question content. Historical topic IDs and labels therefore remain attributable even if a future catalog changes. Current catalog topics with no evidence are added by the server layer as explicit zero-data rows.

## Metric definitions

- `totalQuestions`: all questions in finalized attempts, including unanswered.
- `answeredQuestions`: correct + incorrect answers only.
- `unanswered`: blank or skipped questions; skipped is a subset.
- `accuracy`: `correct / answeredQuestions`, expressed as a percentage. It is `null` when no question was answered.
- `attempts`: distinct finalized attempts containing the metric's section/topic.
- Topic `incorrectAttempts`: distinct finalized attempts containing at least one incorrect answer for the topic.
- Topic `recentAccuracy`: correct / answered across the last three finalized attempts containing that topic.
- `lastPractisedAt`: most recent finalized timestamp with a correct or incorrect answer for the topic.
- `averageSecondsPerQuestion`: total server-recorded elapsed attempt seconds divided by total finalized questions with timing. It is an estimate of whole-attempt time allocation, not a per-question focus timer.
- Score history is marked comparable to the latest attempt only when the frozen scoring policy and section/question-type composition both match. Accuracy remains the safer comparison when they differ.

No percentile, CAT readiness score, or performance prediction is produced.

## Evidence labels and recommendations

- **No evidence:** zero answered questions in the window.
- **Limited evidence:** 1–4 answered questions.
- **Supported evidence:** at least 5 answered questions.

`performance-v1` recommendations use explicit thresholds:

1. A topic with at least three answered questions and accuracy at or below 50% becomes a practice recommendation.
2. A topic with at least three answered questions and no practice for at least 14 days becomes a revisit recommendation unless it already has a weak-topic recommendation.
3. A section with fewer than five answered questions can receive an insufficient-evidence recommendation.
4. Unanswered/skipped questions can produce a mistake-review recommendation.
5. An empty account receives a setup recommendation rather than a diagnosis.

Recommendations include the calculated reason and link to practice, mistakes, syllabus, or the existing study planner. They never change manual topic status or mastery. The existing planner consumes a separate bounded practice signal after at least three answered questions with at least 50% incorrect answers; it respects the existing daily budget and does not create duplicate active tasks.

## Security and verification boundary

The analytics RPC is `SECURITY DEFINER`, uses an empty search path, requires `auth.uid()`, and is granted only to `authenticated`. It returns aggregate projections and frozen historical metadata; it does not expose answer keys, explanations, active attempt snapshots, or another user's history. Personalized analytics routes are dynamic and private.

PGlite tests execute migrations `0001` through `0007` and verify empty-account behavior, finalized-only aggregation, topic attribution, score comparability, idempotent submission behavior, and cross-user isolation. This does not prove hosted Supabase/PostgREST behavior or real browser execution.

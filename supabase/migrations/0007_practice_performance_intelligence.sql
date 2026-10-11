-- Performance intelligence is a read-only, owner-scoped projection over finalized attempts.
-- It uses frozen attempt snapshots so later catalog edits cannot rewrite historical topic attribution.
create function public.read_practice_analytics(p_days integer default 90) returns jsonb language plpgsql security definer set search_path='' as $$
declare window_days integer := coalesce(p_days, 90);
begin
  if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
  if window_days not between 7 and 3650 then raise exception 'Invalid analytics window' using errcode='22023'; end if;
  return (
    with started as (
      select a.* from public.practice_attempts a
      where a.user_id = auth.uid() and a.started_at >= clock_timestamp() - make_interval(days => window_days)
    ), finalized as (
      select * from started where status in ('submitted', 'expired')
    ), items as (
      select a.id attempt_id, a.mode, a.status, a.started_at, a.finished_at,
        i.question_id, i.question->>'section' section, i.question->>'topicId' topic_id,
        coalesce(nullif(i.question->>'topicTitle',''), i.question->>'topicId') topic_title,
        i.question->>'type' question_type,
        public.practice_outcome(i.question->>'type', i.answer_key, ans.answer, coalesce(ans.skipped, false)) outcome
      from finalized a
      join public.practice_attempt_items i on i.attempt_id = a.id and i.user_id = auth.uid()
      left join public.practice_answers ans on ans.attempt_id = i.attempt_id and ans.question_id = i.question_id and ans.user_id = auth.uid()
    ), overall_counts as (
      select count(distinct attempt_id)::integer attempts, count(*)::integer total_questions,
        count(*) filter (where outcome in ('correct','incorrect'))::integer answered_questions,
        count(*) filter (where outcome = 'correct')::integer correct,
        count(*) filter (where outcome = 'incorrect')::integer incorrect,
        count(*) filter (where outcome in ('unanswered','skipped'))::integer unanswered,
        count(*) filter (where outcome = 'skipped')::integer skipped
      from items
    ), section_counts as (
      select section, count(distinct attempt_id)::integer attempts, count(*)::integer total_questions,
        count(*) filter (where outcome in ('correct','incorrect'))::integer answered_questions,
        count(*) filter (where outcome = 'correct')::integer correct,
        count(*) filter (where outcome = 'incorrect')::integer incorrect,
        count(*) filter (where outcome in ('unanswered','skipped'))::integer unanswered,
        count(*) filter (where outcome = 'skipped')::integer skipped
      from items group by section
    ), topic_counts as (
      select topic_id, max(topic_title) topic_title, max(section) section,
        count(distinct attempt_id)::integer attempts, count(*)::integer total_questions,
        count(*) filter (where outcome in ('correct','incorrect'))::integer answered_questions,
        count(*) filter (where outcome = 'correct')::integer correct,
        count(*) filter (where outcome = 'incorrect')::integer incorrect,
        count(*) filter (where outcome in ('unanswered','skipped'))::integer unanswered,
        count(*) filter (where outcome = 'skipped')::integer skipped,
        max(finished_at) filter (where outcome in ('correct','incorrect')) last_practised_at,
        count(distinct attempt_id) filter (where outcome = 'incorrect')::integer incorrect_attempts
      from items group by topic_id
    ), topic_attempts as (
      select topic_id, attempt_id, finished_at,
        row_number() over (partition by topic_id order by finished_at desc, attempt_id desc) recent_rank
      from (select distinct topic_id, attempt_id, finished_at from items) distinct_attempts
    ), recent_topic_counts as (
      select i.topic_id,
        count(*) filter (where i.outcome in ('correct','incorrect'))::integer recent_answered_questions,
        count(*) filter (where i.outcome = 'correct')::integer recent_correct
      from items i join topic_attempts ta on ta.topic_id = i.topic_id and ta.attempt_id = i.attempt_id
      where ta.recent_rank <= 3 group by i.topic_id
    ), item_counts as (
      select attempt_id, count(*)::integer total_questions,
        count(*) filter (where outcome in ('correct','incorrect'))::integer answered_questions
      from items group by attempt_id
    ), composition_parts as (
      select attempt_id, section, question_type, count(*)::integer item_count
      from items group by attempt_id, section, question_type
    ), compositions as (
      select attempt_id, string_agg(section || ':' || question_type || ':' || item_count::text, '|' order by section, question_type) composition_key
      from composition_parts group by attempt_id
    ), score_rows as (
      select a.id, a.mode, a.status, a.started_at, a.finished_at,
        (a.result->>'score')::numeric score, (a.result->>'maxScore')::numeric max_score,
        nullif(a.result->>'accuracy','')::numeric accuracy,
        nullif(a.result->>'elapsedSeconds','')::numeric elapsed_seconds,
        ic.total_questions, ic.answered_questions,
        concat_ws(':', a.policy->>'version', a.policy->>'correct', a.policy->>'mcqPenalty', a.policy->>'numericPenalty') policy_key,
        coalesce(c.composition_key, '') composition_key,
        row_number() over (order by a.finished_at desc, a.id desc) recent_rank
      from finalized a join item_counts ic on ic.attempt_id = a.id left join compositions c on c.attempt_id = a.id
      where a.result is not null
    ), latest_score as (
      select policy_key, composition_key from score_rows order by finished_at desc, id desc limit 1
    ), timing_counts as (
      select count(*)::integer attempts_with_timing, coalesce(sum(elapsed_seconds),0)::numeric total_elapsed_seconds,
        avg(elapsed_seconds)::numeric average_elapsed_seconds,
        case when sum(total_questions) = 0 then null else (sum(elapsed_seconds) / sum(total_questions))::numeric end average_seconds_per_question
      from score_rows where elapsed_seconds is not null
    ), metric_json as (
      select jsonb_build_object('attempts', attempts, 'totalQuestions', total_questions, 'answeredQuestions', answered_questions,
        'correct', correct, 'incorrect', incorrect, 'unanswered', unanswered, 'skipped', skipped,
        'accuracy', case when answered_questions = 0 then null else round(100.0 * correct / answered_questions, 2) end) value
      from overall_counts
    ), section_json as (
      select coalesce(jsonb_agg(jsonb_build_object('section', section, 'attempts', attempts, 'totalQuestions', total_questions,
        'answeredQuestions', answered_questions, 'correct', correct, 'incorrect', incorrect, 'unanswered', unanswered, 'skipped', skipped,
        'accuracy', case when answered_questions = 0 then null else round(100.0 * correct / answered_questions, 2) end) order by section), '[]'::jsonb) value
      from section_counts
    ), topic_json as (
      select coalesce(jsonb_agg(jsonb_build_object('topicId', tc.topic_id, 'topicTitle', tc.topic_title, 'section', tc.section,
        'attempts', tc.attempts, 'totalQuestions', tc.total_questions, 'answeredQuestions', tc.answered_questions,
        'correct', tc.correct, 'incorrect', tc.incorrect, 'unanswered', tc.unanswered, 'skipped', tc.skipped,
        'accuracy', case when tc.answered_questions = 0 then null else round(100.0 * tc.correct / tc.answered_questions, 2) end,
        'lastPractisedAt', tc.last_practised_at, 'incorrectAttempts', tc.incorrect_attempts,
        'recentAnsweredQuestions', coalesce(rtc.recent_answered_questions,0), 'recentCorrect', coalesce(rtc.recent_correct,0),
        'recentAccuracy', case when coalesce(rtc.recent_answered_questions,0) = 0 then null else round(100.0 * rtc.recent_correct / rtc.recent_answered_questions, 2) end)
        order by tc.section, tc.topic_id), '[]'::jsonb) value
      from topic_counts tc left join recent_topic_counts rtc on rtc.topic_id = tc.topic_id
    ), score_json as (
      select coalesce(jsonb_agg(jsonb_build_object('id', sr.id, 'mode', sr.mode, 'status', sr.status, 'startedAt', sr.started_at,
        'finishedAt', sr.finished_at, 'score', sr.score, 'maxScore', sr.max_score, 'accuracy', sr.accuracy,
        'totalQuestions', sr.total_questions, 'answeredQuestions', sr.answered_questions, 'elapsedSeconds', sr.elapsed_seconds,
        'policyKey', sr.policy_key, 'compositionKey', sr.composition_key,
        'comparableToLatest', (sr.policy_key = ls.policy_key and sr.composition_key = ls.composition_key)) order by sr.finished_at), '[]'::jsonb) value
      from score_rows sr cross join latest_score ls
    ), recent_score_json as (
      select coalesce(jsonb_agg(jsonb_build_object('id', sr.id, 'mode', sr.mode, 'status', sr.status, 'startedAt', sr.started_at,
        'finishedAt', sr.finished_at, 'score', sr.score, 'maxScore', sr.max_score, 'accuracy', sr.accuracy,
        'totalQuestions', sr.total_questions, 'answeredQuestions', sr.answered_questions, 'elapsedSeconds', sr.elapsed_seconds,
        'policyKey', sr.policy_key, 'compositionKey', sr.composition_key,
        'comparableToLatest', (sr.policy_key = ls.policy_key and sr.composition_key = ls.composition_key)) order by sr.finished_at), '[]'::jsonb) value
      from score_rows sr cross join latest_score ls where sr.recent_rank <= 10
    )
    select jsonb_build_object(
      'windowDays', window_days, 'windowStartedAt', clock_timestamp() - make_interval(days => window_days),
      'startedAttempts', (select count(*)::integer from started), 'finalizedAttempts', (select count(*)::integer from finalized),
      'activeAttempts', (select count(*)::integer from started where status = 'active'),
      'completionRate', case when (select count(*) from started) = 0 then null else round(100.0 * (select count(*) from finalized) / (select count(*) from started), 2) end,
      'overall', (select value from metric_json), 'sections', (select value from section_json), 'topics', (select value from topic_json),
      'scoreHistory', coalesce((select value from score_json), '[]'::jsonb), 'recentTrend', coalesce((select value from recent_score_json), '[]'::jsonb),
      'timing', (select jsonb_build_object('attemptsWithTiming', attempts_with_timing, 'totalElapsedSeconds', total_elapsed_seconds,
        'averageElapsedSeconds', average_elapsed_seconds, 'averageSecondsPerQuestion', average_seconds_per_question) from timing_counts)
    )
  );
end $$;
revoke all on function public.read_practice_analytics(integer) from public, anon, authenticated;
grant execute on function public.read_practice_analytics(integer) to authenticated;

-- Apply after 0002. All application writes go through one authenticated transaction.
-- A per-user lock serializes saves; revisions reject stale drafts, receipts make retries safe.
drop function public.update_topic_progress(text, text, integer, integer, integer, date);
drop function public.generate_study_plan(date, text, text, integer, integer, integer, text, date, jsonb);
drop function public.update_study_task_status(uuid, text);

create table public.cat_workspace_versions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision integer not null default 0 check (revision >= 0)
);
create table public.cat_mutation_receipts (
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  payload_hash text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, request_id)
);
alter table public.cat_workspace_versions enable row level security;
alter table public.cat_mutation_receipts enable row level security;
create policy "read own workspace version" on public.cat_workspace_versions for select to authenticated using (user_id = auth.uid());
create policy "read own receipts" on public.cat_mutation_receipts for select to authenticated using (user_id = auth.uid());

-- Regeneration updates the same daily plan instead of hiding completed work in archives.
drop index public.study_plans_one_active_per_day_idx;
alter table public.study_plans add constraint study_plans_unique_day unique (user_id, plan_date);
alter table public.study_plans add column daily_budget integer not null default 60 check (daily_budget between 15 and 360);
alter table public.study_plans add column task_limit integer not null default 3 check (task_limit between 1 and 12);
alter table public.study_plan_tasks add constraint study_task_timestamps check (
  (status = 'completed') = (completed_at is not null) and (status = 'skipped') = (skipped_at is not null)
);
alter table public.study_plans add constraint study_plans_id_owner unique (id, user_id);
alter table public.study_plan_tasks add constraint study_tasks_parent_owner foreign key (plan_id, user_id) references public.study_plans(id, user_id);

create or replace function public.enforce_study_task_owner() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.user_id is distinct from auth.uid() then raise exception 'Task owner mismatch' using errcode = '42501'; end if;
  if tg_op = 'UPDATE' then
    if new.user_id <> old.user_id or new.plan_id <> old.plan_id or new.topic_id <> old.topic_id then
      raise exception 'Task identity cannot change' using errcode = '22023';
    end if;
    if old.status in ('completed', 'skipped') and new is distinct from old then
      raise exception 'Finished task is immutable' using errcode = '22023';
    end if;
    if old.status = 'in_progress' and new.status = 'planned' then raise exception 'Invalid transition' using errcode = '22023'; end if;
  elsif new.status <> 'planned' then raise exception 'Task must start planned' using errcode = '22023';
  end if;
  return new;
end;
$$;

create function public.validate_study_timezone() returns trigger language plpgsql set search_path = '' as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    raise exception 'Unknown time zone' using errcode = '22023';
  end if;
  return new;
end;
$$;
create trigger study_timezone before insert or update on public.study_preferences for each row execute function public.validate_study_timezone();

-- Student roles cannot alter shared catalog data or bypass the atomic write boundary.
revoke all on public.syllabus_catalogs, public.syllabus_sections, public.syllabus_topic_groups, public.syllabus_topics,
  public.topic_progress, public.study_preferences, public.study_plans, public.study_plan_tasks,
  public.cat_workspace_versions, public.cat_mutation_receipts from anon, authenticated;
grant select on public.syllabus_catalogs, public.syllabus_sections, public.syllabus_topic_groups, public.syllabus_topics,
  public.topic_progress, public.study_preferences, public.study_plans, public.study_plan_tasks,
  public.cat_workspace_versions, public.cat_mutation_receipts to authenticated;

create function public.read_cat_workspace() returns jsonb language sql stable security invoker set search_path = '' as $$
with preferences as (
  select coalesce(p.daily_minutes, 60) daily_minutes, coalesce(p.max_tasks, 3) max_tasks,
    coalesce(p.timezone, 'Asia/Kolkata') timezone, p.target_date
  from (select auth.uid() id) u left join public.study_preferences p on p.user_id = u.id
), plans as (
  select p.*, coalesce((select jsonb_agg(jsonb_build_object(
    'id', t.id, 'topicId', t.topic_id, 'position', t.position, 'plannedMinutes', t.planned_minutes,
    'reason', t.reason, 'status', t.status, 'completedAt', t.completed_at, 'skippedAt', t.skipped_at
  ) order by t.position) from public.study_plan_tasks t where t.plan_id = p.id and t.user_id = auth.uid()), '[]') tasks
  from public.study_plans p where p.user_id = auth.uid()
  order by p.plan_date desc limit 14
)
select case when auth.uid() is null then null else jsonb_build_object(
  'revision', coalesce((select revision from public.cat_workspace_versions where user_id = auth.uid()), 0),
  'today', (now() at time zone pref.timezone)::date,
  'preferences', jsonb_build_object('dailyMinutes', pref.daily_minutes, 'maxTasks', pref.max_tasks, 'timezone', pref.timezone, 'targetDate', pref.target_date),
  'catalog', (select jsonb_build_object(
    'id', c.id, 'examCode', c.exam_code, 'version', c.version, 'label', c.label, 'disclaimer', c.disclaimer,
    'sections', (select jsonb_agg(jsonb_build_object('id', s.id, 'code', s.code, 'name', s.name, 'description', s.description, 'sortOrder', s.sort_order) order by s.sort_order) from public.syllabus_sections s where s.catalog_id = c.id),
    'groups', (select jsonb_agg(jsonb_build_object('id', g.id, 'sectionId', g.section_id, 'name', g.name, 'description', g.description, 'sortOrder', g.sort_order) order by g.sort_order, g.id) from public.syllabus_topic_groups g join public.syllabus_sections s on s.id = g.section_id where s.catalog_id = c.id),
    'topics', (select jsonb_agg(jsonb_build_object('id', t.id, 'catalogId', t.catalog_id, 'sectionId', t.section_id, 'groupId', t.group_id, 'slug', t.slug, 'title', t.title, 'description', t.description, 'estimatedMinutes', t.estimated_minutes, 'defaultPriority', t.default_priority, 'difficulty', t.difficulty, 'sortOrder', t.sort_order, 'prerequisiteIds', t.prerequisite_ids) order by t.section_id, t.sort_order, t.id) from public.syllabus_topics t where t.catalog_id = c.id)
  ) from public.syllabus_catalogs c where c.id = 'cat-2026-v1' and c.is_current),
  'progress', coalesce((select jsonb_agg(jsonb_build_object('topicId', p.topic_id, 'status', p.status, 'confidence', p.confidence, 'priority', p.priority, 'accumulatedMinutes', p.accumulated_minutes, 'lastStudiedAt', p.last_studied_at, 'reviewDueOn', p.review_due_on, 'updatedAt', p.updated_at) order by p.topic_id) from public.topic_progress p where p.user_id = auth.uid()), '[]'),
  'plans', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'planDate', p.plan_date, 'algorithmVersion', p.algorithm_version, 'status', p.status, 'totalMinutes', p.total_minutes, 'dailyBudget', p.daily_budget, 'taskLimit', p.task_limit, 'generatedAt', p.generated_at, 'tasks', p.tasks) order by p.plan_date desc) from plans p), '[]')
) end from preferences pref;
$$;
revoke all on function public.read_cat_workspace() from public, anon;
grant execute on function public.read_cat_workspace() to authenticated;

create function public.mutate_cat_workspace(p_request_id uuid, p_expected_revision integer, p_operation text, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  owner_id uuid := auth.uid();
  current_revision integer;
  receipt_hash text;
  input_hash text := md5(p_operation || p_payload::text);
  pref public.study_preferences;
  progress public.topic_progress;
  task public.study_plan_tasks;
  v_plan_id uuid;
  today date;
  new_status text;
  minutes integer;
  v_confidence integer;
  v_priority integer;
  task_data record;
  total integer;
  task_count integer;
begin
  if owner_id is null then raise exception 'Sign in required' using errcode = '42501'; end if;
  if p_request_id is null or p_expected_revision is null or p_expected_revision < 0 or p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'Invalid mutation envelope' using errcode = '22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(owner_id::text, 0));
  select payload_hash into receipt_hash from public.cat_mutation_receipts where user_id = owner_id and request_id = p_request_id;
  if found then
    if receipt_hash is distinct from input_hash then raise exception 'Retry payload changed' using errcode = '22023'; end if;
    return public.read_cat_workspace();
  end if;
  insert into public.cat_workspace_versions(user_id) values (owner_id) on conflict do nothing;
  select revision into current_revision from public.cat_workspace_versions where user_id = owner_id;
  if current_revision <> p_expected_revision then raise exception 'Workspace changed; refresh before saving' using errcode = '40001'; end if;
  insert into public.study_preferences(user_id) values (owner_id) on conflict do nothing;
  select * into pref from public.study_preferences where user_id = owner_id;

  if p_operation in ('preferences', 'plan') then
    pref.daily_minutes := (p_payload->'preferences'->>'dailyMinutes')::integer;
    pref.max_tasks := (p_payload->'preferences'->>'maxTasks')::integer;
    pref.timezone := p_payload->'preferences'->>'timezone';
    pref.target_date := (p_payload->'preferences'->>'targetDate')::date;
    if pref.daily_minutes is null or pref.max_tasks is null or pref.timezone is null then raise exception 'Missing preferences' using errcode = '22023'; end if;
    -- CHECK constraints and timezone trigger also validate these values.
    update public.study_preferences set daily_minutes = pref.daily_minutes, max_tasks = pref.max_tasks,
      timezone = pref.timezone, target_date = pref.target_date where user_id = owner_id;
    if pref.target_date < (now() at time zone pref.timezone)::date then raise exception 'Target date is in the past' using errcode = '22023'; end if;
  end if;
  today := (now() at time zone pref.timezone)::date;

  if p_operation = 'progress' then
    new_status := p_payload->>'status'; v_confidence := (p_payload->>'confidence')::integer;
    v_priority := (p_payload->>'priority')::integer; minutes := (p_payload->>'minutesStudied')::integer;
    if new_status is null or v_confidence is null or v_priority is null or minutes is null or minutes not between 0 and 240 then raise exception 'Invalid progress' using errcode = '22023'; end if;
    if new_status = 'not_started' and minutes <> 0 then raise exception 'Start learning before logging time' using errcode = '22023'; end if;
    if not exists (select 1 from public.syllabus_topics where id = p_payload->>'topicId' and catalog_id = 'cat-2026-v1') then raise exception 'Unknown topic' using errcode = '22023'; end if;
    insert into public.topic_progress(user_id, topic_id) values (owner_id, p_payload->>'topicId') on conflict (user_id, topic_id) do nothing;
    select * into progress from public.topic_progress where user_id = owner_id and topic_id = p_payload->>'topicId';
    if not public.topic_status_transition_allowed(progress.status, new_status) then raise exception 'Invalid learning transition' using errcode = '22023'; end if;
    update public.topic_progress set status = new_status, confidence = v_confidence, priority = v_priority,
      accumulated_minutes = progress.accumulated_minutes + minutes,
      last_studied_at = case when minutes > 0 then now() else progress.last_studied_at end,
      review_due_on = case when new_status = 'not_started' then null
        when minutes = 0 and new_status = progress.status then progress.review_due_on
        else today + case when new_status = 'needs_revision' then 2 when new_status = 'learning' then case when v_confidence <= 2 then 2 else 4 end
          when new_status = 'practising' then case when v_confidence <= 2 then 3 else 7 end
          else case when v_confidence <= 2 then 7 else 14 end end end
    where id = progress.id;
  elsif p_operation = 'plan' then
    if (p_payload->>'planDate')::date is distinct from today then raise exception 'Planning day changed; reload' using errcode = '40001'; end if;
    if p_payload->>'algorithmVersion' is distinct from 'cat-planner-v1' or jsonb_typeof(p_payload->'tasks') is distinct from 'array' then raise exception 'Invalid plan' using errcode = '22023'; end if;
    insert into public.study_plans(user_id, catalog_id, plan_date, algorithm_version, total_minutes, daily_budget, task_limit)
      values (owner_id, 'cat-2026-v1', today, 'cat-planner-v1', 0, pref.daily_minutes, pref.max_tasks)
      on conflict (user_id, plan_date) do update set generated_at = now(), daily_budget = pref.daily_minutes, task_limit = pref.max_tasks
      returning id into v_plan_id;
    delete from public.study_plan_tasks where study_plan_tasks.plan_id = v_plan_id and user_id = owner_id and status = 'planned';
    for task_data in select * from jsonb_to_recordset(p_payload->'tasks') as t("topicId" text, position integer, "plannedMinutes" integer, reason text) loop
      if not exists (select 1 from public.syllabus_topics where id = task_data."topicId" and catalog_id = 'cat-2026-v1' and estimated_minutes = task_data."plannedMinutes") then raise exception 'Invalid planned topic or duration' using errcode = '22023'; end if;
      insert into public.study_plan_tasks(plan_id, user_id, topic_id, position, planned_minutes, reason)
        values (v_plan_id, owner_id, task_data."topicId", task_data.position, task_data."plannedMinutes", task_data.reason);
    end loop;
    select coalesce(sum(planned_minutes), 0), count(*) into total, task_count from public.study_plan_tasks t where t.plan_id = v_plan_id and t.status <> 'skipped';
    if total > pref.daily_minutes or task_count > pref.max_tasks then raise exception 'Plan exceeds remaining daily capacity' using errcode = '22023'; end if;
    update public.study_plans set total_minutes = total where id = v_plan_id;
  elsif p_operation = 'task' then
    select * into task from public.study_plan_tasks where id = (p_payload->>'taskId')::uuid and user_id = owner_id;
    if not found then raise exception 'Task not found' using errcode = '42501'; end if;
    new_status := p_payload->>'status';
    if new_status is null or new_status not in ('in_progress', 'completed', 'skipped') then raise exception 'Invalid task state' using errcode = '22023'; end if;
    if task.status <> new_status then
      if task.status in ('completed', 'skipped') then raise exception 'Task already finished' using errcode = '40001'; end if;
      update public.study_plan_tasks set status = new_status,
        completed_at = case when new_status = 'completed' then now() else null end,
        skipped_at = case when new_status = 'skipped' then now() else null end where id = task.id;
      update public.study_plans set total_minutes = (select coalesce(sum(t.planned_minutes), 0) from public.study_plan_tasks t where t.plan_id = task.plan_id and t.status <> 'skipped') where id = task.plan_id;
    end if;
    -- Completion records the planned study block only. Mastery/confidence are never inferred.
  elsif p_operation <> 'preferences' then raise exception 'Unknown operation' using errcode = '22023';
  end if;
  update public.cat_workspace_versions set revision = revision + 1 where user_id = owner_id;
  insert into public.cat_mutation_receipts(user_id, request_id, payload_hash) values (owner_id, p_request_id, input_hash);
  return public.read_cat_workspace();
end;
$$;
revoke all on function public.mutate_cat_workspace(uuid, integer, text, jsonb) from public, anon;
grant execute on function public.mutate_cat_workspace(uuid, integer, text, jsonb) to authenticated;
-- Internal helpers are never public RPC entry points.
revoke all on function public.touch_updated_at(), public.enforce_topic_progress_transition(), public.enforce_study_plan_owner(),
  public.enforce_study_task_owner(), public.validate_study_timezone(), public.topic_status_transition_allowed(text, text) from public, anon, authenticated;

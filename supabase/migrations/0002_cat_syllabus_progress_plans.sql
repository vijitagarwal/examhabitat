-- CAT syllabus, user progress, and deterministic study planning.
-- The catalog is a product taxonomy with stable IDs; it is not presented as an official or exhaustive CAT syllabus.

create table if not exists public.syllabus_catalogs (
  id text primary key,
  exam_code text not null check (exam_code = 'cat'),
  version text not null,
  label text not null,
  disclaimer text not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.syllabus_sections (
  id text primary key,
  catalog_id text not null references public.syllabus_catalogs(id) on delete restrict,
  code text not null check (code in ('VARC', 'DILR', 'QA')),
  name text not null,
  description text not null,
  sort_order integer not null check (sort_order > 0),
  unique (catalog_id, code)
);

create table if not exists public.syllabus_topic_groups (
  id text primary key,
  section_id text not null references public.syllabus_sections(id) on delete restrict,
  name text not null,
  description text not null,
  sort_order integer not null check (sort_order > 0),
  unique (section_id, name)
);

create table if not exists public.syllabus_topics (
  id text primary key,
  catalog_id text not null references public.syllabus_catalogs(id) on delete restrict,
  section_id text not null references public.syllabus_sections(id) on delete restrict,
  group_id text not null references public.syllabus_topic_groups(id) on delete restrict,
  slug text not null,
  title text not null,
  description text not null,
  estimated_minutes integer not null check (estimated_minutes between 10 and 180),
  default_priority integer not null check (default_priority between 1 and 5),
  difficulty integer not null check (difficulty between 1 and 5),
  sort_order integer not null check (sort_order > 0),
  prerequisite_ids text[] not null default '{}',
  unique (catalog_id, slug)
);

create index if not exists syllabus_sections_catalog_order_idx on public.syllabus_sections(catalog_id, sort_order);
create index if not exists syllabus_groups_section_order_idx on public.syllabus_topic_groups(section_id, sort_order);
create index if not exists syllabus_topics_catalog_section_order_idx on public.syllabus_topics(catalog_id, section_id, sort_order);

create table if not exists public.topic_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id text not null references public.syllabus_topics(id) on delete restrict,
  status text not null default 'not_started' check (status in ('not_started', 'learning', 'practising', 'needs_revision', 'mastered')),
  confidence integer not null default 1 check (confidence between 1 and 5),
  priority integer not null default 3 check (priority between 1 and 5),
  accumulated_minutes integer not null default 0 check (accumulated_minutes >= 0),
  last_studied_at timestamptz,
  review_due_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, topic_id),
  check (status <> 'not_started' or review_due_on is null)
);

create index if not exists topic_progress_user_status_idx on public.topic_progress(user_id, status);
create index if not exists topic_progress_user_review_idx on public.topic_progress(user_id, review_due_on);

create table if not exists public.study_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  daily_minutes integer not null default 60 check (daily_minutes between 15 and 360),
  max_tasks integer not null default 3 check (max_tasks between 1 and 12),
  timezone text not null default 'Asia/Kolkata',
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  catalog_id text not null references public.syllabus_catalogs(id) on delete restrict,
  plan_date date not null,
  algorithm_version text not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  total_minutes integer not null check (total_minutes between 0 and 360),
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists study_plans_one_active_per_day_idx on public.study_plans(user_id, plan_date) where status = 'active';
create index if not exists study_plans_user_date_idx on public.study_plans(user_id, plan_date desc);

create table if not exists public.study_plan_tasks (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.study_plans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id text not null references public.syllabus_topics(id) on delete restrict,
  position integer not null check (position > 0),
  planned_minutes integer not null check (planned_minutes between 10 and 180),
  reason text not null check (char_length(reason) between 10 and 300),
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'completed', 'skipped')),
  completed_at timestamptz,
  skipped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plan_id, position),
  unique (plan_id, topic_id)
);

create index if not exists study_plan_tasks_user_status_idx on public.study_plan_tasks(user_id, status);
create index if not exists study_plan_tasks_plan_position_idx on public.study_plan_tasks(plan_id, position);

alter table public.syllabus_catalogs enable row level security;
alter table public.syllabus_sections enable row level security;
alter table public.syllabus_topic_groups enable row level security;
alter table public.syllabus_topics enable row level security;
alter table public.topic_progress enable row level security;
alter table public.study_preferences enable row level security;
alter table public.study_plans enable row level security;
alter table public.study_plan_tasks enable row level security;

drop policy if exists "authenticated users can read syllabus catalogs" on public.syllabus_catalogs;
create policy "authenticated users can read syllabus catalogs" on public.syllabus_catalogs for select to authenticated using (true);
drop policy if exists "authenticated users can read syllabus sections" on public.syllabus_sections;
create policy "authenticated users can read syllabus sections" on public.syllabus_sections for select to authenticated using (true);
drop policy if exists "authenticated users can read syllabus groups" on public.syllabus_topic_groups;
create policy "authenticated users can read syllabus groups" on public.syllabus_topic_groups for select to authenticated using (true);
drop policy if exists "authenticated users can read syllabus topics" on public.syllabus_topics;
create policy "authenticated users can read syllabus topics" on public.syllabus_topics for select to authenticated using (true);

drop policy if exists "users own topic progress" on public.topic_progress;
create policy "users own topic progress" on public.topic_progress for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "users own study preferences" on public.study_preferences;
create policy "users own study preferences" on public.study_preferences for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "users own study plans" on public.study_plans;
create policy "users own study plans" on public.study_plans for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "users own study tasks" on public.study_plan_tasks;
create policy "users own study tasks" on public.study_plan_tasks for all to authenticated using (
  user_id = auth.uid() and exists (select 1 from public.study_plans p where p.id = plan_id and p.user_id = auth.uid())
) with check (
  user_id = auth.uid() and exists (select 1 from public.study_plans p where p.id = plan_id and p.user_id = auth.uid())
);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists topic_progress_touch_updated_at on public.topic_progress;
create trigger topic_progress_touch_updated_at before update on public.topic_progress for each row execute procedure public.touch_updated_at();
drop trigger if exists study_preferences_touch_updated_at on public.study_preferences;
create trigger study_preferences_touch_updated_at before update on public.study_preferences for each row execute procedure public.touch_updated_at();
drop trigger if exists study_plan_tasks_touch_updated_at on public.study_plan_tasks;
create trigger study_plan_tasks_touch_updated_at before update on public.study_plan_tasks for each row execute procedure public.touch_updated_at();

create or replace function public.topic_status_transition_allowed(old_status text, new_status text) returns boolean language sql immutable as $$
  select case old_status
    when 'not_started' then new_status in ('not_started', 'learning')
    when 'learning' then new_status in ('learning', 'practising', 'needs_revision')
    when 'practising' then new_status in ('practising', 'needs_revision', 'mastered')
    when 'needs_revision' then new_status in ('needs_revision', 'practising', 'mastered')
    when 'mastered' then new_status in ('mastered', 'needs_revision', 'practising')
    else false
  end;
$$;

create or replace function public.enforce_topic_progress_transition() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'not_started' then raise exception 'New progress must begin as not_started'; end if;
    return new;
  end if;
  if new.user_id <> old.user_id or new.topic_id <> old.topic_id then raise exception 'Progress ownership cannot change'; end if;
  if not public.topic_status_transition_allowed(old.status, new.status) then raise exception 'Invalid topic progress transition'; end if;
  return new;
end;
$$;

drop trigger if exists topic_progress_transition on public.topic_progress;
create trigger topic_progress_transition before insert or update on public.topic_progress for each row execute procedure public.enforce_topic_progress_transition();

create or replace function public.enforce_study_plan_owner() returns trigger language plpgsql as $$
begin
  if new.user_id <> auth.uid() then raise exception 'Study plan ownership cannot be forged'; end if;
  if tg_op = 'UPDATE' and new.user_id <> old.user_id then raise exception 'Study plan ownership cannot change'; end if;
  return new;
end;
$$;

create or replace function public.enforce_study_task_owner() returns trigger language plpgsql as $$
begin
  if new.user_id <> auth.uid() then raise exception 'Study task ownership cannot be forged'; end if;
  if not exists (select 1 from public.study_plans p where p.id = new.plan_id and p.user_id = auth.uid()) then raise exception 'Study task plan ownership mismatch'; end if;
  if tg_op = 'UPDATE' and (new.user_id <> old.user_id or new.plan_id <> old.plan_id or new.topic_id <> old.topic_id) then raise exception 'Study task identity cannot change'; end if;
  if tg_op = 'UPDATE' and not public.topic_status_transition_allowed(
    case old.status when 'planned' then 'not_started' when 'in_progress' then 'practising' when 'completed' then 'mastered' else 'needs_revision' end,
    case new.status when 'planned' then 'not_started' when 'in_progress' then 'practising' when 'completed' then 'mastered' else 'needs_revision' end
  ) and old.status <> new.status then raise exception 'Invalid study task transition'; end if;
  return new;
end;
$$;

drop trigger if exists study_plans_owner on public.study_plans;
create trigger study_plans_owner before insert or update on public.study_plans for each row execute procedure public.enforce_study_plan_owner();
drop trigger if exists study_plan_tasks_owner on public.study_plan_tasks;
create trigger study_plan_tasks_owner before insert or update on public.study_plan_tasks for each row execute procedure public.enforce_study_task_owner();

insert into public.syllabus_catalogs (id, exam_code, version, label, disclaimer, is_current)
values ('cat-2026-v1', 'cat', '2026.1', 'CAT preparation taxonomy · 2026.1', 'This is a structured preparation taxonomy, not a claim of an official or exhaustive CAT syllabus. It may evolve as the product content model matures.', true)
on conflict (id) do update set version = excluded.version, label = excluded.label, disclaimer = excluded.disclaimer, is_current = excluded.is_current;

insert into public.syllabus_sections (id, catalog_id, code, name, description, sort_order) values
  ('cat-varc', 'cat-2026-v1', 'VARC', 'Verbal Ability and Reading Comprehension', 'Read precisely, identify structure, and communicate the logic behind an answer.', 1),
  ('cat-dilr', 'cat-2026-v1', 'DILR', 'Data Interpretation and Logical Reasoning', 'Turn dense information into a model, then make sound deductions under time pressure.', 2),
  ('cat-qa', 'cat-2026-v1', 'QA', 'Quantitative Aptitude', 'Build a dependable toolkit for translating and solving quantitative problems.', 3)
on conflict (id) do update set name = excluded.name, description = excluded.description, sort_order = excluded.sort_order;

insert into public.syllabus_topic_groups (id, section_id, name, description, sort_order) values
  ('cat-varc-rc', 'cat-varc', 'Reading Comprehension', 'Comprehension, inference, and author intent.', 1),
  ('cat-varc-va', 'cat-varc', 'Verbal Ability', 'Paragraph-level organization and summary skills.', 2),
  ('cat-dilr-di', 'cat-dilr', 'Data Interpretation', 'Tables, charts, sets, and caselets.', 1),
  ('cat-dilr-lr', 'cat-dilr', 'Logical Reasoning', 'Arrangements, games, routes, and scheduling.', 2),
  ('cat-qa-arithmetic', 'cat-qa', 'Arithmetic', 'High-frequency applications of ratios, rates, and percentages.', 1),
  ('cat-qa-algebra', 'cat-qa', 'Algebra', 'Equations, functions, inequalities, and patterns.', 2),
  ('cat-qa-geometry', 'cat-qa', 'Geometry', 'Visual relationships and coordinate reasoning.', 3),
  ('cat-qa-number-systems', 'cat-qa', 'Number Systems', 'Properties, divisibility, and remainders.', 4),
  ('cat-qa-modern-math', 'cat-qa', 'Modern Math', 'Counting, probability, and set-based reasoning.', 5)
on conflict (id) do update set name = excluded.name, description = excluded.description, sort_order = excluded.sort_order;

insert into public.syllabus_topics (id, catalog_id, section_id, group_id, slug, title, description, estimated_minutes, default_priority, difficulty, sort_order, prerequisite_ids) values
  ('cat-varc-rc-main-idea', 'cat-2026-v1', 'cat-varc', 'cat-varc-rc', 'main-idea', 'Main idea and purpose', 'Separate the passage central claim from its supporting details.', 35, 5, 2, 1, '{}'),
  ('cat-varc-rc-inference', 'cat-2026-v1', 'cat-varc', 'cat-varc-rc', 'inference', 'Inference and implication', 'Infer only what the passage supports, without importing outside assumptions.', 35, 5, 3, 2, '{cat-varc-rc-main-idea}'),
  ('cat-varc-rc-tone', 'cat-2026-v1', 'cat-varc', 'cat-varc-rc', 'tone-attitude', 'Tone and author attitude', 'Track the author stance through language, qualification, and contrast.', 30, 4, 3, 3, '{cat-varc-rc-main-idea}'),
  ('cat-varc-rc-structure', 'cat-2026-v1', 'cat-varc', 'cat-varc-rc', 'structure', 'Passage structure', 'Map how paragraphs develop, challenge, or qualify the central argument.', 35, 4, 3, 4, '{cat-varc-rc-main-idea}'),
  ('cat-varc-rc-application', 'cat-2026-v1', 'cat-varc', 'cat-varc-rc', 'application-evaluation', 'Application and evaluation', 'Apply a passage logic to a new example while preserving its boundaries.', 35, 3, 4, 5, '{cat-varc-rc-inference}'),
  ('cat-varc-va-summary', 'cat-2026-v1', 'cat-varc', 'cat-varc-va', 'para-summary', 'Para summary', 'Compress a paragraph without losing its scope, intent, or logical relationship.', 25, 5, 2, 1, '{}'),
  ('cat-varc-va-jumbles', 'cat-2026-v1', 'cat-varc', 'cat-varc-va', 'para-jumbles', 'Para jumbles', 'Use reference words, chronology, and argument flow to order sentences.', 30, 5, 3, 2, '{cat-varc-va-summary}'),
  ('cat-varc-va-odd-sentence', 'cat-2026-v1', 'cat-varc', 'cat-varc-va', 'odd-sentence', 'Odd sentence out', 'Identify the sentence that breaks the paragraph coherent thread.', 25, 4, 3, 3, '{cat-varc-va-summary}'),
  ('cat-varc-va-completion', 'cat-2026-v1', 'cat-varc', 'cat-varc-va', 'sentence-completion', 'Sentence completion', 'Complete an idea using the intended claim and grammatical direction.', 25, 3, 2, 4, '{cat-varc-va-summary}'),
  ('cat-dilr-di-tables', 'cat-2026-v1', 'cat-dilr', 'cat-dilr-di', 'tables', 'Tables and data grids', 'Read multi-variable tables and identify the smallest useful calculation.', 35, 5, 2, 1, '{}'),
  ('cat-dilr-di-charts', 'cat-2026-v1', 'cat-dilr', 'cat-dilr-di', 'bar-line-charts', 'Bar and line charts', 'Compare trends, ratios, and changes across charted data.', 35, 4, 3, 2, '{cat-dilr-di-tables}'),
  ('cat-dilr-di-pie', 'cat-2026-v1', 'cat-dilr', 'cat-dilr-di', 'pie-charts', 'Pie charts and proportions', 'Translate proportions into comparable quantities without over-calculating.', 30, 3, 2, 3, '{cat-dilr-di-tables}'),
  ('cat-dilr-di-caselets', 'cat-2026-v1', 'cat-dilr', 'cat-dilr-di', 'caselets', 'Data caselets', 'Extract a compact model from prose before attempting the questions.', 40, 5, 4, 4, '{cat-dilr-di-tables,cat-dilr-di-charts}'),
  ('cat-dilr-di-venn', 'cat-2026-v1', 'cat-dilr', 'cat-dilr-di', 'venn-diagrams', 'Venn diagrams and sets', 'Represent overlapping groups and use inclusion-exclusion carefully.', 35, 4, 3, 5, '{cat-dilr-di-tables}'),
  ('cat-dilr-lr-arrangements', 'cat-2026-v1', 'cat-dilr', 'cat-dilr-lr', 'arrangements', 'Arrangements and order', 'Convert positional constraints into a clean arrangement model.', 40, 5, 4, 1, '{}'),
  ('cat-dilr-lr-selection', 'cat-2026-v1', 'cat-dilr', 'cat-dilr-lr', 'selection-distribution', 'Selection and distribution', 'Track inclusion, exclusion, and distribution constraints systematically.', 40, 5, 4, 2, '{}'),
  ('cat-dilr-lr-games', 'cat-2026-v1', 'cat-dilr', 'cat-dilr-lr', 'games-tournaments', 'Games and tournaments', 'Build a standings or match-outcome model without missing cases.', 40, 4, 4, 3, '{cat-dilr-lr-selection}'),
  ('cat-dilr-lr-routes', 'cat-2026-v1', 'cat-dilr', 'cat-dilr-lr', 'routes-networks', 'Routes and networks', 'Trace paths and connectivity constraints through a simple graph model.', 35, 3, 3, 4, '{}'),
  ('cat-dilr-lr-scheduling', 'cat-2026-v1', 'cat-dilr', 'cat-dilr-lr', 'scheduling', 'Scheduling and sequencing', 'Place events over time while maintaining every dependency and exclusion.', 40, 5, 4, 5, '{cat-dilr-lr-arrangements}'),
  ('cat-dilr-lr-binary', 'cat-2026-v1', 'cat-dilr', 'cat-dilr-lr', 'binary-logic', 'Binary logic and truth tables', 'Use consistent truth assignments to eliminate impossible cases.', 35, 3, 4, 6, '{cat-dilr-lr-selection}'),
  ('cat-qa-arithmetic-percentages', 'cat-2026-v1', 'cat-qa', 'cat-qa-arithmetic', 'percentages', 'Percentages', 'Move fluently between percentage change, base values, and comparisons.', 35, 5, 2, 1, '{}'),
  ('cat-qa-arithmetic-profit-loss', 'cat-2026-v1', 'cat-qa', 'cat-qa-arithmetic', 'profit-loss', 'Profit, loss, and discount', 'Model cost, marked price, discount, and margin without mixing bases.', 30, 4, 2, 2, '{cat-qa-arithmetic-percentages}'),
  ('cat-qa-arithmetic-ratios', 'cat-2026-v1', 'cat-qa', 'cat-qa-arithmetic', 'ratios', 'Ratios and proportions', 'Translate relationships into scalable quantities and constraints.', 35, 5, 2, 3, '{}'),
  ('cat-qa-arithmetic-averages', 'cat-2026-v1', 'cat-qa', 'cat-qa-arithmetic', 'averages', 'Averages and weighted averages', 'Use totals and weights to avoid repeated arithmetic.', 30, 4, 2, 4, '{cat-qa-arithmetic-ratios}'),
  ('cat-qa-arithmetic-tsd', 'cat-2026-v1', 'cat-qa', 'cat-qa-arithmetic', 'time-speed-distance', 'Time, speed, and distance', 'Connect rate, time, relative speed, and journeys into one model.', 40, 5, 3, 5, '{cat-qa-arithmetic-ratios}'),
  ('cat-qa-arithmetic-time-work', 'cat-2026-v1', 'cat-qa', 'cat-qa-arithmetic', 'time-work', 'Time and work', 'Use work rates to combine or compare people and machines.', 40, 4, 3, 6, '{cat-qa-arithmetic-ratios}'),
  ('cat-qa-arithmetic-mixtures', 'cat-2026-v1', 'cat-qa', 'cat-qa-arithmetic', 'mixtures', 'Mixtures and alligation', 'Balance component proportions and concentration changes.', 35, 3, 3, 7, '{cat-qa-arithmetic-ratios}'),
  ('cat-qa-algebra-linear', 'cat-2026-v1', 'cat-qa', 'cat-qa-algebra', 'linear-equations', 'Linear equations', 'Translate a word problem into a minimal system of equations.', 30, 5, 2, 1, '{}'),
  ('cat-qa-algebra-quadratic', 'cat-2026-v1', 'cat-qa', 'cat-qa-algebra', 'quadratics', 'Quadratic equations', 'Use roots, factorisation, and relationships between roots efficiently.', 35, 4, 3, 2, '{cat-qa-algebra-linear}'),
  ('cat-qa-algebra-inequalities', 'cat-2026-v1', 'cat-qa', 'cat-qa-algebra', 'inequalities', 'Inequalities and ranges', 'Track sign changes and valid ranges while solving constraints.', 30, 4, 3, 3, '{cat-qa-algebra-linear}'),
  ('cat-qa-algebra-functions', 'cat-2026-v1', 'cat-qa', 'cat-qa-algebra', 'functions', 'Functions and graphs', 'Interpret transformations, domains, and outputs from a function model.', 40, 3, 4, 4, '{cat-qa-algebra-linear}'),
  ('cat-qa-algebra-sequences', 'cat-2026-v1', 'cat-qa', 'cat-qa-algebra', 'sequences-series', 'Sequences and series', 'Identify recurrence, progression, and summation structure.', 35, 3, 3, 5, '{cat-qa-algebra-linear}'),
  ('cat-qa-geometry-lines', 'cat-2026-v1', 'cat-qa', 'cat-qa-geometry', 'lines-angles', 'Lines and angles', 'Use angle relationships and parallel-line properties with precision.', 30, 3, 2, 1, '{}'),
  ('cat-qa-geometry-triangles', 'cat-2026-v1', 'cat-qa', 'cat-qa-geometry', 'triangles', 'Triangles', 'Apply similarity, area, and proportionality in triangle problems.', 40, 4, 3, 2, '{cat-qa-geometry-lines}'),
  ('cat-qa-geometry-circles', 'cat-2026-v1', 'cat-qa', 'cat-qa-geometry', 'circles', 'Circles', 'Use chords, tangents, and cyclic relationships to reduce geometry.', 35, 3, 4, 3, '{cat-qa-geometry-lines}'),
  ('cat-qa-geometry-coordinate', 'cat-2026-v1', 'cat-qa', 'cat-qa-geometry', 'coordinate-geometry', 'Coordinate geometry', 'Translate geometric relationships into manageable equations.', 40, 3, 4, 4, '{cat-qa-geometry-lines}'),
  ('cat-qa-number-divisibility', 'cat-2026-v1', 'cat-qa', 'cat-qa-number-systems', 'divisibility', 'Divisibility and primes', 'Use factors and divisibility rules to simplify integer constraints.', 30, 4, 2, 1, '{}'),
  ('cat-qa-number-remainders', 'cat-2026-v1', 'cat-qa', 'cat-qa-number-systems', 'remainders', 'Remainders and cyclicity', 'Track repeated remainder patterns without expanding large values.', 35, 4, 3, 2, '{cat-qa-number-divisibility}'),
  ('cat-qa-number-hcf-lcm', 'cat-2026-v1', 'cat-qa', 'cat-qa-number-systems', 'hcf-lcm', 'HCF and LCM', 'Model common factors and multiples across integer conditions.', 30, 3, 2, 3, '{cat-qa-number-divisibility}'),
  ('cat-qa-modern-pnc', 'cat-2026-v1', 'cat-qa', 'cat-qa-modern-math', 'permutation-combination', 'Permutation and combination', 'Count arrangements while separating order, repetition, and restrictions.', 40, 4, 4, 1, '{}'),
  ('cat-qa-modern-probability', 'cat-2026-v1', 'cat-qa', 'cat-qa-modern-math', 'probability', 'Probability', 'Define a complete sample space before calculating conditional chances.', 40, 4, 4, 2, '{cat-qa-modern-pnc}'),
  ('cat-qa-modern-sets', 'cat-2026-v1', 'cat-qa', 'cat-qa-modern-math', 'sets', 'Sets and Venn reasoning', 'Represent membership relationships and count overlaps cleanly.', 30, 3, 2, 3, '{cat-qa-modern-pnc}')
on conflict (id) do update set title = excluded.title, description = excluded.description, estimated_minutes = excluded.estimated_minutes, default_priority = excluded.default_priority, difficulty = excluded.difficulty, sort_order = excluded.sort_order, prerequisite_ids = excluded.prerequisite_ids;

create or replace function public.update_topic_progress(
  p_topic_id text,
  p_status text,
  p_confidence integer,
  p_priority integer,
  p_minutes integer,
  p_review_due_on date
) returns setof public.topic_progress language plpgsql as $$
declare
  current_progress public.topic_progress;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.syllabus_topics where id = p_topic_id and catalog_id = 'cat-2026-v1') then raise exception 'Unknown CAT topic'; end if;
  if p_status not in ('not_started', 'learning', 'practising', 'needs_revision', 'mastered') then raise exception 'Invalid topic status'; end if;
  if p_confidence not between 1 and 5 or p_priority not between 1 and 5 or p_minutes not between 0 and 240 then raise exception 'Invalid progress values'; end if;
  select * into current_progress from public.topic_progress where user_id = auth.uid() and topic_id = p_topic_id for update;
  if not found then
    insert into public.topic_progress (user_id, topic_id) values (auth.uid(), p_topic_id);
    select * into current_progress from public.topic_progress where user_id = auth.uid() and topic_id = p_topic_id for update;
  end if;
  if not public.topic_status_transition_allowed(current_progress.status, p_status) then raise exception 'Invalid topic progress transition'; end if;
  update public.topic_progress
  set status = p_status,
      confidence = p_confidence,
      priority = p_priority,
      accumulated_minutes = current_progress.accumulated_minutes + p_minutes,
      last_studied_at = case when p_minutes > 0 or p_status <> 'not_started' then now() else current_progress.last_studied_at end,
      review_due_on = p_review_due_on
  where id = current_progress.id;
  return query select * from public.topic_progress where id = current_progress.id;
end;
$$;

create or replace function public.generate_study_plan(
  p_plan_date date,
  p_catalog_id text,
  p_algorithm_version text,
  p_total_minutes integer,
  p_daily_minutes integer,
  p_max_tasks integer,
  p_timezone text,
  p_target_date date,
  p_tasks jsonb
) returns uuid language plpgsql as $$
declare
  new_plan_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_catalog_id <> 'cat-2026-v1' or p_daily_minutes not between 15 and 360 or p_max_tasks not between 1 and 12 then raise exception 'Invalid study plan inputs'; end if;
  if p_total_minutes < 0 or p_total_minutes > p_daily_minutes then raise exception 'Study plan exceeds daily budget'; end if;
  if jsonb_array_length(coalesce(p_tasks, '[]'::jsonb)) > p_max_tasks then raise exception 'Study plan exceeds task limit'; end if;
  if (select coalesce(sum(task.planned_minutes), 0) from jsonb_to_recordset(coalesce(p_tasks, '[]'::jsonb)) as task(planned_minutes integer)) <> p_total_minutes then raise exception 'Study plan total is inconsistent'; end if;
  if exists (
    select 1 from jsonb_to_recordset(coalesce(p_tasks, '[]'::jsonb)) as task(topic_id text)
    where not exists (select 1 from public.syllabus_topics t where t.id = task.topic_id and t.catalog_id = p_catalog_id)
  ) then raise exception 'Study plan contains an unknown topic'; end if;
  insert into public.study_preferences (user_id, daily_minutes, max_tasks, timezone, target_date)
  values (auth.uid(), p_daily_minutes, p_max_tasks, p_timezone, p_target_date)
  on conflict (user_id) do update set daily_minutes = excluded.daily_minutes, max_tasks = excluded.max_tasks, timezone = excluded.timezone, target_date = excluded.target_date;
  update public.study_plans set status = 'archived' where user_id = auth.uid() and plan_date = p_plan_date and status = 'active';
  insert into public.study_plans (user_id, catalog_id, plan_date, algorithm_version, status, total_minutes)
  values (auth.uid(), p_catalog_id, p_plan_date, p_algorithm_version, 'active', p_total_minutes)
  returning id into new_plan_id;
  insert into public.study_plan_tasks (plan_id, user_id, topic_id, position, planned_minutes, reason)
  select new_plan_id, auth.uid(), task.topic_id, task.position, task.planned_minutes, task.reason
  from jsonb_to_recordset(coalesce(p_tasks, '[]'::jsonb)) as task(topic_id text, position integer, planned_minutes integer, reason text);
  return new_plan_id;
end;
$$;

create or replace function public.update_study_task_status(p_task_id uuid, p_status text) returns setof public.study_plan_tasks language plpgsql as $$
declare
  current_task public.study_plan_tasks;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_status not in ('planned', 'in_progress', 'completed', 'skipped') then raise exception 'Invalid study task status'; end if;
  select * into current_task from public.study_plan_tasks where id = p_task_id and user_id = auth.uid() for update;
  if not found then raise exception 'Study task not found'; end if;
  if current_task.status = 'completed' or current_task.status = 'skipped' then raise exception 'Finished study tasks cannot be changed'; end if;
  if current_task.status = 'planned' and p_status not in ('planned', 'in_progress', 'completed', 'skipped') then raise exception 'Invalid study task transition'; end if;
  if current_task.status = 'in_progress' and p_status not in ('in_progress', 'completed', 'skipped') then raise exception 'Invalid study task transition'; end if;
  update public.study_plan_tasks set status = p_status, completed_at = case when p_status = 'completed' then now() else null end, skipped_at = case when p_status = 'skipped' then now() else null end where id = p_task_id;
  return query select * from public.study_plan_tasks where id = p_task_id;
end;
$$;

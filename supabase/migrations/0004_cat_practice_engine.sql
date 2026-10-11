-- Practice-v1. All writes and all key-bearing reads are behind authenticated RPCs.
create table public.practice_sets (
  id text primary key, kind text not null check (kind in ('passage','case')),
  title text not null, body text not null, columns jsonb not null default '[]', rows jsonb not null default '[]',
  version integer not null default 1 check (version > 0), created_at timestamptz not null default now(),
  check (jsonb_typeof(columns) = 'array' and jsonb_typeof(rows) = 'array')
);
create table public.practice_questions (
  id text primary key, topic_id text not null references public.syllabus_topics(id) on delete restrict,
  section text not null check (section in ('VARC','DILR','QA')), difficulty integer not null check (difficulty between 1 and 3),
  type text not null check (type in ('mcq','numeric')), prompt text not null check (length(prompt) >= 10),
  options jsonb not null default '[]', answer_key text not null, explanation text not null check (length(explanation) >= 20),
  set_id text references public.practice_sets(id) on delete restrict, set_position integer,
  provenance text not null default 'original-practice' check (provenance = 'original-practice'),
  published boolean not null default false, version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(), unique(set_id, set_position),
  check ((set_id is null and set_position is null) or (set_id is not null and set_position > 0)),
  check (jsonb_typeof(options) = 'array')
);
create index practice_questions_filter on public.practice_questions(section, topic_id, difficulty) where published;

create function public.practice_validate_content() returns trigger language plpgsql set search_path = '' as $$
declare s public.practice_sets; option_count integer;
begin
  if not exists(select 1 from public.syllabus_topics t join public.syllabus_sections sec on sec.id=t.section_id where t.id=new.topic_id and sec.code=new.section) then
    raise exception 'Question topic/section mismatch' using errcode='22023';
  end if;
  if new.type='numeric' then
    if jsonb_array_length(new.options)<>0 or new.answer_key !~ '^[+-]?[0-9]{1,12}([.][0-9]{1,6})?$' then raise exception 'Invalid numeric content' using errcode='22023'; end if;
  else
    select count(distinct o->>'id') into option_count from jsonb_array_elements(new.options) o where o->>'id' in ('A','B','C','D') and length(o->>'text')>0;
    if option_count<>4 or jsonb_array_length(new.options)<>4 or new.answer_key not in ('A','B','C','D') then raise exception 'Invalid MCQ content' using errcode='22023'; end if;
  end if;
  if new.set_id is not null then
    select * into s from public.practice_sets where id=new.set_id;
    if not found or (s.kind='passage' and new.section<>'VARC') or (s.kind='case' and new.section<>'DILR') then raise exception 'Invalid shared content' using errcode='22023'; end if;
    if exists(select 1 from jsonb_array_elements(s.rows) r where jsonb_typeof(r)<>'array' or jsonb_array_length(r)<>jsonb_array_length(s.columns)) then raise exception 'Invalid table dimensions' using errcode='22023'; end if;
  end if;
  return new;
end $$;
create trigger practice_content_check before insert or update on public.practice_questions for each row execute function public.practice_validate_content();

create table public.practice_attempts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null, config jsonb not null, mode text not null check(mode in ('practice','timed')),
  status text not null default 'active' check(status in ('active','submitted','expired')),
  policy jsonb not null, started_at timestamptz not null default clock_timestamp(), deadline timestamptz, finished_at timestamptz,
  revision integer not null default 0 check(revision>=0), result jsonb,
  unique(user_id,request_id), unique(id,user_id),
  check ((mode='practice' and deadline is null) or (mode='timed' and deadline>started_at)),
  check ((status='active' and finished_at is null and result is null) or (status<>'active' and finished_at is not null and result is not null)),
  check (policy->>'version'='practice-v1' and (policy->>'correct')::integer=3 and (policy->>'mcqPenalty')::integer in (0,1) and (policy->>'numericPenalty')::integer=0)
);
-- Frozen snapshots include keys; never grant direct SELECT to student roles.
create table public.practice_attempt_items (
  attempt_id uuid not null, user_id uuid not null, question_id text not null references public.practice_questions(id) on delete restrict,
  position integer not null check(position between 1 and 20), question jsonb not null, answer_key text not null, explanation text not null,
  primary key(attempt_id,question_id), unique(attempt_id,position), unique(attempt_id,question_id,user_id),
  foreign key(attempt_id,user_id) references public.practice_attempts(id,user_id) on delete cascade
);
create table public.practice_answers (
  attempt_id uuid not null, question_id text not null, user_id uuid not null,
  answer text check(length(answer)<=32), skipped boolean not null default false, updated_at timestamptz not null default clock_timestamp(),
  primary key(attempt_id,question_id), foreign key(attempt_id,question_id,user_id) references public.practice_attempt_items(attempt_id,question_id,user_id) on delete cascade,
  check (not skipped or answer is null)
);
create table public.practice_receipts (
  attempt_id uuid not null, user_id uuid not null, request_id uuid not null, payload jsonb not null,
  primary key(attempt_id,request_id), foreign key(attempt_id,user_id) references public.practice_attempts(id,user_id) on delete cascade
);
create table public.practice_bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade, question_id text not null references public.practice_questions(id) on delete restrict,
  created_at timestamptz not null default now(), primary key(user_id,question_id)
);
create table public.practice_reviews (
  attempt_id uuid not null, question_id text not null, user_id uuid not null, outcome text not null check(outcome in ('incorrect','unanswered','skipped')),
  reviewed_at timestamptz, primary key(attempt_id,question_id),
  foreign key(attempt_id,question_id,user_id) references public.practice_attempt_items(attempt_id,question_id,user_id) on delete cascade
);
create index practice_attempt_history on public.practice_attempts(user_id,started_at desc,id);
create index practice_item_history on public.practice_attempt_items(user_id,question_id,attempt_id);
create index practice_review_queue on public.practice_reviews(user_id,reviewed_at,attempt_id);
alter table public.practice_sets enable row level security;
alter table public.practice_questions enable row level security;
alter table public.practice_attempts enable row level security;
alter table public.practice_attempt_items enable row level security;
alter table public.practice_answers enable row level security;
alter table public.practice_receipts enable row level security;
alter table public.practice_bookmarks enable row level security;
alter table public.practice_reviews enable row level security;
create policy practice_attempt_owner on public.practice_attempts for select to authenticated using(user_id=auth.uid());
create policy practice_item_owner on public.practice_attempt_items for select to authenticated using(user_id=auth.uid());
create policy practice_answer_owner on public.practice_answers for select to authenticated using(user_id=auth.uid());
create policy practice_receipt_owner on public.practice_receipts for select to authenticated using(user_id=auth.uid());
create policy practice_bookmark_owner on public.practice_bookmarks for select to authenticated using(user_id=auth.uid());
create policy practice_review_owner on public.practice_reviews for select to authenticated using(user_id=auth.uid());
revoke all on public.practice_sets,public.practice_questions,public.practice_attempts,public.practice_attempt_items,public.practice_answers,public.practice_receipts,public.practice_bookmarks,public.practice_reviews from public,anon,authenticated;
grant select on public.practice_attempts,public.practice_answers,public.practice_bookmarks,public.practice_reviews to authenticated;

create function public.practice_question_json(q public.practice_questions) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('id',q.id,'version',q.version,'topicId',q.topic_id,'topicTitle',(select title from public.syllabus_topics where id=q.topic_id),
  'section',q.section,'difficulty',q.difficulty,'type',q.type,'prompt',q.prompt,'options',q.options,'provenance',q.provenance,
  'stimulus',(select jsonb_build_object('id',s.id,'kind',s.kind,'title',s.title,'body',s.body,'columns',s.columns,'rows',s.rows) from public.practice_sets s where s.id=q.set_id));
$$;
create function public.practice_outcome(p_type text,p_key text,p_answer text,p_skipped boolean) returns text language plpgsql immutable set search_path='' as $$
begin
 if p_skipped then return 'skipped'; end if;
 if p_answer is null or btrim(p_answer)='' then return 'unanswered'; end if;
 if p_type='numeric' then
   if btrim(p_answer) !~ '^[+-]?[0-9]{1,12}([.][0-9]{1,6})?$' then raise exception 'Invalid numeric answer' using errcode='22023'; end if;
   return case when btrim(p_answer)::numeric=p_key::numeric then 'correct' else 'incorrect' end;
 end if;
 if p_answer not in ('A','B','C','D') then raise exception 'Invalid option' using errcode='22023'; end if;
 return case when p_answer=p_key then 'correct' else 'incorrect' end;
end $$;
create function public.practice_score(p_id uuid) returns jsonb language sql stable set search_path='' as $$
 with classified as (
  select i.question->>'section' section,i.question->>'type' type,
   public.practice_outcome(i.question->>'type',i.answer_key,a.answer,coalesce(a.skipped,false)) outcome,p.policy
  from public.practice_attempt_items i join public.practice_attempts p on p.id=i.attempt_id
  left join public.practice_answers a on a.attempt_id=i.attempt_id and a.question_id=i.question_id where i.attempt_id=p_id
 ), counts as (
  select section, grouping(section) whole, count(*) total,count(*) filter(where outcome='correct') correct,
   count(*) filter(where outcome='incorrect') incorrect,count(*) filter(where outcome in ('unanswered','skipped')) unanswered,
   count(*) filter(where outcome='skipped') skipped,
   coalesce(sum(case when outcome='correct' then (policy->>'correct')::integer when outcome='incorrect' then -case when type='mcq' then (policy->>'mcqPenalty')::integer else (policy->>'numericPenalty')::integer end else 0 end),0) score
  from classified group by grouping sets((),(section))
 ), summaries as (
  select whole,section,jsonb_build_object('score',score,'correct',correct,'incorrect',incorrect,'unanswered',unanswered,'skipped',skipped,
   'attempted',correct+incorrect,'total',total,'maxScore',total*3,'accuracy',case when correct+incorrect=0 then null else round(100.0*correct/(correct+incorrect),2) end) value from counts
 ) select value || jsonb_build_object('sections',coalesce((select jsonb_agg(s.value||jsonb_build_object('section',s.section) order by s.section) from summaries s where s.whole=0),'[]')) from summaries where whole=1;
$$;
create function public.practice_finalize(p_id uuid,p_expired boolean) returns void language plpgsql set search_path='' as $$
declare a public.practice_attempts; ended timestamptz; scored jsonb;
begin
 select * into a from public.practice_attempts where id=p_id and user_id=auth.uid() for update;
 if not found then raise exception 'Attempt unavailable' using errcode='42501'; end if;
 if a.status<>'active' then return; end if;
 ended := case when p_expired then a.deadline else clock_timestamp() end;
 scored := public.practice_score(a.id)||jsonb_build_object('elapsedSeconds',greatest(0,floor(extract(epoch from ended-a.started_at))));
 update public.practice_attempts set status=case when p_expired then 'expired' else 'submitted' end,finished_at=ended,result=scored,revision=revision+1 where id=a.id;
 insert into public.practice_reviews(attempt_id,question_id,user_id,outcome)
 select i.attempt_id,i.question_id,i.user_id,public.practice_outcome(i.question->>'type',i.answer_key,ans.answer,coalesce(ans.skipped,false))
 from public.practice_attempt_items i left join public.practice_answers ans on ans.attempt_id=i.attempt_id and ans.question_id=i.question_id
 where i.attempt_id=a.id and public.practice_outcome(i.question->>'type',i.answer_key,ans.answer,coalesce(ans.skipped,false))<>'correct'
 on conflict do nothing;
end $$;
create function public.practice_snapshot(p_id uuid) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('id',a.id,'status',a.status,'mode',a.mode,'revision',a.revision,'startedAt',a.started_at,'deadline',a.deadline,
  'finishedAt',a.finished_at,'serverNow',clock_timestamp(),'policy',a.policy,'result',a.result,
  'items',(select jsonb_agg(jsonb_build_object('question',i.question,'position',i.position,'answer',ans.answer,'skipped',coalesce(ans.skipped,false),
   'bookmarked',exists(select 1 from public.practice_bookmarks b where b.user_id=a.user_id and b.question_id=i.question_id),
   'key',case when a.status<>'active' then i.answer_key end,'explanation',case when a.status<>'active' then i.explanation end,
   'outcome',case when a.status<>'active' then public.practice_outcome(i.question->>'type',i.answer_key,ans.answer,coalesce(ans.skipped,false)) end,
   'reviewed',exists(select 1 from public.practice_reviews r where r.attempt_id=a.id and r.question_id=i.question_id and r.reviewed_at is not null)) order by i.position)
   from public.practice_attempt_items i left join public.practice_answers ans on ans.attempt_id=i.attempt_id and ans.question_id=i.question_id where i.attempt_id=a.id))
 from public.practice_attempts a where a.id=p_id and a.user_id=auth.uid();
$$;
create function public.read_practice_attempt(p_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.practice_attempts;
begin
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
 select * into a from public.practice_attempts where id=p_id and user_id=auth.uid() for update;
 if not found then raise exception 'Attempt unavailable' using errcode='42501'; end if;
 if a.status='active' and a.deadline<=clock_timestamp() then perform public.practice_finalize(a.id,true); end if;
 return public.practice_snapshot(a.id);
end $$;

-- Bounded discovery. No answer keys or explanations are part of this projection.
create function public.practice_matching(p_filters jsonb) returns setof public.practice_questions language sql stable set search_path='' as $$
 select q.* from public.practice_questions q where q.published
 and (coalesce(p_filters->>'search','')='' or strpos(lower(q.prompt),lower(p_filters->>'search'))>0)
 and (coalesce(p_filters->>'section','')='' or q.section=p_filters->>'section')
 and (coalesce(p_filters->>'topicId','')='' or q.topic_id=p_filters->>'topicId')
 and (coalesce((p_filters->>'difficulty')::integer,0)=0 or q.difficulty=(p_filters->>'difficulty')::integer)
 and (coalesce(p_filters->>'type','')='' or q.type=p_filters->>'type')
 and (coalesce(p_filters->>'history','all')='all'
 or (p_filters->>'history'='bookmarked' and exists(select 1 from public.practice_bookmarks b where b.user_id=auth.uid() and b.question_id=q.id))
 or (p_filters->>'history' in ('attempted','unattempted') and (p_filters->>'history'='attempted')=exists(
 select 1 from public.practice_attempt_items i join public.practice_attempts a on a.id=i.attempt_id where i.question_id=q.id and a.user_id=auth.uid() and a.status<>'active')));
$$;
create function public.browse_practice(p_filters jsonb,p_page integer default 0) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
 if p_page is null or p_page<0 or p_page>10000 or p_filters is null or jsonb_typeof(p_filters)<>'object' then raise exception 'Invalid filters' using errcode='22023'; end if;
 return jsonb_build_object('total',(select count(*) from public.practice_matching(p_filters)), 'questions',coalesce((select jsonb_agg(jsonb_build_object('question',public.practice_question_json(q),
  'attempted',exists(select 1 from public.practice_attempt_items i join public.practice_attempts a on a.id=i.attempt_id where i.question_id=q.id and a.user_id=auth.uid() and a.status<>'active'),
  'bookmarked',exists(select 1 from public.practice_bookmarks b where b.user_id=auth.uid() and b.question_id=q.id)) order by q.id)
  from (select * from public.practice_matching(p_filters) order by id limit 12 offset p_page*12) q),'[]'));
end $$;
create function public.start_practice(p_input jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare owner_id uuid:=auth.uid(); a public.practice_attempts; ids text[]; q public.practice_questions; pos integer:=0;
 request uuid:=(p_input->>'requestId')::uuid; mode text:=p_input->>'mode'; minutes integer:=(p_input->>'minutes')::integer; amount integer:=(p_input->>'count')::integer; began timestamptz;
begin
 if owner_id is null then raise exception 'Sign in required' using errcode='42501'; end if;
 if request is null or mode is null or mode not in ('practice','timed') or minutes is null or minutes not between 1 and 120 or amount is null or amount not between 1 and 20
 or p_input->>'policy' is null or p_input->>'policy' not in ('standard','no-negative') or jsonb_typeof(p_input->'questionIds') is distinct from 'array' or jsonb_typeof(p_input->'filters') is distinct from 'object' then raise exception 'Invalid setup' using errcode='22023'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('practice:'||owner_id::text,0));
 select * into a from public.practice_attempts where user_id=owner_id and request_id=request;
 if found then
  if a.config<>p_input then raise exception 'Retry changed' using errcode='22023'; end if;
  return public.read_practice_attempt(a.id);
 end if;
 if jsonb_array_length(p_input->'questionIds')>0 then
  select array_agg(value) into ids from jsonb_array_elements_text(p_input->'questionIds');
  if cardinality(ids)>20 or (select count(distinct x) from unnest(ids) x)<>cardinality(ids) or exists(select 1 from unnest(ids) x where not exists(select 1 from public.practice_questions where id=x and published)) then raise exception 'Invalid question scope' using errcode='22023'; end if;
 else
  select array_agg(id order by id) into ids from (select id from public.practice_matching(p_input->'filters') order by id limit amount) candidates;
 end if;
 if coalesce(cardinality(ids),0)=0 then raise exception 'No matching questions' using errcode='22023'; end if;
 began:=clock_timestamp();
 insert into public.practice_attempts(user_id,request_id,config,mode,policy,started_at,deadline)
 values(owner_id,request,p_input,mode,jsonb_build_object('version','practice-v1','correct',3,'mcqPenalty',case when p_input->>'policy'='standard' then 1 else 0 end,'numericPenalty',0),began,case when mode='timed' then began+make_interval(mins=>minutes) end) returning * into a;
 -- Stable ID ordering; all selected siblings use the same frozen shared content.
 for q in select * from public.practice_questions where id=any(ids) order by id loop
  pos:=pos+1;
  insert into public.practice_attempt_items(attempt_id,user_id,question_id,position,question,answer_key,explanation)
  values(a.id,owner_id,q.id,pos,public.practice_question_json(q),q.answer_key,q.explanation);
 end loop;
 return public.practice_snapshot(a.id);
end $$;
create function public.command_practice(p_input jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.practice_attempts; i public.practice_attempt_items; prior jsonb; request uuid:=(p_input->>'requestId')::uuid;
 operation text:=p_input->>'operation'; expected_revision integer:=(p_input->>'revision')::integer; answer text; skip boolean;
begin
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
 if request is null or expected_revision is null or expected_revision<0 or operation is null or operation not in ('save','submit') then raise exception 'Invalid command' using errcode='22023'; end if;
 select * into a from public.practice_attempts where id=(p_input->>'attemptId')::uuid and user_id=auth.uid() for update;
 if not found then raise exception 'Attempt unavailable' using errcode='42501'; end if;
 select payload into prior from public.practice_receipts where attempt_id=a.id and request_id=request;
 if found then
  if prior<>p_input then raise exception 'Retry changed' using errcode='22023'; end if;
  return public.read_practice_attempt(a.id);
 end if;
 if a.status<>'active' then
  if operation='submit' then return public.practice_snapshot(a.id); end if;
  raise exception 'Attempt is final' using errcode='40001';
 end if;
 -- Evaluate time AFTER acquiring the lock. Deadline is exclusive for answer writes.
 if a.deadline<=clock_timestamp() then
  perform public.practice_finalize(a.id,true);
  return public.practice_snapshot(a.id);
 end if;
 if a.revision<>expected_revision then raise exception 'Stale answer draft' using errcode='40001'; end if;
 if p_input->'answer' is not null and p_input->'answer'<>'null'::jsonb then
  select * into i from public.practice_attempt_items where attempt_id=a.id and question_id=p_input->'answer'->>'questionId';
  if not found then raise exception 'Question outside attempt' using errcode='22023'; end if;
  answer:=nullif(btrim(p_input->'answer'->>'answer'),''); skip:=(p_input->'answer'->>'skipped')::boolean;
  if skip is null or length(answer)>32 or (skip and answer is not null) then raise exception 'Invalid answer' using errcode='22023'; end if;
  perform public.practice_outcome(i.question->>'type',i.answer_key,answer,skip);
  insert into public.practice_answers(attempt_id,question_id,user_id,answer,skipped) values(a.id,i.question_id,a.user_id,answer,skip)
  on conflict(attempt_id,question_id) do update set answer=excluded.answer,skipped=excluded.skipped,updated_at=clock_timestamp();
 elsif operation='save' then raise exception 'Missing answer' using errcode='22023'; end if;
 if operation='submit' then perform public.practice_finalize(a.id,false);
 else update public.practice_attempts set revision=revision+1 where id=a.id; end if;
 insert into public.practice_receipts(attempt_id,user_id,request_id,payload) values(a.id,a.user_id,request,p_input);
 return public.practice_snapshot(a.id);
end $$;
create function public.mark_practice(p_question text,p_attempt uuid,p_mark boolean) returns boolean language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
 if p_mark is null then raise exception 'Missing state' using errcode='22023'; end if;
 if p_attempt is null then
  if not exists(select 1 from public.practice_questions where id=p_question and published) then raise exception 'Question unavailable' using errcode='22023'; end if;
  if p_mark then insert into public.practice_bookmarks(user_id,question_id) values(auth.uid(),p_question) on conflict do nothing;
  else delete from public.practice_bookmarks where user_id=auth.uid() and question_id=p_question; end if;
 else
  update public.practice_reviews set reviewed_at=case when p_mark then clock_timestamp() end where user_id=auth.uid() and attempt_id=p_attempt and question_id=p_question;
  if not found then raise exception 'Review unavailable' using errcode='42501'; end if;
 end if;
 return p_mark;
end $$;
create function public.practice_history(p_page integer default 0,p_review boolean default false,p_unreviewed boolean default false) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
 if p_page is null or p_page<0 or p_page>10000 then raise exception 'Invalid page' using errcode='22023'; end if;
 if p_review then
  return jsonb_build_object('total',(select count(*) from public.practice_reviews where user_id=auth.uid() and (not p_unreviewed or reviewed_at is null)),
   'mistakes',coalesce((select jsonb_agg(jsonb_build_object('attemptId',r.attempt_id,'questionId',r.question_id,'prompt',i.question->>'prompt','topicTitle',i.question->>'topicTitle','section',i.question->>'section','outcome',r.outcome,'reviewed',r.reviewed_at is not null,'finishedAt',a.finished_at) order by a.finished_at desc,r.question_id)
   from (select r.* from public.practice_reviews r join public.practice_attempts a on a.id=r.attempt_id where r.user_id=auth.uid() and (not p_unreviewed or r.reviewed_at is null) order by a.finished_at desc,r.question_id limit 12 offset p_page*12) r
   join public.practice_attempts a on a.id=r.attempt_id join public.practice_attempt_items i on i.attempt_id=r.attempt_id and i.question_id=r.question_id),'[]'));
 end if;
 return jsonb_build_object('total',(select count(*) from public.practice_attempts where user_id=auth.uid()),'attempts',coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'mode',a.mode,'status',a.status,'startedAt',a.started_at,'deadline',a.deadline,'count',(select count(*) from public.practice_attempt_items where attempt_id=a.id),'result',a.result) order by a.started_at desc,a.id)
 from (select * from public.practice_attempts where user_id=auth.uid() order by started_at desc,id limit 12 offset p_page*12) a),'[]'));
end $$;
create function public.practice_signals() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
 return (with recent as (
 select i.question->>'topicId' topic,public.practice_outcome(i.question->>'type',i.answer_key,ans.answer,ans.skipped) outcome,
 row_number() over(partition by i.question->>'topicId' order by a.finished_at desc,a.id,i.position) n
 from public.practice_attempt_items i join public.practice_attempts a on a.id=i.attempt_id join public.practice_answers ans on ans.attempt_id=i.attempt_id and ans.question_id=i.question_id
 where a.user_id=auth.uid() and a.status<>'active' and ans.answer is not null and not ans.skipped
 ), counts as (select topic,count(*) attempted,count(*) filter(where outcome='incorrect') incorrect from recent where n<=20 group by topic)
 select coalesce(jsonb_agg(jsonb_build_object('topicId',topic,'attempted',attempted,'incorrect',incorrect) order by topic),'[]') from counts);
end $$;

-- Explicit function grants: helpers cannot be called via PostgREST to expose keys or forge results.
revoke all on function public.practice_validate_content(),public.practice_question_json(public.practice_questions),public.practice_outcome(text,text,text,boolean),public.practice_score(uuid),public.practice_finalize(uuid,boolean),public.practice_snapshot(uuid),public.practice_matching(jsonb) from public,anon,authenticated;
revoke all on function public.browse_practice(jsonb,integer),public.start_practice(jsonb),public.read_practice_attempt(uuid),public.command_practice(jsonb),public.mark_practice(text,uuid,boolean),public.practice_history(integer,boolean,boolean),public.practice_signals() from public,anon,authenticated;
grant execute on function public.browse_practice(jsonb,integer),public.start_practice(jsonb),public.read_practice_attempt(uuid),public.command_practice(jsonb),public.mark_practice(text,uuid,boolean),public.practice_history(integer,boolean,boolean),public.practice_signals() to authenticated;

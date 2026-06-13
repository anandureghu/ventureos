-- =============================================================================
-- VentureOS — Migration 0002: Venture domain model
-- Ventures, tasks (kanban), financial transactions, knowledge notes, documents.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type public.venture_category as enum (
  'dropshipping', 'printing_3d', 'story_books', 'clothing', 'saas', 'other'
);

-- Lifecycle: Idea -> Research -> Validation -> Planning -> MVP -> Launch -> Growth -> Scale
create type public.lifecycle_stage as enum (
  'idea', 'research', 'validation', 'planning', 'mvp', 'launch', 'growth', 'scale'
);

create type public.venture_state as enum ('active', 'paused', 'archived');

create type public.execution_mode as enum ('sequential', 'parallel');

-- Kanban columns
create type public.task_status as enum ('backlog', 'research', 'doing', 'waiting', 'completed');

create type public.task_priority as enum ('low', 'medium', 'high');

create type public.txn_type as enum ('expense', 'revenue');

create type public.note_type as enum ('note', 'research', 'supplier', 'competitor', 'meeting');

-- -----------------------------------------------------------------------------
-- ventures  (a single business idea inside the portfolio)
-- -----------------------------------------------------------------------------
create table public.ventures (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  description     text,
  category        public.venture_category not null default 'other',
  current_stage   public.lifecycle_stage not null default 'idea',
  state           public.venture_state not null default 'active',
  execution_mode  public.execution_mode not null default 'parallel',
  next_action     text,                       -- "What is the next action?"
  owner_id        uuid references public.profiles(id),  -- which co-founder leads it

  -- Priority scoring matrix (each factor 0..10)
  score_profit        smallint not null default 5 check (score_profit between 0 and 10),
  score_demand        smallint not null default 5 check (score_demand between 0 and 10),
  score_interest      smallint not null default 5 check (score_interest between 0 and 10),
  score_low_cost      smallint not null default 5 check (score_low_cost between 0 and 10), -- higher = cheaper
  score_low_time      smallint not null default 5 check (score_low_time between 0 and 10), -- higher = faster
  score_low_risk      smallint not null default 5 check (score_low_risk between 0 and 10), -- higher = safer

  est_launch_date     date,
  created_by      uuid not null references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index ventures_org_idx on public.ventures(org_id);

create trigger ventures_set_updated_at
  before update on public.ventures
  for each row execute function public.set_updated_at();

-- Business score 0..100 (equal-weighted average of the six factors)
create or replace function public.venture_priority_score(v public.ventures)
returns integer
language sql
immutable
as $$
  select round(
    (v.score_profit + v.score_demand + v.score_interest
     + v.score_low_cost + v.score_low_time + v.score_low_risk) / 60.0 * 100
  )::int;
$$;

-- -----------------------------------------------------------------------------
-- tasks  (kanban cards; support sequential stages + parallel tracks + blocking)
-- -----------------------------------------------------------------------------
create table public.tasks (
  id            uuid primary key default gen_random_uuid(),
  venture_id    uuid not null references public.ventures(id) on delete cascade,
  title         text not null,
  description   text,
  status        public.task_status not null default 'backlog',
  stage         public.lifecycle_stage,        -- which lifecycle stage this belongs to
  track         text,                           -- parallel track, e.g. "Supplier Research"
  priority      public.task_priority not null default 'medium',
  assignee_id   uuid references public.profiles(id),
  blocked_by    uuid references public.tasks(id) on delete set null,
  due_date      date,
  position      integer not null default 0,     -- ordering within a column
  created_by    uuid not null references public.profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  completed_at  timestamptz
);

create index tasks_venture_idx on public.tasks(venture_id);
create index tasks_status_idx  on public.tasks(venture_id, status);

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- stamp completed_at when a task moves to/from 'completed'
create or replace function public.tasks_stamp_completion()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'completed' and (old.status is distinct from 'completed') then
    new.completed_at = now();
  elsif new.status <> 'completed' then
    new.completed_at = null;
  end if;
  return new;
end;
$$;

create trigger tasks_completion
  before insert or update on public.tasks
  for each row execute function public.tasks_stamp_completion();

-- -----------------------------------------------------------------------------
-- transactions  (financial tracking per venture)
-- -----------------------------------------------------------------------------
create table public.transactions (
  id            uuid primary key default gen_random_uuid(),
  venture_id    uuid not null references public.ventures(id) on delete cascade,
  type          public.txn_type not null,
  category      text,
  description   text,
  amount        numeric(14,2) not null check (amount >= 0),
  currency      text not null default 'INR',
  occurred_on   date not null default current_date,
  created_by    uuid not null references public.profiles(id),
  created_at    timestamptz not null default now()
);

create index transactions_venture_idx on public.transactions(venture_id);

-- -----------------------------------------------------------------------------
-- notes  (knowledge vault entries)
-- -----------------------------------------------------------------------------
create table public.notes (
  id            uuid primary key default gen_random_uuid(),
  venture_id    uuid not null references public.ventures(id) on delete cascade,
  title         text not null,
  content       text,
  type          public.note_type not null default 'note',
  url           text,
  created_by    uuid not null references public.profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index notes_venture_idx on public.notes(venture_id);

create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- documents  (file metadata; bytes live in Supabase Storage bucket 'vault')
-- -----------------------------------------------------------------------------
create table public.documents (
  id            uuid primary key default gen_random_uuid(),
  venture_id    uuid not null references public.ventures(id) on delete cascade,
  name          text not null,
  storage_path  text not null,
  mime_type     text,
  size_bytes    bigint,
  uploaded_by   uuid not null references public.profiles(id),
  created_at    timestamptz not null default now()
);

create index documents_venture_idx on public.documents(venture_id);

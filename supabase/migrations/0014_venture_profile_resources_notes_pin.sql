-- =============================================================================
-- VentureOS — Migration 0014: Venture profile fields, resources, note pinning
-- Adds mission/vision/etc on ventures, a resources link table, and notes.pinned.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ventures — founder profile / positioning fields
-- -----------------------------------------------------------------------------
alter table public.ventures
  add column if not exists mission         text,
  add column if not exists vision          text,
  add column if not exists tagline         text,
  add column if not exists problem         text,
  add column if not exists solution        text,
  add column if not exists target_audience text,
  add column if not exists industry        text,
  add column if not exists website         text;

-- -----------------------------------------------------------------------------
-- notes — pin / star to surface important entries
-- -----------------------------------------------------------------------------
alter table public.notes
  add column if not exists pinned boolean not null default false;

create index if not exists notes_venture_pinned_idx
  on public.notes (venture_id, pinned desc, created_at desc);

-- -----------------------------------------------------------------------------
-- resources — external links for a venture (docs, repos, dashboards, etc.)
-- -----------------------------------------------------------------------------
create table public.resources (
  id          uuid primary key default gen_random_uuid(),
  venture_id  uuid not null references public.ventures(id) on delete cascade,
  title       text not null,
  url         text not null,
  description text,
  position    integer not null default 0,
  created_by  uuid not null references public.profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index resources_venture_idx on public.resources(venture_id);
create index resources_venture_position_idx on public.resources(venture_id, position);

create trigger resources_set_updated_at
  before update on public.resources
  for each row execute function public.set_updated_at();

alter table public.resources enable row level security;

create policy "resources: members read"
  on public.resources for select
  using (public.can_access_venture(venture_id));

create policy "resources: members create"
  on public.resources for insert
  with check (public.can_access_venture(venture_id) and created_by = auth.uid());

create policy "resources: members update"
  on public.resources for update
  using (public.can_access_venture(venture_id))
  with check (public.can_access_venture(venture_id));

create policy "resources: members delete"
  on public.resources for delete
  using (public.can_access_venture(venture_id));

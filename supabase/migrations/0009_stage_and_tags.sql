-- =============================================================================
-- VentureOS — Migration 0009: Stage capture + tags
-- Notes and transactions record the venture's lifecycle stage at creation time
-- (tasks already had this column, just unused). All three gain a `tags`
-- array; a venture-scoped `tags` table acts as the suggestion registry.
-- =============================================================================

alter table public.notes add column stage public.lifecycle_stage;
alter table public.transactions add column stage public.lifecycle_stage;

alter table public.tasks add column tags text[] not null default '{}';
alter table public.notes add column tags text[] not null default '{}';
alter table public.transactions add column tags text[] not null default '{}';

-- -----------------------------------------------------------------------------
-- tags  (venture-scoped suggestion registry — not a junction table; the
-- actual assignment lives in the `tags text[]` columns above)
-- -----------------------------------------------------------------------------
create table public.tags (
  id          uuid primary key default gen_random_uuid(),
  venture_id  uuid not null references public.ventures(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now()
);

create unique index tags_venture_name_idx on public.tags(venture_id, lower(name));
create index tags_venture_idx on public.tags(venture_id);

alter table public.tags enable row level security;

create policy "tags: read if venture accessible"
  on public.tags for select
  using (public.can_access_venture(venture_id));

create policy "tags: create if venture accessible"
  on public.tags for insert
  with check (public.can_access_venture(venture_id));

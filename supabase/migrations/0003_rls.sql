-- =============================================================================
-- VentureOS — Migration 0003: Row Level Security
-- Every row is scoped to an organization the current user belongs to.
-- =============================================================================

-- Helper: can the current user access rows under this venture?
create or replace function public.can_access_venture(_venture uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.ventures v
    join public.organization_members m on m.org_id = v.org_id
    where v.id = _venture
      and m.user_id = auth.uid()
  );
$$;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "profiles: read self and co-members"
  on public.profiles for select
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.organization_members me
      join public.organization_members them on them.org_id = me.org_id
      where me.user_id = auth.uid()
        and them.user_id = public.profiles.id
    )
  );

create policy "profiles: update self"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- -----------------------------------------------------------------------------
-- organizations
-- -----------------------------------------------------------------------------
alter table public.organizations enable row level security;

create policy "orgs: members can read"
  on public.organizations for select
  using (public.is_org_member(id));

create policy "orgs: any authed user can create"
  on public.organizations for insert
  with check (created_by = auth.uid());

create policy "orgs: owners/admins can update"
  on public.organizations for update
  using (public.has_org_role(id, array['owner','admin']::public.member_role[]))
  with check (public.has_org_role(id, array['owner','admin']::public.member_role[]));

create policy "orgs: owners can delete"
  on public.organizations for delete
  using (public.has_org_role(id, array['owner']::public.member_role[]));

-- -----------------------------------------------------------------------------
-- organization_members
-- -----------------------------------------------------------------------------
alter table public.organization_members enable row level security;

create policy "members: read within own orgs"
  on public.organization_members for select
  using (public.is_org_member(org_id));

create policy "members: owners/admins manage"
  on public.organization_members for insert
  with check (public.has_org_role(org_id, array['owner','admin']::public.member_role[]));

create policy "members: owners/admins update"
  on public.organization_members for update
  using (public.has_org_role(org_id, array['owner','admin']::public.member_role[]));

create policy "members: owners/admins or self remove"
  on public.organization_members for delete
  using (
    public.has_org_role(org_id, array['owner','admin']::public.member_role[])
    or user_id = auth.uid()
  );

-- -----------------------------------------------------------------------------
-- ventures
-- -----------------------------------------------------------------------------
alter table public.ventures enable row level security;

create policy "ventures: members read"
  on public.ventures for select
  using (public.is_org_member(org_id));

create policy "ventures: members create"
  on public.ventures for insert
  with check (public.is_org_member(org_id) and created_by = auth.uid());

create policy "ventures: members update"
  on public.ventures for update
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));

create policy "ventures: owners/admins delete"
  on public.ventures for delete
  using (public.has_org_role(org_id, array['owner','admin']::public.member_role[]));

-- -----------------------------------------------------------------------------
-- Child tables: tasks, transactions, notes, documents
-- (access follows the parent venture's organization)
-- -----------------------------------------------------------------------------
alter table public.tasks enable row level security;

create policy "tasks: members read"
  on public.tasks for select using (public.can_access_venture(venture_id));
create policy "tasks: members create"
  on public.tasks for insert with check (public.can_access_venture(venture_id) and created_by = auth.uid());
create policy "tasks: members update"
  on public.tasks for update using (public.can_access_venture(venture_id)) with check (public.can_access_venture(venture_id));
create policy "tasks: members delete"
  on public.tasks for delete using (public.can_access_venture(venture_id));

alter table public.transactions enable row level security;

create policy "txns: members read"
  on public.transactions for select using (public.can_access_venture(venture_id));
create policy "txns: members create"
  on public.transactions for insert with check (public.can_access_venture(venture_id) and created_by = auth.uid());
create policy "txns: members update"
  on public.transactions for update using (public.can_access_venture(venture_id)) with check (public.can_access_venture(venture_id));
create policy "txns: members delete"
  on public.transactions for delete using (public.can_access_venture(venture_id));

alter table public.notes enable row level security;

create policy "notes: members read"
  on public.notes for select using (public.can_access_venture(venture_id));
create policy "notes: members create"
  on public.notes for insert with check (public.can_access_venture(venture_id) and created_by = auth.uid());
create policy "notes: members update"
  on public.notes for update using (public.can_access_venture(venture_id)) with check (public.can_access_venture(venture_id));
create policy "notes: members delete"
  on public.notes for delete using (public.can_access_venture(venture_id));

alter table public.documents enable row level security;

create policy "docs: members read"
  on public.documents for select using (public.can_access_venture(venture_id));
create policy "docs: members create"
  on public.documents for insert with check (public.can_access_venture(venture_id) and uploaded_by = auth.uid());
create policy "docs: members delete"
  on public.documents for delete using (public.can_access_venture(venture_id));

-- -----------------------------------------------------------------------------
-- Storage: 'vault' bucket for venture documents
-- Files are stored under  {venture_id}/{filename}; access mirrors venture access.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('vault', 'vault', false)
on conflict (id) do nothing;

create policy "vault: members read"
  on storage.objects for select
  using (
    bucket_id = 'vault'
    and public.can_access_venture((split_part(name, '/', 1))::uuid)
  );

create policy "vault: members upload"
  on storage.objects for insert
  with check (
    bucket_id = 'vault'
    and public.can_access_venture((split_part(name, '/', 1))::uuid)
  );

create policy "vault: members delete"
  on storage.objects for delete
  using (
    bucket_id = 'vault'
    and public.can_access_venture((split_part(name, '/', 1))::uuid)
  );

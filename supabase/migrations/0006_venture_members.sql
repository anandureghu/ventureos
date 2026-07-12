-- =============================================================================
-- VentureOS — Migration 0006: Venture-specific members
-- Assign workspace members to individual ventures. Org owners/admins see all.
-- =============================================================================

create type public.venture_member_role as enum ('lead', 'member');

create table public.venture_members (
  id          uuid primary key default gen_random_uuid(),
  venture_id  uuid not null references public.ventures(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        public.venture_member_role not null default 'member',
  created_at  timestamptz not null default now(),
  unique (venture_id, user_id)
);

create index venture_members_venture_idx on public.venture_members(venture_id);
create index venture_members_user_idx on public.venture_members(user_id);

-- User can access a venture if they are an org member AND:
--   • org owner/admin, OR
--   • listed on venture_members, OR
--   • venture has no members yet (legacy / open until restricted)
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
    join public.organization_members om
      on om.org_id = v.org_id and om.user_id = auth.uid()
    where v.id = _venture
      and (
        om.role in ('owner', 'admin')
        or exists (
          select 1
          from public.venture_members vm
          where vm.venture_id = v.id and vm.user_id = auth.uid()
        )
        or not exists (
          select 1 from public.venture_members vm where vm.venture_id = v.id
        )
      )
  );
$$;

-- Lead on the venture or org owner/admin may manage venture membership
create or replace function public.can_manage_venture_members(_venture uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.ventures v
    join public.organization_members om
      on om.org_id = v.org_id and om.user_id = auth.uid()
    where v.id = _venture
      and (
        om.role in ('owner', 'admin')
        or exists (
          select 1
          from public.venture_members vm
          where vm.venture_id = v.id
            and vm.user_id = auth.uid()
            and vm.role = 'lead'
        )
      )
  );
$$;

-- New ventures: creator becomes venture lead
create or replace function public.handle_new_venture()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.venture_members (venture_id, user_id, role)
  values (new.id, new.created_by, 'lead');
  return new;
end;
$$;

create trigger on_venture_created
  after insert on public.ventures
  for each row execute function public.handle_new_venture();

-- Backfill existing ventures: add all workspace members so behavior is unchanged
insert into public.venture_members (venture_id, user_id, role)
select v.id, om.user_id,
  case
    when om.user_id = v.created_by then 'lead'::public.venture_member_role
    when om.user_id = v.owner_id then 'lead'::public.venture_member_role
    else 'member'::public.venture_member_role
  end
from public.ventures v
join public.organization_members om on om.org_id = v.org_id
on conflict (venture_id, user_id) do nothing;

-- -----------------------------------------------------------------------------
-- RLS: venture_members
-- -----------------------------------------------------------------------------
alter table public.venture_members enable row level security;

create policy "venture_members: read if venture accessible"
  on public.venture_members for select
  using (public.can_access_venture(venture_id));

create policy "venture_members: managers insert"
  on public.venture_members for insert
  with check (public.can_manage_venture_members(venture_id));

create policy "venture_members: managers update"
  on public.venture_members for update
  using (public.can_manage_venture_members(venture_id));

create policy "venture_members: managers delete"
  on public.venture_members for delete
  using (public.can_manage_venture_members(venture_id));

-- -----------------------------------------------------------------------------
-- RLS: tighten ventures read to match can_access_venture
-- -----------------------------------------------------------------------------
drop policy if exists "ventures: members read" on public.ventures;

create policy "ventures: accessible read"
  on public.ventures for select
  using (public.can_access_venture(id));

drop policy if exists "ventures: members update" on public.ventures;

create policy "ventures: accessible update"
  on public.ventures for update
  using (public.can_access_venture(id))
  with check (public.can_access_venture(id));

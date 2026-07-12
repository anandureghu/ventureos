-- =============================================================================
-- VentureOS — Migration 0008: External venture guests
-- Workspace members access all ventures in their workspace.
-- Third parties (not in workspace) get venture-only access via venture_members.
-- =============================================================================

-- Access: workspace member OR explicit venture guest (no workspace required)
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
    where v.id = _venture
      and (
        public.is_org_member(v.org_id)
        or exists (
          select 1
          from public.venture_members vm
          where vm.venture_id = v.id
            and vm.user_id = auth.uid()
        )
      )
  );
$$;

-- Managers: workspace owner/admin OR venture lead (including external leads)
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
    where v.id = _venture
      and (
        public.has_org_role(v.org_id, array['owner','admin']::public.member_role[])
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

-- Invite a third party by email — must NOT already belong to the venture's workspace
create or replace function public.add_venture_guest_by_email(
  _venture uuid,
  _email text,
  _role public.venture_member_role default 'member'
)
returns public.venture_members
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user uuid;
  venture_org uuid;
  result public.venture_members;
begin
  if not public.can_manage_venture_members(_venture) then
    raise exception 'You cannot manage collaborators on this venture';
  end if;

  select org_id into venture_org
  from public.ventures
  where id = _venture;

  if venture_org is null then
    raise exception 'Venture not found';
  end if;

  select id into target_user
  from public.profiles
  where lower(email) = lower(_email)
  limit 1;

  if target_user is null then
    raise exception 'No VentureOS user found with email %. Ask them to sign in once first.', _email;
  end if;

  if exists (
    select 1
    from public.organization_members
    where org_id = venture_org and user_id = target_user
  ) then
    raise exception 'This person is already in the workspace — workspace members can access all ventures.';
  end if;

  insert into public.venture_members (venture_id, user_id, role)
  values (_venture, target_user, _role)
  on conflict (venture_id, user_id) do update set role = excluded.role
  returning * into result;

  return result;
end;
$$;

grant execute on function public.add_venture_guest_by_email(uuid, text, public.venture_member_role)
  to authenticated;

-- Allow managers to add external profiles (not workspace members)
drop policy if exists "venture_members: managers insert" on public.venture_members;

create policy "venture_members: managers insert"
  on public.venture_members for insert
  with check (
    public.can_manage_venture_members(venture_id)
    and not exists (
      select 1
      from public.venture_members vm
      where vm.venture_id = venture_members.venture_id
        and vm.user_id = venture_members.user_id
    )
    and not exists (
      select 1
      from public.ventures v
      join public.organization_members om
        on om.org_id = v.org_id and om.user_id = venture_members.user_id
      where v.id = venture_members.venture_id
    )
  );

-- Venture guests can read collaborator profiles on the same venture
drop policy if exists "profiles: read self and co-members" on public.profiles;

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
    or exists (
      select 1
      from public.venture_members me
      join public.venture_members them on them.venture_id = me.venture_id
      where me.user_id = auth.uid()
        and them.user_id = public.profiles.id
    )
  );

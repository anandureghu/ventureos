-- =============================================================================
-- VentureOS — Migration 0004: Self-heal missing workspaces
-- Users who signed in before migrations (or if handle_new_user missed) get a
-- workspace on first app load instead of bouncing between /login and /dashboard.
-- =============================================================================

create or replace function public.bootstrap_my_workspace()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  existing_org uuid;
  display_name text;
  new_org_id uuid;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select org_id
  into existing_org
  from public.organization_members
  where user_id = uid
  order by created_at asc
  limit 1;

  if existing_org is not null then
    return existing_org;
  end if;

  select coalesce(full_name, split_part(email, '@', 1))
  into display_name
  from public.profiles
  where id = uid;

  if display_name is null then
    select coalesce(
      raw_user_meta_data->>'full_name',
      raw_user_meta_data->>'name',
      split_part(email, '@', 1),
      'My'
    )
    into display_name
    from auth.users
    where id = uid;
  end if;

  insert into public.profiles (id, email, full_name, avatar_url)
  select
    id,
    email,
    coalesce(
      raw_user_meta_data->>'full_name',
      raw_user_meta_data->>'name',
      split_part(email, '@', 1)
    ),
    raw_user_meta_data->>'avatar_url'
  from auth.users
  where id = uid
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name),
        avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);

  insert into public.organizations (name, created_by)
  values (display_name || '''s Workspace', uid)
  returning id into new_org_id;

  insert into public.organization_members (org_id, user_id, role)
  values (new_org_id, uid, 'owner');

  return new_org_id;
end;
$$;

grant execute on function public.bootstrap_my_workspace() to authenticated;

-- =============================================================================
-- VentureOS — Migration 0005: Create additional workspaces
-- Lets a user spin up a new organization and become its owner.
-- =============================================================================

create or replace function public.create_workspace(_name text)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  trimmed text;
  result public.organizations;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  trimmed := trim(_name);
  if trimmed = '' then
    raise exception 'Workspace name is required';
  end if;

  insert into public.organizations (name, created_by)
  values (trimmed, uid)
  returning * into result;

  insert into public.organization_members (org_id, user_id, role)
  values (result.id, uid, 'owner');

  return result;
end;
$$;

grant execute on function public.create_workspace(text) to authenticated;

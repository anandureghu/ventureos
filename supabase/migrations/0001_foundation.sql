-- =============================================================================
-- VentureOS — Migration 0001: Foundation
-- Profiles, organizations, membership, and shared helper functions/triggers.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Shared: updated_at trigger function
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- profiles  (mirrors auth.users, holds public-facing user data)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- organizations  (a workspace shared by co-founders)
-- -----------------------------------------------------------------------------
create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text,
  created_by  uuid not null references public.profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- organization_members  (who belongs to which workspace + role)
-- -----------------------------------------------------------------------------
create type public.member_role as enum ('owner', 'admin', 'member');

create table public.organization_members (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        public.member_role not null default 'member',
  created_at  timestamptz not null default now(),
  unique (org_id, user_id)
);

create index organization_members_user_idx on public.organization_members(user_id);
create index organization_members_org_idx  on public.organization_members(org_id);

-- -----------------------------------------------------------------------------
-- Membership helpers (SECURITY DEFINER bypasses RLS to avoid recursive policies)
-- -----------------------------------------------------------------------------
create or replace function public.is_org_member(_org uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.org_id = _org
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.has_org_role(_org uuid, _roles public.member_role[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.org_id = _org
      and m.user_id = auth.uid()
      and m.role = any(_roles)
  );
$$;

-- -----------------------------------------------------------------------------
-- New-user bootstrap: create a profile, a starter workspace, and owner membership
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  display_name text;
begin
  display_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    display_name,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(profiles.full_name, excluded.full_name),
        avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url);

  insert into public.organizations (name, created_by)
  values (display_name || '''s Workspace', new.id)
  returning id into new_org_id;

  insert into public.organization_members (org_id, user_id, role)
  values (new_org_id, new.id, 'owner');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- add_member_by_email: invite an existing user (by email) into a workspace.
-- Only owners/admins of the org may call this. Co-founder onboarding made easy.
-- -----------------------------------------------------------------------------
create or replace function public.add_member_by_email(
  _org uuid,
  _email text,
  _role public.member_role default 'member'
)
returns public.organization_members
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user uuid;
  result public.organization_members;
begin
  if not public.has_org_role(_org, array['owner','admin']::public.member_role[]) then
    raise exception 'Only owners or admins can add members';
  end if;

  select id into target_user
  from public.profiles
  where lower(email) = lower(_email)
  limit 1;

  if target_user is null then
    raise exception 'No VentureOS user found with email %. Ask them to sign in once first.', _email;
  end if;

  insert into public.organization_members (org_id, user_id, role)
  values (_org, target_user, _role)
  on conflict (org_id, user_id) do update set role = excluded.role
  returning * into result;

  return result;
end;
$$;

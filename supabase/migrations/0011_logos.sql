-- =============================================================================
-- VentureOS — Migration 0011: Workspace and venture logos
-- Public storage buckets so logos render as plain image URLs (same model as
-- profiles.avatar_url from Google). Only writes are RLS-gated.
-- =============================================================================

alter table public.organizations add column logo_url text;
alter table public.ventures add column logo_url text;

insert into storage.buckets (id, name, public)
values ('org-logos', 'org-logos', true), ('venture-logos', 'venture-logos', true)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- org-logos: path is {org_id}/logo.{ext} — writer must be owner/admin of that org
-- -----------------------------------------------------------------------------
create policy "org-logos: managers upload"
  on storage.objects for insert
  with check (
    bucket_id = 'org-logos'
    and public.has_org_role(
      (split_part(name, '/', 1))::uuid,
      array['owner','admin']::public.member_role[]
    )
  );

create policy "org-logos: managers update"
  on storage.objects for update
  using (
    bucket_id = 'org-logos'
    and public.has_org_role(
      (split_part(name, '/', 1))::uuid,
      array['owner','admin']::public.member_role[]
    )
  );

create policy "org-logos: managers delete"
  on storage.objects for delete
  using (
    bucket_id = 'org-logos'
    and public.has_org_role(
      (split_part(name, '/', 1))::uuid,
      array['owner','admin']::public.member_role[]
    )
  );

-- -----------------------------------------------------------------------------
-- venture-logos: path is {venture_id}/logo.{ext} — writer must be owner/admin
-- of the venture's workspace
-- -----------------------------------------------------------------------------
create policy "venture-logos: managers upload"
  on storage.objects for insert
  with check (
    bucket_id = 'venture-logos'
    and exists (
      select 1 from public.ventures v
      where v.id = (split_part(name, '/', 1))::uuid
        and public.has_org_role(v.org_id, array['owner','admin']::public.member_role[])
    )
  );

create policy "venture-logos: managers update"
  on storage.objects for update
  using (
    bucket_id = 'venture-logos'
    and exists (
      select 1 from public.ventures v
      where v.id = (split_part(name, '/', 1))::uuid
        and public.has_org_role(v.org_id, array['owner','admin']::public.member_role[])
    )
  );

create policy "venture-logos: managers delete"
  on storage.objects for delete
  using (
    bucket_id = 'venture-logos'
    and exists (
      select 1 from public.ventures v
      where v.id = (split_part(name, '/', 1))::uuid
        and public.has_org_role(v.org_id, array['owner','admin']::public.member_role[])
    )
  );

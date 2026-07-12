-- =============================================================================
-- VentureOS — Migration 0007: Venture members must be workspace members
-- Only organization_members can be added to a venture (not already on it).
-- =============================================================================

drop policy if exists "venture_members: managers insert" on public.venture_members;

create policy "venture_members: managers insert"
  on public.venture_members for insert
  with check (
    public.can_manage_venture_members(venture_id)
    and exists (
      select 1
      from public.ventures v
      join public.organization_members om
        on om.org_id = v.org_id and om.user_id = venture_members.user_id
      where v.id = venture_members.venture_id
    )
    and not exists (
      select 1
      from public.venture_members vm
      where vm.venture_id = venture_members.venture_id
        and vm.user_id = venture_members.user_id
    )
  );

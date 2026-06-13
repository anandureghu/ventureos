---
name: ventureos-migrations
description: >-
  Adds and reviews Supabase SQL migrations for VentureOS: schema changes, RLS
  policies, SECURITY DEFINER RPCs, and type updates. Use when changing the
  database, adding tables/columns, RLS, RPCs, or running supabase db push.
---

# VentureOS Migrations

## Workflow

```
1. Identify next number (e.g. 0006 after 0005)
2. Create supabase/migrations/NNNN_short_name.sql
3. Add RLS + policies for new tables
4. Grant execute on new RPCs to authenticated
5. Update src/lib/types.ts if app uses new shapes
6. Tell user to run: `npm run supabase:db:push`

For initial project setup or auth/Google OAuth, use the **supabase-master** skill instead.
```

## Migration file template

```sql
-- =============================================================================
-- VentureOS — Migration NNNN: Short description
-- =============================================================================

-- DDL here

-- RLS
alter table public.my_table enable row level security;

create policy "my_table: members read"
  on public.my_table for select
  using (public.is_org_member(org_id));

-- RPC (if needed)
create or replace function public.my_rpc(...)
returns ...
language plpgsql
security definer
set search_path = public
as $$ ... $$;

grant execute on function public.my_rpc(...) to authenticated;
```

## RLS patterns (reuse helpers)

| Scope | Helper | Policy pattern |
|-------|--------|----------------|
| Org row | `is_org_member(org_id)` | select/insert/update |
| Org admin action | `has_org_role(org_id, array['owner','admin'])` | update/delete members |
| Venture child | `can_access_venture(venture_id)` | all CRUD on tasks, notes, etc. |

Helpers defined in `0001_foundation.sql` and `0003_rls.sql`. Do not duplicate inline membership subqueries.

## Existing migrations

| File | Contents |
|------|----------|
| `0001_foundation.sql` | profiles, orgs, members, triggers, `add_member_by_email` |
| `0002_ventures.sql` | ventures + child tables |
| `0003_rls.sql` | RLS on all tables |
| `0004_bootstrap_workspace.sql` | `bootstrap_my_workspace` |
| `0005_create_workspace.sql` | `create_workspace` |

## Rules

- **Never modify** migrations already applied in production — add a new file.
- One logical change per migration when possible.
- New venture-scoped tables: `venture_id uuid references ventures(id) on delete cascade`.
- New org-scoped tables: `org_id uuid references organizations(id) on delete cascade`.

## After migration

1. Update `src/lib/types.ts` with new interfaces/enums.
2. Wire app code to use new columns via `getSession()` + scoped queries.
3. Run `npm run build` to verify types.

## Apply locally / remote

```bash
supabase link --project-ref YOUR_REF   # once
supabase db push                       # apply pending migrations
```

Or paste SQL into Supabase dashboard → SQL Editor (in order).

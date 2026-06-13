---
name: ventureos-workspaces
description: >-
  Implements and extends VentureOS multi-workspace (organization) features:
  switching, creating workspaces, invites, org-scoped queries, and cookie-based
  active org. Use when the user mentions workspaces, organizations, switching
  teams, inviting members, multi-tenant access, or org isolation.
---

# VentureOS Workspaces

## Architecture

- DB: `organizations`, `organization_members` (roles: `owner`, `admin`, `member`)
- App: `getSession()` returns `{ org, role, orgs }` — `org` is the **active** workspace
- Cookie: `ventureos_active_org` (`src/lib/workspace.ts`)
- UI: `WorkspaceSwitcher` in `Sidebar`

## Checklist for workspace-related changes

```
- [ ] Queries filter by session.org.id
- [ ] Detail pages verify resource belongs to active org
- [ ] Invite/admin actions check role (owner or admin)
- [ ] Switch/create use API routes (set cookie server-side)
- [ ] Sidebar receives orgs + activeOrgId if UI changes
```

## Switch workspace

POST `/api/workspace/switch` with `{ orgId }`:
1. Verify user is member of `orgId`
2. Set `ventureos_active_org` cookie
3. Client: `router.push("/dashboard")` + `router.refresh()`

## Create workspace

POST `/api/workspace/create` with `{ name }`:
1. Call RPC `create_workspace(_name)` (migration `0005_create_workspace.sql`)
2. Set cookie to new org id
3. Refresh UI

Requires migration `0005_create_workspace.sql` applied on Supabase.

## Invite member

- Component: `src/components/InviteMember.tsx`
- RPC: `add_member_by_email(_org, _email, _role)` — target must have signed in once
- Invite is scoped to **current active workspace** (`orgId` prop from session)

## Common mistakes

| Mistake | Fix |
|---------|-----|
| `limit(1)` on memberships without cookie | Use `getSession()` pattern in `data.ts` |
| Venture visible across workspaces | Add `venture.org_id === org.id` guard |
| Client sets cookie directly | Use `/api/workspace/switch` route |
| Raw insert into `organizations` | Use `create_workspace` RPC |

## Key files

- `src/lib/data.ts` — session resolution
- `src/lib/workspace.ts` — cookie constant
- `src/components/WorkspaceSwitcher.tsx`
- `src/app/api/workspace/switch/route.ts`
- `src/app/api/workspace/create/route.ts`
- `supabase/migrations/0001_foundation.sql` — `add_member_by_email`
- `supabase/migrations/0005_create_workspace.sql` — `create_workspace`

## Reference

See [.cursor/rules/multi-workspace.mdc](../../rules/multi-workspace.mdc) for rule summary.

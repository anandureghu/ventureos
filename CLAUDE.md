# VentureOS — Claude Code Instructions

This file guides Claude Code (and similar CLI agents) in the VentureOS repo.

## Read first

- **AGENTS.md** — full architecture and conventions
- **.cursor/rules/** — focused rules (core, Next.js, Supabase SQL, multi-workspace)
- **.cursor/skills/** — step-by-step workflows for common tasks

## Project summary

Next.js 16 + Supabase portfolio app for founders. Ventures are org-scoped. Users switch workspaces via sidebar; active org is cookie `ventureos_active_org`.

## Hard rules

1. **Scope changes minimally** — no drive-by refactors.
2. **Always use `getSession()`** for server-side auth/org context.
3. **Filter by `org_id`** on all venture and workspace queries in the app layer.
4. **New DB changes** → new numbered migration + RLS; never edit old migrations.
5. **No git operations** unless the user explicitly requests them.
6. **No secrets** in code or commits.

## Common tasks

| Task | Where to look |
|------|---------------|
| Add a page | `src/app/(app)/` |
| Session / org | `src/lib/data.ts` |
| Workspace switch | `src/app/api/workspace/`, `WorkspaceSwitcher.tsx` |
| Invite member | `InviteMember.tsx`, RPC `add_member_by_email` |
| New table/column | `supabase/migrations/`, then `src/lib/types.ts` |
| Styling | `globals.css` + Tailwind `ink-*` / `signal-*` tokens |

## Skills (invoke when relevant)

- `supabase-master` — CLI setup, config push, Google OAuth, migrations sync
- `ventureos-workspaces` — multi-tenant workspace changes
- `ventureos-migrations` — Supabase schema migrations
- `ventureos-features` — new venture UI or domain features

## Verify before finishing

```bash
npm run build
```

Fix TypeScript errors. Run `npm run lint` if you touched many files.

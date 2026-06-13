# VentureOS — Agent Guide

Instructions for AI agents (Cursor, Claude Code, etc.) working in this repository.

## What this is

VentureOS is a founder portfolio app: track multiple business ideas (ventures) with lifecycle stages, kanban tasks, financials, notes, and calculators. Multi-tenant workspaces let founders run separate businesses with different teams.

**Stack:** Next.js 16 (App Router) · Supabase (Postgres + RLS) · Tailwind · Google OAuth

## Before you change code

1. Read `.cursor/rules/` — project rules auto-apply in Cursor.
2. Use `.cursor/skills/` for focused workflows (migrations, workspaces, new features).
3. Prefer minimal diffs; match existing file structure and naming.
4. Do not commit, push, or open PRs unless the user asks.

## Architecture

```
Browser → proxy.ts (session refresh) → App Router pages
              ↓
         getSession() → active org (cookie) + role
              ↓
         Supabase queries scoped by org_id (RLS enforces at DB layer)
```

### Important files

| File | Role |
|------|------|
| `src/lib/data.ts` | `getSession()`, `getMembers()` — central session |
| `src/lib/types.ts` | Hand-written TypeScript types |
| `src/lib/workspace.ts` | Active org cookie constant |
| `src/app/(app)/layout.tsx` | App shell + sidebar |
| `supabase/migrations/` | Schema source of truth |
| `supabase/config.toml` | Auth + Google OAuth (config push) |
| `scripts/supabase-setup.sh` | `npm run supabase:setup` |

### Data model (short)

- `profiles` — user public data
- `organizations` + `organization_members` — workspaces and roles
- `ventures` — projects (org-scoped)
- `tasks`, `transactions`, `notes`, `documents` — venture children

## Multi-workspace rules

- Every user can belong to multiple organizations.
- Active workspace stored in cookie `ventureos_active_org`.
- All list/detail pages must use `session.org.id` — invited users only see their current workspace's ventures.
- Team invites (`add_member_by_email`) apply to the **active** workspace only.

## UI conventions

- Dark theme; utility classes in `src/app/globals.css`: `panel`, `btn-primary`, `btn-ghost`, `field`, `chip`, `eyebrow`.
- Server Components for data fetching; `"use client"` only for interactivity.
- Live data pages: `export const dynamic = "force-dynamic"`.

## Database changes

1. Add numbered migration in `supabase/migrations/`.
2. Include RLS policies for new tables.
3. Use SECURITY DEFINER RPCs for privileged operations.
4. Update `src/lib/types.ts` when the app needs new shapes.
5. Run `npm run supabase:db:push` (not dashboard SQL editor).

## Supabase setup (auth, Google OAuth)

Manage from repo via **supabase-master** skill (`.cursor/skills/supabase-master/`):

```bash
cp .env.example .env.local   # GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SUPABASE_PROJECT_REF
supabase login
npm run supabase:setup       # db push + config push
```

Google credentials and redirect URLs live in `supabase/config.toml` — avoid Supabase dashboard for providers.

## Commands

```bash
npm run dev      # local dev (port 3000)
npm run build    # typecheck + production build
npm run lint     # eslint
```

## Env vars (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Never commit `.env` or secrets.

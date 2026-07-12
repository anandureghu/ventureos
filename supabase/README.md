# Supabase — VentureOS

Manage the hosted Supabase project from this repo (schema, auth, Google OAuth).

## Quick setup

```bash
cp .env.example .env.local
# Fill in: Supabase URL/anon key, project ref, Google client ID + secret

npm i -g supabase   # or brew install supabase/tap/supabase
supabase login

npm run supabase:setup
```

`supabase:setup` runs `db push` (migrations) + `config push` (auth, Google provider, redirect URLs).

## One-time: Google Cloud Console

OAuth client type: **Web application**

| Field | Value |
|-------|--------|
| Authorized redirect URI | `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback` |

Get client ID and secret → put in `.env.local` as `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

## Redirect URL flow

```
App sign-in → Supabase Auth → Google → Supabase callback → App /auth/callback
              (config.toml)            (/auth/v1/callback)   (additional_redirect_urls)
```

- **Google Cloud** needs the Supabase callback (`/auth/v1/callback`).
- **Supabase** allow-list is in `config.toml` → `additional_redirect_urls` (app `/auth/callback`).

Add production app URL to `additional_redirect_urls` in `config.toml`, then `npm run supabase:config:push`.

## Migrations

| File | Purpose |
|------|---------|
| `0001_foundation.sql` | profiles, orgs, members, triggers, `add_member_by_email` |
| `0002_ventures.sql` | ventures + tasks, transactions, notes, documents |
| `0003_rls.sql` | RLS + `vault` storage bucket |
| `0004_bootstrap_workspace.sql` | `bootstrap_my_workspace` |
| `0005_create_workspace.sql` | `create_workspace` |

```bash
npm run supabase:db:push          # apply pending migrations
npm run supabase:migration:list   # local vs remote status
```

## Config as code

`config.toml` controls auth for local dev and remote (`config push`):

- `site_url` → `env(NEXT_PUBLIC_SITE_URL)`
- Google → `env(GOOGLE_CLIENT_ID)`, `env(GOOGLE_CLIENT_SECRET)`
- Storage bucket `vault` for local parity with migration `0003`

**Do not** use env var names starting with `SUPABASE_` in `config.toml` `env()` — CLI skips them.

## npm scripts

| Script | Command |
|--------|---------|
| `supabase:setup` | Link (if needed) + db push + config push |
| `supabase:db:push` | Push migrations only |
| `supabase:config:push` | Push auth/config only |
| `supabase:migration:list` | Show migration sync status |
| `supabase:login` | Authenticate CLI |

## Skill & rule

Agents: use `.cursor/skills/supabase-master/` and `.cursor/rules/supabase-master.mdc`.

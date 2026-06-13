---
name: supabase-master
description: >-
  Sets up and manages VentureOS Supabase from the repo: CLI login/link, db push,
  config push, Google OAuth via config.toml, env vars, migrations, and redirect
  URLs. Use when configuring Supabase, auth providers, Google sign-in, migrations,
  config.toml, supabase db push, or replacing dashboard setup with code.
---

# Supabase Master (VentureOS)

## Philosophy

Configure Supabase **from the repo**, not the Supabase dashboard:
- Schema → migrations + `db push`
- Auth, Google OAuth, redirect URLs → `config.toml` + `config push`
- Secrets → `.env.local` referenced via `env()` in config.toml

Exception: **Google Cloud Console** requires one manual step — add the Supabase callback redirect URI.

## First-time setup checklist

```
- [ ] cp .env.example → .env.local
- [ ] Fill NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SITE_URL
- [ ] Fill SUPABASE_PROJECT_REF
- [ ] Create Google OAuth Web client; add redirect URI (see below)
- [ ] Fill GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- [ ] supabase login
- [ ] npm run supabase:setup
- [ ] npm run dev → test Google sign-in
```

## Commands

| Task | Command |
|------|---------|
| Full setup | `npm run supabase:setup` |
| Migrations only | `npm run supabase:db:push` |
| Auth/config only | `npm run supabase:config:push` |
| Migration status | `npm run supabase:migration:list` |
| Link project | `supabase link --project-ref $SUPABASE_PROJECT_REF` |

Script: `scripts/supabase-setup.sh` (loads `.env.local`, validates vars, pushes all).

## Google OAuth — two redirect URLs

| Where | URL | Purpose |
|-------|-----|---------|
| Google Cloud Console | `https://<ref>.supabase.co/auth/v1/callback` | Google → Supabase |
| `config.toml` `additional_redirect_urls` | `http://localhost:3000/auth/callback` | Supabase → Next.js app |

App sign-in uses `NEXT_PUBLIC_SITE_URL/auth/callback` (`GoogleButton.tsx`).

## config.toml (auth)

```toml
[auth]
site_url = "env(NEXT_PUBLIC_SITE_URL)"
additional_redirect_urls = ["http://localhost:3000/auth/callback", ...]

[auth.external.google]
enabled = true
client_id = "env(GOOGLE_CLIENT_ID)"
secret = "env(GOOGLE_CLIENT_SECRET)"
```

After edits: `npm run supabase:config:push`.

## Migrations

Files: `supabase/migrations/0001` … `0005` (see `supabase/README.md`).

```
1. Create NNNN_description.sql (RLS + grants for new objects)
2. npm run supabase:db:push
3. npm run supabase:migration:list  # verify Local = Remote
4. Update src/lib/types.ts if app needs new shapes
```

Never edit applied migrations — add a new file.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `invalid_client` on Google sign-in | Check GOOGLE_CLIENT_ID/SECRET in .env.local; run `config push` |
| Redirect mismatch | Add exact URL to `additional_redirect_urls`; config push |
| Env ignored in config.toml | Don't use `SUPABASE_` prefix in `env()` names |
| Missing workspace after login | Ensure migrations 0001+0004 applied (`migration list`) |
| `create_workspace` fails | Apply migration 0005 |

## Key files

- `supabase/config.toml` — auth + Google + storage buckets
- `supabase/migrations/` — schema + RLS
- `scripts/supabase-setup.sh` — one-command setup
- `.env.example` — required variables
- `supabase/README.md` — human setup guide

## Production

1. Add production `https://yourdomain.com/auth/callback` to `additional_redirect_urls` in config.toml
2. Set `NEXT_PUBLIC_SITE_URL` for production deploy
3. `npm run supabase:config:push`

Do not commit `.env.local` or secrets.

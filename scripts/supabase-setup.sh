#!/usr/bin/env bash
# VentureOS — push Supabase schema + auth config from the repo.
# Prerequisites: supabase CLI, `supabase login`, .env.local filled in.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env.local}"
if [[ ! -f "$ENV_FILE" && -f .env ]]; then
  ENV_FILE=".env"
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE — copy .env.example to .env.local and fill in values."
  exit 1
fi

# Export vars for supabase CLI env() substitution in config.toml
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

require_var() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing $name in $ENV_FILE"
    exit 1
  fi
}

require_var NEXT_PUBLIC_SUPABASE_URL
require_var NEXT_PUBLIC_SUPABASE_ANON_KEY
require_var NEXT_PUBLIC_SITE_URL
require_var GOOGLE_CLIENT_ID
require_var GOOGLE_CLIENT_SECRET

PROJECT_REF="${SUPABASE_PROJECT_REF:-}"
if [[ -z "$PROJECT_REF" && -f supabase/.temp/project-ref ]]; then
  PROJECT_REF="$(cat supabase/.temp/project-ref)"
fi

if [[ -z "$PROJECT_REF" ]]; then
  echo "Missing SUPABASE_PROJECT_REF in $ENV_FILE (or run supabase link first)."
  exit 1
fi

SUPABASE_HOST="${NEXT_PUBLIC_SUPABASE_URL#https://}"
SUPABASE_HOST="${SUPABASE_HOST#http://}"
GOOGLE_REDIRECT_URI="https://${SUPABASE_HOST}/auth/v1/callback"

echo "==> VentureOS Supabase setup"
echo "    Project ref:  $PROJECT_REF"
echo "    Site URL:     $NEXT_PUBLIC_SITE_URL"
echo "    App callback: ${NEXT_PUBLIC_SITE_URL}/auth/callback"
echo ""
echo "    Google Cloud Console — Authorized redirect URI (one-time):"
echo "    $GOOGLE_REDIRECT_URI"
echo ""

if ! supabase projects list 2>/dev/null | grep -q "$PROJECT_REF"; then
  echo "==> Linking project $PROJECT_REF"
  if [[ -n "${SUPABASE_DB_PASSWORD:-}" ]]; then
    supabase link --project-ref "$PROJECT_REF" --password "$SUPABASE_DB_PASSWORD"
  else
    supabase link --project-ref "$PROJECT_REF"
  fi
fi

echo "==> Pushing database migrations"
supabase db push

echo "==> Pushing auth + project config (Google OAuth, redirect URLs)"
supabase config push

echo ""
echo "Done. Migrations and config are synced to Supabase."
echo "Run: npm run dev"

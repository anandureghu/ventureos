# VentureOS

**The operating system for founders running many ideas.** Track every business idea, its lifecycle stage, tasks (kanban), money in/out, knowledge, and the single next action — collaboratively, with your co-founder, in one command center.

Built with **Next.js (App Router) + Supabase + Tailwind**. Auth is **Google sign-in**. All database schema, security, and storage are defined as **SQL migrations**.

---

## What's inside

- **Command Center** — portfolio metrics (invested, revenue, net, tasks), ventures auto-ranked by a priority score, and a "where to focus today" call-out.
- **Ventures** — each idea is a mini-startup: category, lifecycle stage (Idea → Scale), execution mode (sequential / parallel), priority scoring matrix, and a next-action prompt.
- **Pipeline** — a kanban board per venture (Backlog / Research / Doing / Waiting / Completed) with tracks and assignees.
- **Financials** — per-venture ledger of expenses and revenue with live net + break-even inputs.
- **Knowledge vault** — notes, research, supplier/competitor info, and links per venture.
- **Calculators** — break-even, dropshipping, margin, SaaS (LTV/CAC), ROI.
- **Team** — multi-tenant workspaces; invite a co-founder by email. Postgres **Row Level Security** keeps each workspace's data private.

## Architecture

```
Next.js (App Router, RSC)  ──>  Supabase Postgres (RLS on every table)
        │                              │
        ├─ @supabase/ssr (cookies)     ├─ Auth (Google OAuth)
        └─ middleware (session + gate) └─ Storage bucket "vault"
```

Data model: `profiles`, `organizations`, `organization_members`, `ventures`, `tasks`, `transactions`, `notes`, `documents`. See `supabase/migrations/`.

---

## Setup

### 1. Prerequisites
- Node.js 18.18+ (or 20+)
- A free [Supabase](https://supabase.com) project
- A Google Cloud project for OAuth

### 2. Install
```bash
npm install
cp .env.example .env.local
```

### 3. Run the migrations
You have two options.

**A) Supabase CLI (recommended)**
```bash
npm i -g supabase
supabase link --project-ref YOUR_PROJECT_REF
supabase db push          # applies everything in supabase/migrations
```

**B) SQL editor**
Open the Supabase dashboard → SQL Editor, and run the files in order:
`0001_foundation.sql`, `0002_ventures.sql`, `0003_rls.sql`.

### 4. Configure Google sign-in
1. **Google Cloud Console** → APIs & Services → Credentials → *Create OAuth client ID* → Web application.
   - Authorized redirect URI:
     `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
2. **Supabase dashboard** → Authentication → Providers → **Google** → paste the Client ID and Client Secret, enable it.
3. **Supabase dashboard** → Authentication → URL Configuration:
   - Site URL: `http://localhost:3000` (and your production URL later)
   - Redirect URLs: add `http://localhost:3000/auth/callback`

### 5. Fill in `.env.local`
From Supabase → Settings → API:
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 6. Run
```bash
npm run dev
```
Open http://localhost:3000 → **Continue with Google**. Your first sign-in automatically creates a workspace (via the `handle_new_user` trigger). Go to **Team & Settings** to add your co-founder by email (they must sign in once first).

---

## How collaboration & security work

- Each user gets a personal **workspace** (organization) on first sign-in.
- Adding a partner calls the `add_member_by_email` RPC — they join the *same* workspace, so you both see the same ventures live.
- **Row Level Security** is enabled on every table. A row is only visible if you're a member of the organization that owns it (enforced by the `is_org_member` / `can_access_venture` security-definer functions, which also prevent recursive policy loops).

## Notes & next steps

This is a solid, runnable foundation that maps directly to the VentureOS vision. Natural extensions:
- Drag-and-drop kanban (swap the move buttons for `@dnd-kit`).
- Document uploads wired to the `vault` storage bucket (table + RLS already exist).
- A weekly founder review digest (aggregate query already proven on the dashboard).
- The "AI Co-Founder" layer — call an LLM with a venture's stage, tasks, and finances to suggest the next action.

If you later sell this as SaaS, the multi-tenant org model and RLS are already the right shape for it.
# ventureos

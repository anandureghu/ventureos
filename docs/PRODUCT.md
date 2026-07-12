# VentureOS — Product Overview

This document is the source of truth for what VentureOS is, why it exists, and what it needs to become to be sold as a product. It's written from day one so product, engineering, and go-to-market decisions stay aligned as the codebase grows.

---

## Mission

Give founders running more than one business idea a single, honest place to decide **what to work on today** — instead of splitting that decision across spreadsheets, notes apps, and memory.

## Vision

Every serious multi-venture founder or small founding team runs their portfolio through VentureOS the way a trader runs positions through a terminal: one screen, ranked by opportunity, with the next action always one click away. Eventually, VentureOS becomes an active advisor — not just a tracker — surfacing when a venture is stalling, when to kill it, and when to double down.

## Aim (near-term)

Be the best-in-class **portfolio command center for indie founders and small founding teams**, specifically for the "many small bets" workflow (dropshipping, 3D printing, content/SaaS side projects, etc.) that generic PM tools (Linear, Trello, Notion) don't model — they assume one product, one team, one backlog.

---

## Who it's for

- **Serial / portfolio founders** — people running 2+ ventures simultaneously who need to compare them, not just list them.
- **Small founding teams (2–5 people)** — co-founders sharing one workspace, seeing the same data live.
- **Extended collaborators** — contractors, advisors, or part-time specialists who should see *one* venture, not the whole portfolio.

Not the target: single-product teams who already have a mature PM tool — VentureOS doesn't try to out-Linear Linear.

---

## Core features

| Feature | What it does | Why it's helpful |
|---|---|---|
| **Multi-tenant workspaces** | Every user gets an organization; invite teammates by email; switch workspaces from the sidebar. | Lets a founder separate "day job" and "side ventures," or run a team, without separate accounts. |
| **Venture portfolio** | Every idea is a first-class object: category, description, lifecycle stage, execution mode. | Turns scattered ideas into a structured, comparable list instead of a notes doc. |
| **Priority scoring** | Each venture is scored 0–10 on profit potential, market demand, personal interest, affordability, speed to launch, and safety → a single 0–100 priority score. | Answers "which of my 6 ideas deserves my next hour?" with a number instead of a gut feeling. |
| **Lifecycle stages** | Idea → Research → Validation → Planning → MVP → Launch → Growth → Scale, with a visual stepper. | Forces founders to be honest about how validated an idea actually is before they sink more time in. |
| **Next action** | One always-visible sentence per venture: the single next move. | The most-used field in practice — reduces "what was I even doing with this one?" |
| **Pipeline (kanban)** | Backlog / Research / Doing / Waiting / Completed, with tracks, assignees, and sequential vs. parallel execution modes. | Execution layer once a venture is past validation — lightweight, venture-scoped, no separate tool needed. |
| **Financials** | Per-venture ledger of revenue and expenses with live net. | Founders see burn and revenue per idea, not blended across a whole business. |
| **Knowledge vault** | Notes, research, supplier/competitor info, and links per venture. | Keeps the "why" behind decisions attached to the venture instead of lost in chat history. |
| **Calculators** | Break-even, dropshipping margin, general margin, SaaS LTV/CAC, ROI. | Quick, no-spreadsheet sanity checks before committing money to a venture. |
| **Venture guests** | Invite an external collaborator (contractor, advisor) to exactly one venture, without giving them workspace-wide access. | Lets founders bring in outside help safely — the access boundary is the venture, not the org. |
| **Row Level Security (RLS)** | Every table enforces access at the Postgres layer, not just in app code. | Data isolation holds even if application code has a bug — this is what makes multi-tenancy trustworthy. |

---

## What makes it different

Generic PM tools organize work *within* one product. VentureOS organizes decisions *across* several products at once — the priority score, the portfolio view, and the "shared vs. workspace-only" access model all exist because the unit of work is "a venture," not "a task."

---

## Architecture & scalability

**Stack today:** Next.js 16 (App Router, React Server Components) · Supabase Postgres with RLS on every table · Tailwind · Google OAuth · schema as versioned SQL migrations (no dashboard drift).

Why this holds up as it grows:

- **Multi-tenancy is enforced at the database layer**, not just the app layer (`organization_members`, `venture_members`, `can_access_venture`/`can_manage_venture_members` security-definer functions). Adding customers doesn't mean auditing every query for a missing `org_id` filter — RLS is the backstop.
- **Schema-as-migrations** means every environment (local, staging, prod) can be rebuilt deterministically; no manual dashboard changes to lose track of.
- **Server Components by default** keep data fetching close to the database and avoid shipping unnecessary client JS as feature count grows.
- **Venture-level access control already exists** (workspace members vs. venture guests) — the primitive needed for future paid tiers like "invite a client to one venture" is already in the data model, not bolted on later.

What still needs to be true before this scales to many paying customers:

- **Connection pooling / read replicas** as workspace count grows — Supabase's pooler covers this initially, but should be load-tested before general availability.
- **Background jobs** (digest emails, reminders, scheduled scoring recalculation) — currently everything is request-driven; nothing runs outside a page load.
- **Rate limiting & abuse protection** on RPCs like `add_member_by_email` / `add_venture_guest_by_email` — invite-by-email endpoints are a common abuse vector (enumeration, spam invites).
- **Observability** — no logging/error-tracking/analytics pipeline yet. Needed before onboarding real customers so issues are caught before a support ticket.
- **Storage** — the `vault` bucket/table exists in schema but document upload isn't wired up yet; needed for the Knowledge feature to be complete.

---

## Productization checklist (what customers will expect)

This is the gap between "a solid runnable foundation" and "something we charge money for." Track status here as it's built:

| Area | Status | Notes |
|---|---|---|
| Billing & plans | Not started | Needs a plan model (free tier venture/workspace limits, paid tier for guests/team seats). |
| Onboarding flow | Partial | First sign-in auto-bootstraps a workspace; no guided setup, sample venture, or empty-state walkthrough beyond a single empty-state message. |
| Email notifications | Not started | No transactional email (invite received, task assigned, digest) — currently everything is silent until the user refreshes the page. |
| Audit trail | Not started | No record of who changed what — matters once external guests have write access. |
| Data export | Not started | Customers will expect to export their ventures/financials (CSV/JSON) — also a trust signal ("we don't lock you in"). |
| Backups & disaster recovery | Relies on Supabase defaults | Needs an explicit backup/retention policy documented before any paid customer's data is at stake. |
| SLA / uptime commitment | Not defined | Needed once this is sold, not given away. |
| Security review | Not done | RLS policies exist but haven't had an external security pass — worth doing before onboarding customers with sensitive financial data. |
| Terms of service / privacy policy | Not started | Required before charging anyone. |
| Support channel | Not started | Even a shared inbox is enough at first — customers will expect *some* path to a human. |

---

## Explicit non-goals (for now)

- Not a general-purpose project management tool for a single large product/team.
- Not an accounting system — the Financials ledger is a lightweight net-tracking view, not double-entry bookkeeping or tax-ready reporting.
- Not (yet) an AI advisor — see Vision above; this is a deliberate future layer, not a current promise to customers.

---

## Roadmap signals (from the codebase's own notes)

Carried over from the original README as concrete next steps, now framed against the vision above:

- Drag-and-drop kanban (currently move-buttons; `@dnd-kit` swap-in).
- Wire up document uploads to the existing `vault` storage bucket/table.
- Weekly founder review digest (the aggregate query pattern already exists on the dashboard — needs a scheduled job + email).
- "AI Co-Founder" layer — feed a venture's stage, tasks, and finances to an LLM to suggest the next action. This is the clearest path toward the long-term vision of an active advisor rather than a passive tracker.

---

*Keep this document current. When a feature ships, move it from "Roadmap" to "Core features." When a productization item is completed, update its status instead of deleting the row — the history of what wasn't there yet is useful context for later.*

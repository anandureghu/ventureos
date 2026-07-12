---
name: ventureos-features
description: >-
  Adds or extends VentureOS product features: ventures, kanban, financials,
  knowledge notes, calculators, dashboard metrics, and UI panels. Use when
  building new pages, venture workflows, founder tools, or portfolio features.
---

# VentureOS Features

## Feature map

| Feature | Page / component | Tables |
|---------|------------------|--------|
| Command Center | `src/app/(app)/dashboard/page.tsx` | `ventures`, aggregates |
| Venture list | `src/app/(app)/ventures/page.tsx` | `ventures` |
| Venture workspace | `src/app/(app)/ventures/[id]/page.tsx`, `VentureWorkspace.tsx` | `ventures`, `tasks`, `transactions`, `notes` |
| Kanban | `KanbanBoard.tsx` | `tasks` |
| Financials | `FinancialsPanel.tsx` | `transactions` |
| Knowledge | `KnowledgePanel.tsx` | `notes` |
| Calculators | `Calculators.tsx` | none (client-only math) |
| New venture | `NewVentureDialog.tsx` | `ventures` |
| Team | `settings/page.tsx`, `InviteMember.tsx` | `organization_members` |

## Adding a feature — workflow

```
1. Read existing page/component for patterns
2. getSession() → org, userId, role
3. Supabase query with .eq("org_id", org.id) or venture guard
4. Server page passes data to client component as props
5. Client mutations: createClient() + insert/update + router.refresh()
6. Use globals.css classes (panel, btn-primary, field, chip)
7. export const dynamic = "force-dynamic" on data pages
8. npm run build
```

## Venture domain types

Defined in `src/lib/types.ts`:
- `VentureCategory`, `LifecycleStage`, `VentureState`, `ExecutionMode`
- `TaskStatus`, `TaskPriority`, `TxnType`, `NoteType`
- Labels/constants in `src/lib/constants.ts` (`STAGE_LABEL`, `KANBAN_COLUMNS`, `SCORE_FACTORS`, `priorityScore()`)

## Scoring

Ventures have six 0–10 scores; `priorityScore()` in `constants.ts` returns 0–100 for ranking. Dashboard sorts by this.

## UI patterns

```tsx
// Page header
<header className="mb-6">
  <p className="eyebrow mb-1.5">{org.name}</p>
  <h1 className="font-display text-2xl font-semibold tracking-tight">Title</h1>
</header>

// Card
<div className="panel p-5">...</div>

// Form
<input className="field" />
<button className="btn-primary">Save</button>
```

## Client mutation pattern

```tsx
"use client";
const supabase = createClient();
const { error } = await supabase.from("tasks").insert({ venture_id, title, ... });
if (!error) router.refresh();
```

## Do not

- Add heavy new dependencies without user approval.
- Generate Supabase types unless user asks — keep `types.ts` hand-maintained.
- Break org isolation — every venture feature must respect active workspace.

## Extending kanban / financials / notes

Child tables use `venture_id` FK. RLS uses `can_access_venture(venture_id)`. Follow existing panel components for layout and save flows.

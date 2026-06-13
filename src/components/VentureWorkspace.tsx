"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import KanbanBoard from "@/components/KanbanBoard";
import FinancialsPanel from "@/components/FinancialsPanel";
import KnowledgePanel from "@/components/KnowledgePanel";
import {
  LIFECYCLE_ORDER,
  STAGE_LABEL,
  STAGE_ACCENT,
  SCORE_FACTORS,
  CATEGORY_LABEL,
  priorityScore
} from "@/lib/constants";
import type {
  LifecycleStage,
  Note,
  OrgMember,
  Task,
  Transaction,
  Venture,
  VentureState
} from "@/lib/types";

type Tab = "overview" | "pipeline" | "money" | "vault";

export default function VentureWorkspace({
  initialVenture,
  tasks,
  transactions,
  notes,
  members,
  userId
}: {
  initialVenture: Venture;
  tasks: Task[];
  transactions: Transaction[];
  notes: Note[];
  members: OrgMember[];
  userId: string;
}) {
  const [venture, setVenture] = useState<Venture>(initialVenture);
  const [tab, setTab] = useState<Tab>("overview");
  const supabase = createClient();

  async function patch(fields: Partial<Venture>) {
    setVenture((v) => ({ ...v, ...fields }));
    await supabase.from("ventures").update(fields).eq("id", venture.id);
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "pipeline", label: "Pipeline" },
    { key: "money", label: "Financials" },
    { key: "vault", label: "Knowledge" }
  ];

  return (
    <div>
      <header className="mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="chip mb-2">{CATEGORY_LABEL[venture.category]}</p>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              {venture.name}
            </h1>
            {venture.description && (
              <p className="mt-1 max-w-xl text-sm text-fg-muted">
                {venture.description}
              </p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="stat-num text-3xl font-semibold">{priorityScore(venture)}</p>
            <p className="eyebrow">priority score</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <StateSelect
            value={venture.state}
            onChange={(state) => patch({ state })}
          />
          <ModeToggle
            value={venture.execution_mode}
            onChange={(execution_mode) => patch({ execution_mode })}
          />
        </div>
      </header>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 border-b border-ink-500">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm transition-colors ${
              tab === t.key
                ? "border-signal-violet text-fg"
                : "border-transparent text-fg-muted hover:text-fg"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <Overview venture={venture} onPatch={patch} />
      )}
      {tab === "pipeline" && (
        <KanbanBoard
          ventureId={venture.id}
          userId={userId}
          members={members}
          initial={tasks}
        />
      )}
      {tab === "money" && (
        <FinancialsPanel
          ventureId={venture.id}
          userId={userId}
          initial={transactions}
        />
      )}
      {tab === "vault" && (
        <KnowledgePanel ventureId={venture.id} userId={userId} initial={notes} />
      )}
    </div>
  );
}

function Overview({
  venture,
  onPatch
}: {
  venture: Venture;
  onPatch: (f: Partial<Venture>) => void;
}) {
  const [nextAction, setNextAction] = useState(venture.next_action ?? "");
  const currentIdx = LIFECYCLE_ORDER.indexOf(venture.current_stage);

  return (
    <div className="space-y-5">
      {/* Lifecycle stepper */}
      <div className="panel p-5">
        <p className="eyebrow mb-3">Lifecycle stage</p>
        <div className="flex flex-wrap gap-1.5">
          {LIFECYCLE_ORDER.map((stage, i) => {
            const done = i < currentIdx;
            const current = i === currentIdx;
            return (
              <button
                key={stage}
                onClick={() => onPatch({ current_stage: stage })}
                className="flex-1 min-w-[84px] rounded-lg border px-2 py-2 text-center text-xs transition-colors"
                style={{
                  borderColor: current ? STAGE_ACCENT[stage] : "#272D3D",
                  background: current
                    ? "rgba(124,92,255,0.10)"
                    : done
                      ? "rgba(63,182,139,0.08)"
                      : "transparent",
                  color: current || done ? "#E7E9F0" : "#8A90A3"
                }}
              >
                {STAGE_LABEL[stage]}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-fg-faint">
          {venture.execution_mode === "sequential"
            ? "Sequential mode — complete each stage before moving on."
            : "Parallel mode — run several tracks at once on the Pipeline tab."}
        </p>
      </div>

      {/* Next action */}
      <div className="panel p-5">
        <p className="eyebrow mb-2 text-signal-violet">Next action</p>
        <div className="flex gap-2">
          <input
            className="field"
            placeholder="What's the single next move? e.g. Find 20 potential customers"
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            onBlur={() => onPatch({ next_action: nextAction.trim() || null })}
          />
        </div>
      </div>

      {/* Priority scoring matrix */}
      <div className="panel p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="eyebrow">Priority scoring</p>
          <span className="stat-num text-sm text-fg-muted">
            {priorityScore(venture)} / 100
          </span>
        </div>
        <div className="space-y-3">
          {SCORE_FACTORS.map((f) => (
            <div key={f.key} className="flex items-center gap-3">
              <div className="w-40 shrink-0">
                <p className="text-sm">{f.label}</p>
                <p className="text-[11px] text-fg-faint">{f.hint}</p>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                value={venture[f.key]}
                onChange={(e) => onPatch({ [f.key]: Number(e.target.value) } as Partial<Venture>)}
                className="flex-1 accent-signal-violet"
              />
              <span className="stat-num w-6 text-right text-sm">
                {venture[f.key]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StateSelect({
  value,
  onChange
}: {
  value: VentureState;
  onChange: (v: VentureState) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-fg-muted">
      State
      <select
        className="rounded-lg border border-ink-500 bg-ink-800 px-2 py-1.5 text-xs text-fg"
        value={value}
        onChange={(e) => onChange(e.target.value as VentureState)}
      >
        <option value="active">Active</option>
        <option value="paused">Paused</option>
        <option value="archived">Archived</option>
      </select>
    </label>
  );
}

function ModeToggle({
  value,
  onChange
}: {
  value: "sequential" | "parallel";
  onChange: (v: "sequential" | "parallel") => void;
}) {
  return (
    <div className="flex overflow-hidden rounded-lg border border-ink-500 text-xs">
      {(["parallel", "sequential"] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`px-2.5 py-1.5 capitalize ${
            value === m ? "bg-ink-600 text-fg" : "text-fg-muted hover:bg-ink-700"
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  );
}

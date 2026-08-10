"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import KanbanBoard from "@/components/KanbanBoard";
import FinancialsPanel from "@/components/FinancialsPanel";
import SuppliersPanel from "@/components/SuppliersPanel";
import KnowledgePanel from "@/components/KnowledgePanel";
import VentureSettings from "@/components/VentureSettings";
import StageChangeDialog, {
  createStageChangeContent,
  type ConfettiPiece
} from "@/components/StageChangeDialog";
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
  Supplier,
  Task,
  Transaction,
  Venture,
  VentureMember,
  VentureState
} from "@/lib/types";

type Tab = "overview" | "pipeline" | "money" | "suppliers" | "vault" | "settings";

// Fields editable via the buffered draft — everything else (name/description,
// managed by VentureSettings) saves immediately through its own button.
const DRAFT_KEYS = [
  "state",
  "current_stage",
  "next_action",
  "score_profit",
  "score_demand",
  "score_interest",
  "score_low_cost",
  "score_low_time",
  "score_low_risk"
] as const satisfies readonly (keyof Venture)[];

function draftDiff(draft: Venture, saved: Venture): Partial<Venture> {
  const diff: Partial<Venture> = {};
  for (const key of DRAFT_KEYS) {
    if (draft[key] !== saved[key]) {
      (diff as Record<string, unknown>)[key] = draft[key];
    }
  }
  return diff;
}

export default function VentureWorkspace({
  initialVenture,
  tasks,
  transactions,
  notes,
  members,
  ventureMembers,
  suppliers,
  canManage,
  userId
}: {
  initialVenture: Venture;
  tasks: Task[];
  transactions: Transaction[];
  notes: Note[];
  members: OrgMember[];
  ventureMembers: VentureMember[];
  suppliers: Supplier[];
  canManage: boolean;
  userId: string;
}) {
  const [venture, setVenture] = useState<Venture>(initialVenture);
  const [draft, setDraft] = useState<Venture>(initialVenture);
  const [supplierList, setSupplierList] = useState<Supplier[]>(suppliers);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [stageChange, setStageChange] = useState<{
    direction: "forward" | "backward";
    message: string;
    confetti: ConfettiPiece[];
  } | null>(null);
  const supabase = createClient();
  const toast = useToast();

  const dirty = Object.keys(draftDiff(draft, venture)).length > 0;

  function setDraftField(fields: Partial<Venture>) {
    setDraft((d) => ({ ...d, ...fields }));
  }

  function discardDraft() {
    setDraft(venture);
  }

  async function saveDraft() {
    const diff = draftDiff(draft, venture);
    if (Object.keys(diff).length === 0) return;
    const stageMoved =
      "current_stage" in diff && diff.current_stage !== venture.current_stage;
    setSaving(true);
    const { error } = await supabase.from("ventures").update(diff).eq("id", venture.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setVenture((v) => ({ ...v, ...diff }));
    if (stageMoved && diff.current_stage) {
      const fromIdx = LIFECYCLE_ORDER.indexOf(venture.current_stage);
      const toIdx = LIFECYCLE_ORDER.indexOf(diff.current_stage);
      const direction: "forward" | "backward" = toIdx > fromIdx ? "forward" : "backward";
      setStageChange({ direction, ...createStageChangeContent(direction) });
    } else {
      toast.success("Venture updated.");
    }
  }

  // Used by VentureSettings for the name/description/logo fields, which have
  // their own dialog form and show their own result dialog.
  async function saveFields(
    fields: Partial<Venture>
  ): Promise<{ ok: true } | { ok: false; message: string }> {
    const { error } = await supabase.from("ventures").update(fields).eq("id", venture.id);
    if (error) {
      return { ok: false, message: error.message };
    }
    setVenture((v) => ({ ...v, ...fields }));
    setDraft((d) => ({ ...d, ...fields }));
    return { ok: true };
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "pipeline", label: "Pipeline" },
    { key: "money", label: "Financials" },
    { key: "suppliers", label: "Suppliers" },
    { key: "vault", label: "Knowledge" },
    { key: "settings", label: "Settings" }
  ];

  return (
    <div>
      <header className="mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            {venture.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={venture.logo_url}
                alt=""
                className="mt-1 h-10 w-10 shrink-0 rounded-lg object-cover"
              />
            )}
            <div className="min-w-0">
              <p className="chip mb-2">{CATEGORY_LABEL[venture.category]}</p>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-semibold tracking-tight">
                  {venture.name}
                </h1>
                <span
                  className="chip"
                  style={{ borderColor: STAGE_ACCENT[venture.current_stage] }}
                >
                  {STAGE_LABEL[venture.current_stage]}
                </span>
              </div>
              {venture.description && (
                <p className="mt-1 max-w-xl text-sm text-fg-muted">
                  {venture.description}
                </p>
              )}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="stat-num text-3xl font-semibold">{priorityScore(draft)}</p>
            <p className="eyebrow">priority score</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <StateSelect
            value={draft.state}
            onChange={(state) => setDraftField({ state })}
          />
          <div className="ml-auto flex items-center gap-2">
            {dirty && <span className="chip text-signal-amber">Unsaved changes</span>}
            <button
              type="button"
              className="btn-ghost px-3 py-1.5 text-xs"
              onClick={discardDraft}
              disabled={!dirty || saving}
            >
              Discard
            </button>
            <button
              type="button"
              className="btn-primary px-3 py-1.5 text-xs"
              onClick={saveDraft}
              disabled={!dirty || saving}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
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

      {/* Every tab stays mounted once visited — switching tabs only hides
          them via CSS. Conditionally mounting/unmounting them here used to
          throw away each panel's local state (e.g. after a delete) and
          remount from the original server-fetched `initial` prop, making
          deleted items reappear until a full page reload. */}
      <div className={tab === "overview" ? "" : "hidden"}>
        <Overview draft={draft} onChange={setDraftField} />
      </div>
      <div className={tab === "pipeline" ? "" : "hidden"}>
        <KanbanBoard
          ventureId={venture.id}
          userId={userId}
          members={members}
          initial={tasks}
          ventureStage={venture.current_stage}
        />
      </div>
      <div className={tab === "money" ? "" : "hidden"}>
        <FinancialsPanel
          ventureId={venture.id}
          userId={userId}
          members={members}
          ventureStage={venture.current_stage}
          initial={transactions}
          suppliers={supplierList}
        />
      </div>
      <div className={tab === "suppliers" ? "" : "hidden"}>
        <SuppliersPanel
          orgId={venture.org_id}
          userId={userId}
          suppliers={supplierList}
          onChange={setSupplierList}
        />
      </div>
      <div className={tab === "vault" ? "" : "hidden"}>
        <KnowledgePanel
          ventureId={venture.id}
          userId={userId}
          ventureStage={venture.current_stage}
          initial={notes}
        />
      </div>
      <div className={tab === "settings" ? "" : "hidden"}>
        <VentureSettings
          venture={venture}
          ventureMembers={ventureMembers}
          orgMembers={members}
          canManage={canManage}
          onSave={saveFields}
        />
      </div>

      <StageChangeDialog
        open={!!stageChange}
        direction={stageChange?.direction ?? "forward"}
        message={stageChange?.message ?? ""}
        confetti={stageChange?.confetti ?? []}
        onClose={() => setStageChange(null)}
      />
    </div>
  );
}

function Overview({
  draft,
  onChange
}: {
  draft: Venture;
  onChange: (f: Partial<Venture>) => void;
}) {
  const currentIdx = LIFECYCLE_ORDER.indexOf(draft.current_stage);

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
                onClick={() => onChange({ current_stage: stage })}
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
          Changes here are buffered — click &quot;Save changes&quot; above to apply them.
        </p>
      </div>

      {/* Next action */}
      <div className="panel p-5">
        <p className="eyebrow mb-2 text-signal-violet">Next action</p>
        <div className="flex gap-2">
          <input
            className="field"
            placeholder="What's the single next move? e.g. Find 20 potential customers"
            value={draft.next_action ?? ""}
            onChange={(e) => onChange({ next_action: e.target.value })}
          />
        </div>
      </div>

      {/* Priority scoring matrix */}
      <div className="panel p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="eyebrow">Priority scoring</p>
          <span className="stat-num text-sm text-fg-muted">
            {priorityScore(draft)} / 100
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
                value={draft[f.key]}
                onChange={(e) => onChange({ [f.key]: Number(e.target.value) } as Partial<Venture>)}
                className="flex-1 accent-signal-violet"
              />
              <span className="stat-num w-6 text-right text-sm">
                {draft[f.key]}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-fg-faint">
          Changes here are buffered — click &quot;Save changes&quot; above to apply them.
        </p>
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

"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AddTransactionDialog from "@/components/AddTransactionDialog";
import FilterBar from "@/components/FilterBar";
import ConfirmDialog from "@/components/ConfirmDialog";
import ResultDialog from "@/components/ResultDialog";
import { formatMoney, formatDate } from "@/lib/format";
import {
  STAGE_LABEL,
  FUND_SOURCE_LABEL,
  SETTLEMENT_LABEL,
  REIMBURSEMENT_LABEL
} from "@/lib/constants";
import type { LifecycleStage, OrgMember, Supplier, Transaction } from "@/lib/types";

export default function FinancialsPanel({
  ventureId,
  orgId,
  userId,
  members,
  ventureStage,
  initial,
  initialSuppliers
}: {
  ventureId: string;
  orgId: string;
  userId: string;
  members: OrgMember[];
  ventureStage: LifecycleStage;
  initial: Transaction[];
  initialSuppliers: Supplier[];
}) {
  const [txns, setTxns] = useState<Transaction[]>(initial);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [stageFilter, setStageFilter] = useState<LifecycleStage | "">("");
  const [tagFilter, setTagFilter] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState<{ variant: "success" | "error"; message: string } | null>(
    null
  );
  const supabase = createClient();

  function nameFor(id: string | null) {
    if (!id) return null;
    const m = members.find((x) => x.user_id === id);
    return m?.profiles?.full_name ?? m?.profiles?.email ?? "Member";
  }

  const tagOptions = useMemo(() => {
    const set = new Set<string>();
    txns.forEach((t) => t.tags.forEach((tag) => set.add(tag)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [txns]);

  const visibleTxns = useMemo(() => {
    return txns.filter(
      (t) =>
        (!stageFilter || t.stage === stageFilter) &&
        (!tagFilter || t.tags.includes(tagFilter))
    );
  }, [txns, stageFilter, tagFilter]);

  const { invested, revenue } = useMemo(() => {
    let invested = 0;
    let revenue = 0;
    for (const t of visibleTxns) {
      if (t.type === "expense") invested += Number(t.amount);
      else revenue += Number(t.amount);
    }
    return { invested, revenue };
  }, [visibleTxns]);

  function addTxn(txn: Transaction) {
    setTxns((t) => [txn, ...t]);
  }

  async function openDocument(storagePath: string, name: string) {
    const { data, error } = await supabase.storage
      .from("vault")
      .createSignedUrl(storagePath, 60 * 10);
    if (error || !data?.signedUrl) {
      setResult({
        variant: "error",
        message: `Could not open ${name}: ${error?.message ?? "No URL"}`
      });
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function confirmDelete() {
    const txn = pendingDelete;
    if (!txn) return;
    setDeleting(true);
    setTxns((t) => t.filter((x) => x.id !== txn.id));
    const { error } = await supabase.from("transactions").delete().eq("id", txn.id);
    setDeleting(false);
    setPendingDelete(null);
    if (error) {
      setTxns((t) => [txn, ...t]);
      setResult({ variant: "error", message: `Could not delete transaction: ${error.message}` });
      return;
    }
    setResult({ variant: "success", message: "Transaction deleted." });
  }

  const net = revenue - invested;

  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        <div className="panel p-4">
          <p className="eyebrow">Invested</p>
          <p className="stat-num mt-2 text-xl font-semibold text-fg">
            {formatMoney(invested)}
          </p>
        </div>
        <div className="panel p-4">
          <p className="eyebrow">Revenue</p>
          <p className="stat-num mt-2 text-xl font-semibold text-signal-green">
            {formatMoney(revenue)}
          </p>
        </div>
        <div className="panel p-4">
          <p className="eyebrow">Net</p>
          <p
            className={`stat-num mt-2 text-xl font-semibold ${
              net >= 0 ? "text-signal-green" : "text-signal-red"
            }`}
          >
            {formatMoney(net)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <FilterBar
          stage={stageFilter}
          onStageChange={setStageFilter}
          tag={tagFilter}
          onTagChange={setTagFilter}
          tagOptions={tagOptions}
        />
        <AddTransactionDialog
          ventureId={ventureId}
          orgId={orgId}
          userId={userId}
          members={members}
          ventureStage={ventureStage}
          suppliers={suppliers}
          onSuppliersChange={setSuppliers}
          onCreated={addTxn}
        />
      </div>

      <div className="mt-2 space-y-1.5">
        {visibleTxns.length === 0 && (
          <p className="py-8 text-center text-sm text-fg-faint">
            {txns.length === 0
              ? "No transactions yet. Record what you spend and earn to see your break-even."
              : "No transactions match the current filters."}
          </p>
        )}
        {visibleTxns.map((t) => {
          const assignee = nameFor(t.assigned_to);
          const creator = nameFor(t.created_by);
          const docs = t.documents ?? [];
          return (
            <div
              key={t.id}
              className="group rounded-lg border border-ink-500 px-3 py-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      t.type === "revenue" ? "bg-signal-green" : "bg-signal-red"
                    }`}
                  />
                  <div>
                    <p className="text-sm">{t.purpose ?? t.description ?? t.type}</p>
                    <p className="text-[11px] text-fg-faint">
                      {formatDate(t.occurred_on)}
                      {t.supplier?.name ? ` · ${t.supplier.name}` : ""}
                      {creator ? ` · by ${creator}` : ""}
                      {t.created_at ? ` · recorded ${formatDate(t.created_at)}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`stat-num text-sm ${
                      t.type === "revenue" ? "text-signal-green" : "text-fg"
                    }`}
                  >
                    {t.type === "revenue" ? "+" : "−"}
                    {formatMoney(Number(t.amount), t.currency)}
                  </span>
                  <button
                    className="text-xs text-fg-faint opacity-0 transition-opacity hover:text-signal-red group-hover:opacity-100"
                    onClick={() => setPendingDelete(t)}
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {t.stage && <span className="chip">{STAGE_LABEL[t.stage]}</span>}
                <span className="chip">{FUND_SOURCE_LABEL[t.fund_source]}</span>
                {assignee && <span className="chip">{assignee}</span>}
                {t.supplier?.name && (
                  <span className="chip text-fg-muted">{t.supplier.name}</span>
                )}
                <span
                  className={`chip ${
                    t.settlement_status === "completed"
                      ? "text-signal-green"
                      : "text-signal-amber"
                  }`}
                >
                  {SETTLEMENT_LABEL[t.type][t.settlement_status]}
                </span>
                {t.fund_source === "person" && t.reimbursement_status && (
                  <span
                    className={`chip ${
                      t.reimbursement_status === "resolved"
                        ? "text-signal-green"
                        : "text-signal-amber"
                    }`}
                  >
                    {REIMBURSEMENT_LABEL[t.reimbursement_status]}
                  </span>
                )}
                {t.tags.map((tag) => (
                  <span key={tag} className="chip text-fg-faint">
                    {tag}
                  </span>
                ))}
                {docs.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className="chip text-fg-muted hover:text-fg"
                    onClick={() => openDocument(d.storage_path, d.name)}
                  >
                    Doc: {d.name}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        message={`Delete "${
          pendingDelete?.purpose ?? pendingDelete?.description ?? "this transaction"
        }"? This cannot be undone.`}
        confirmLabel="Delete"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <ResultDialog
        open={!!result}
        variant={result?.variant ?? "success"}
        message={result?.message ?? ""}
        onClose={() => setResult(null)}
      />
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import TagInput from "@/components/TagInput";
import Dialog from "@/components/Dialog";
import ResultDialog from "@/components/ResultDialog";
import SupplierPicker from "@/components/SupplierPicker";
import { FUND_SOURCE_LABEL, SETTLEMENT_LABEL, REIMBURSEMENT_LABEL } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type {
  LifecycleStage,
  OrgMember,
  Supplier,
  Transaction,
  TxnFundSource,
  TxnReimbursementStatus,
  TxnSettlementStatus,
  TxnType
} from "@/lib/types";

const TXN_SELECT = "*, supplier:suppliers(*), documents(*)";

export default function AddTransactionDialog({
  ventureId,
  userId,
  members,
  ventureStage,
  suppliers,
  onCreated
}: {
  ventureId: string;
  userId: string;
  members: OrgMember[];
  ventureStage: LifecycleStage;
  suppliers: Supplier[];
  onCreated: (txn: Transaction) => void;
}) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<{ variant: "success" | "error"; message: string } | null>(
    null
  );
  const [saving, setSaving] = useState(false);

  const [type, setType] = useState<TxnType>("expense");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [occurredOn, setOccurredOn] = useState("");
  const [fundSource, setFundSource] = useState<TxnFundSource>("company");
  const [assignedTo, setAssignedTo] = useState("");
  const [settlementStatus, setSettlementStatus] = useState<TxnSettlementStatus>("pending");
  const [reimbursementStatus, setReimbursementStatus] =
    useState<TxnReimbursementStatus>("pending");
  const [tags, setTags] = useState<string[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const creator = members.find((m) => m.user_id === userId);
  const creatorName =
    creator?.profiles?.full_name ?? creator?.profiles?.email ?? "You";

  function reset() {
    setType("expense");
    setAmount("");
    setPurpose("");
    setOccurredOn("");
    setFundSource("company");
    setAssignedTo("");
    setSettlementStatus("pending");
    setReimbursementStatus("pending");
    setTags([]);
    setSupplierId("");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function setTxnType(next: TxnType) {
    setType(next);
    if (next === "revenue") setSupplierId("");
  }

  async function uploadDocument(
    supabase: ReturnType<typeof createClient>,
    transactionId: string,
    attachment: File
  ): Promise<string | null> {
    const safeName = attachment.name.replace(/[^\w.\-()+ ]+/g, "_");
    const storagePath = `${ventureId}/${transactionId}/${Date.now()}-${safeName}`;
    const { error: upErr } = await supabase.storage
      .from("vault")
      .upload(storagePath, attachment, { upsert: false });
    if (upErr) return upErr.message;

    const { error: docErr } = await supabase.from("documents").insert({
      venture_id: ventureId,
      transaction_id: transactionId,
      name: attachment.name,
      storage_path: storagePath,
      mime_type: attachment.type || null,
      size_bytes: attachment.size,
      uploaded_by: userId
    });
    return docErr?.message ?? null;
  }

  async function create() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast.warning("Enter an amount greater than zero.");
      return;
    }
    if (!purpose.trim()) {
      toast.warning("Enter a purpose for this transaction.");
      return;
    }
    setSaving(true);
    const supabase = createClient();

    const row: Record<string, unknown> = {
      venture_id: ventureId,
      created_by: userId,
      type,
      amount: amt,
      purpose: purpose.trim(),
      fund_source: fundSource,
      assigned_to: assignedTo || null,
      settlement_status: settlementStatus,
      reimbursement_status: fundSource === "person" ? reimbursementStatus : null,
      stage: ventureStage,
      tags,
      supplier_id: type === "expense" ? supplierId || null : null
    };
    if (occurredOn) row.occurred_on = occurredOn;

    const { data, error } = await supabase
      .from("transactions")
      .insert(row)
      .select(TXN_SELECT)
      .single();

    if (error || !data) {
      setSaving(false);
      setResult({
        variant: "error",
        message: `Could not save: ${error?.message ?? "Unknown error"}`
      });
      return;
    }

    let txn = data as Transaction;
    if (file) {
      const docErr = await uploadDocument(supabase, txn.id, file);
      if (docErr) {
        setSaving(false);
        onCreated(txn);
        reset();
        setOpen(false);
        setResult({
          variant: "error",
          message: `Transaction saved, but document upload failed: ${docErr}`
        });
        return;
      }
      const { data: refreshed } = await supabase
        .from("transactions")
        .select(TXN_SELECT)
        .eq("id", txn.id)
        .single();
      if (refreshed) txn = refreshed as Transaction;
    }

    setSaving(false);
    onCreated(txn);
    reset();
    setOpen(false);
    setResult({ variant: "success", message: "Transaction recorded." });
  }

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>
        + Add transaction
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} className="max-h-[90vh] overflow-y-auto">
        <p className="eyebrow mb-1">New transaction</p>
        <h2 className="font-display text-xl font-semibold">Record money in or out</h2>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-faint">
          <span>
            Created by <span className="text-fg-muted">{creatorName}</span>
          </span>
          <span>
            Created at{" "}
            <span className="text-fg-muted">set on save · {formatDate(new Date().toISOString())}</span>
          </span>
        </div>

        <div className="mt-5 space-y-4">
          <div className="flex overflow-hidden rounded-lg border border-ink-500">
            {(["expense", "revenue"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTxnType(t)}
                className={`flex-1 px-3 py-2 text-sm capitalize ${
                  type === t
                    ? t === "expense"
                      ? "bg-signal-red/20 text-signal-red"
                      : "bg-signal-green/20 text-signal-green"
                    : "text-fg-muted"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-fg-muted">Amount</label>
            <input
              className="field"
              type="number"
              min="0"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-fg-muted">Purpose</label>
            <input
              className="field"
              placeholder="e.g. Facebook ads, supplier payment, client invoice"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-fg-muted">Date</label>
            <input
              className="field"
              type="date"
              value={occurredOn}
              onChange={(e) => setOccurredOn(e.target.value)}
            />
            <p className="mt-1 text-[11px] text-fg-faint">Optional — defaults to today if empty.</p>
          </div>

          {type === "expense" && (
            <SupplierPicker
              suppliers={suppliers}
              supplierId={supplierId}
              onSupplierIdChange={setSupplierId}
            />
          )}

          <div>
            <label className="mb-1.5 block text-sm text-fg-muted">Document</label>
            <input
              ref={fileRef}
              className="field file:mr-3 file:rounded file:border-0 file:bg-ink-600 file:px-3 file:py-1.5 file:text-sm file:text-fg"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="mt-1 text-[11px] text-fg-faint">
              Optional receipt or invoice — uploaded to the venture vault.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-fg-muted">Fund source</label>
            <div className="grid grid-cols-2 gap-2">
              {(["company", "person"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFundSource(f)}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    fundSource === f
                      ? "border-signal-violet bg-ink-700 text-fg"
                      : "border-ink-500 text-fg-muted hover:bg-ink-700"
                  }`}
                >
                  {FUND_SOURCE_LABEL[f]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-fg-muted">
              {type === "expense" ? "Who spent it" : "Who received it"}
            </label>
            <select
              className="field"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.profiles?.full_name ?? m.profiles?.email ?? "Member"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-fg-muted">Settlement status</label>
            <div className="grid grid-cols-2 gap-2">
              {(["pending", "completed"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSettlementStatus(s)}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    settlementStatus === s
                      ? "border-signal-violet bg-ink-700 text-fg"
                      : "border-ink-500 text-fg-muted hover:bg-ink-700"
                  }`}
                >
                  {SETTLEMENT_LABEL[type][s]}
                </button>
              ))}
            </div>
          </div>

          {fundSource === "person" && (
            <div>
              <label className="mb-1.5 block text-sm text-fg-muted">
                Reimbursed the person yet?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["pending", "resolved"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setReimbursementStatus(s)}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      reimbursementStatus === s
                        ? "border-signal-violet bg-ink-700 text-fg"
                        : "border-ink-500 text-fg-muted hover:bg-ink-700"
                    }`}
                  >
                    {REIMBURSEMENT_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm text-fg-muted">Tags</label>
            <TagInput ventureId={ventureId} value={tags} onChange={setTags} />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button className="btn-primary" onClick={create} disabled={saving}>
            {saving ? "Saving…" : "Record transaction"}
          </button>
        </div>
      </Dialog>

      <ResultDialog
        open={!!result}
        variant={result?.variant ?? "success"}
        message={result?.message ?? ""}
        onClose={() => setResult(null)}
      />
    </>
  );
}

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import TagInput from "@/components/TagInput";
import SuccessDialog from "@/components/SuccessDialog";
import { FUND_SOURCE_LABEL, SETTLEMENT_LABEL, REIMBURSEMENT_LABEL } from "@/lib/constants";
import type {
  LifecycleStage,
  OrgMember,
  Transaction,
  TxnFundSource,
  TxnReimbursementStatus,
  TxnSettlementStatus,
  TxnType
} from "@/lib/types";

export default function AddTransactionDialog({
  ventureId,
  userId,
  members,
  ventureStage,
  onCreated
}: {
  ventureId: string;
  userId: string;
  members: OrgMember[];
  ventureStage: LifecycleStage;
  onCreated: (txn: Transaction) => void;
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const [type, setType] = useState<TxnType>("expense");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [fundSource, setFundSource] = useState<TxnFundSource>("company");
  const [assignedTo, setAssignedTo] = useState("");
  const [settlementStatus, setSettlementStatus] = useState<TxnSettlementStatus>("pending");
  const [reimbursementStatus, setReimbursementStatus] =
    useState<TxnReimbursementStatus>("pending");
  const [tags, setTags] = useState<string[]>([]);

  function reset() {
    setType("expense");
    setAmount("");
    setPurpose("");
    setFundSource("company");
    setAssignedTo("");
    setSettlementStatus("pending");
    setReimbursementStatus("pending");
    setTags([]);
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
    const { data, error } = await supabase
      .from("transactions")
      .insert({
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
        tags
      })
      .select("*")
      .single();

    setSaving(false);
    if (error) {
      toast.error(`Could not save: ${error.message}`);
      return;
    }
    if (data) onCreated(data as Transaction);
    reset();
    setOpen(false);
    setShowSuccess(true);
  }

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>
        + Add transaction
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="panel-raised w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="eyebrow mb-1">New transaction</p>
            <h2 className="font-display text-xl font-semibold">Record money in or out</h2>

            <div className="mt-5 space-y-4">
              <div className="flex overflow-hidden rounded-lg border border-ink-500">
                {(["expense", "revenue"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
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
                <label className="mb-1.5 block text-sm text-fg-muted">
                  Settlement status
                </label>
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
          </div>
        </div>
      )}

      <SuccessDialog
        open={showSuccess}
        message="Transaction recorded."
        onClose={() => setShowSuccess(false)}
      />
    </>
  );
}

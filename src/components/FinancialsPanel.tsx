"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatMoney, formatDate } from "@/lib/format";
import type { Transaction, TxnType } from "@/lib/types";

export default function FinancialsPanel({
  ventureId,
  userId,
  initial
}: {
  ventureId: string;
  userId: string;
  initial: Transaction[];
}) {
  const [txns, setTxns] = useState<Transaction[]>(initial);
  const [type, setType] = useState<TxnType>("expense");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const supabase = createClient();

  const { invested, revenue } = useMemo(() => {
    let invested = 0;
    let revenue = 0;
    for (const t of txns) {
      if (t.type === "expense") invested += Number(t.amount);
      else revenue += Number(t.amount);
    }
    return { invested, revenue };
  }, [txns]);

  async function add() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        venture_id: ventureId,
        created_by: userId,
        type,
        amount: amt,
        description: desc.trim() || null
      })
      .select("*")
      .single();
    if (error) {
      alert(`Could not save: ${error.message}`);
      return;
    }
    if (data) setTxns((t) => [data as Transaction, ...t]);
    setAmount("");
    setDesc("");
  }

  async function remove(id: string) {
    setTxns((t) => t.filter((x) => x.id !== id));
    await supabase.from("transactions").delete().eq("id", id);
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

      <div className="panel mt-4 p-4">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex overflow-hidden rounded-lg border border-ink-500">
            {(["expense", "revenue"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-3 py-2 text-sm capitalize ${
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
          <input
            className="field w-32"
            type="number"
            min="0"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <input
            className="field flex-1 min-w-[160px]"
            placeholder="What for? (e.g. printer, ads, sale)"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <button className="btn-primary" onClick={add}>
            Record
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-1.5">
        {txns.length === 0 && (
          <p className="py-8 text-center text-sm text-fg-faint">
            No transactions yet. Record what you spend and earn to see your break-even.
          </p>
        )}
        {txns.map((t) => (
          <div
            key={t.id}
            className="group flex items-center justify-between rounded-lg border border-ink-500 px-3 py-2.5"
          >
            <div className="flex items-center gap-3">
              <span
                className={`h-2 w-2 rounded-full ${
                  t.type === "revenue" ? "bg-signal-green" : "bg-signal-red"
                }`}
              />
              <div>
                <p className="text-sm">{t.description ?? t.type}</p>
                <p className="text-[11px] text-fg-faint">{formatDate(t.occurred_on)}</p>
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
                onClick={() => remove(t.id)}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

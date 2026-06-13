"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/format";

type CalcKey = "breakeven" | "dropship" | "margin" | "saas" | "roi";

const TABS: { key: CalcKey; label: string }[] = [
  { key: "breakeven", label: "Break-even" },
  { key: "dropship", label: "Dropshipping" },
  { key: "margin", label: "Margin" },
  { key: "saas", label: "SaaS (LTV/CAC)" },
  { key: "roi", label: "ROI" }
];

export default function Calculators() {
  const [tab, setTab] = useState<CalcKey>("breakeven");
  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              tab === t.key
                ? "border-signal-violet bg-ink-700 text-fg"
                : "border-ink-500 text-fg-muted hover:bg-ink-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "breakeven" && <BreakEven />}
      {tab === "dropship" && <Dropship />}
      {tab === "margin" && <Margin />}
      {tab === "saas" && <Saas />}
      {tab === "roi" && <Roi />}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  suffix
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-fg-muted">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          className="field"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix && <span className="text-xs text-fg-faint">{suffix}</span>}
      </div>
    </label>
  );
}

function Result({ rows }: { rows: [string, string][] }) {
  return (
    <div className="panel-raised mt-1 divide-y divide-ink-500">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-fg-muted">{k}</span>
          <span className="stat-num text-sm font-semibold">{v}</span>
        </div>
      ))}
    </div>
  );
}

function Shell({
  inputs,
  result
}: {
  inputs: React.ReactNode;
  result: React.ReactNode;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="panel space-y-4 p-5">{inputs}</div>
      <div>{result}</div>
    </div>
  );
}

const n = (s: string) => parseFloat(s) || 0;

function BreakEven() {
  const [fixed, setFixed] = useState("25000");
  const [price, setPrice] = useState("999");
  const [variable, setVariable] = useState("450");
  const margin = n(price) - n(variable);
  const units = margin > 0 ? Math.ceil(n(fixed) / margin) : 0;
  return (
    <Shell
      inputs={
        <>
          <Field label="Fixed costs" value={fixed} onChange={setFixed} />
          <Field label="Selling price / unit" value={price} onChange={setPrice} />
          <Field label="Variable cost / unit" value={variable} onChange={setVariable} />
        </>
      }
      result={
        <Result
          rows={[
            ["Contribution / unit", formatMoney(margin)],
            ["Units to break even", margin > 0 ? `${units}` : "—"],
            ["Revenue at break-even", margin > 0 ? formatMoney(units * n(price)) : "—"]
          ]}
        />
      }
    />
  );
}

function Dropship() {
  const [sell, setSell] = useState("1499");
  const [cost, setCost] = useState("600");
  const [ship, setShip] = useState("120");
  const [adPerOrder, setAd] = useState("250");
  const [fees, setFees] = useState("5");
  const feeAmt = (n(sell) * n(fees)) / 100;
  const profit = n(sell) - n(cost) - n(ship) - n(adPerOrder) - feeAmt;
  const margin = n(sell) > 0 ? (profit / n(sell)) * 100 : 0;
  return (
    <Shell
      inputs={
        <>
          <Field label="Selling price" value={sell} onChange={setSell} />
          <Field label="Product cost" value={cost} onChange={setCost} />
          <Field label="Shipping" value={ship} onChange={setShip} />
          <Field label="Ad spend / order" value={adPerOrder} onChange={setAd} />
          <Field label="Platform fees" value={fees} onChange={setFees} suffix="%" />
        </>
      }
      result={
        <Result
          rows={[
            ["Fees", formatMoney(feeAmt)],
            ["Profit / order", formatMoney(profit)],
            ["Margin", `${margin.toFixed(1)}%`]
          ]}
        />
      }
    />
  );
}

function Margin() {
  const [cost, setCost] = useState("400");
  const [price, setPrice] = useState("1000");
  const profit = n(price) - n(cost);
  const margin = n(price) > 0 ? (profit / n(price)) * 100 : 0;
  const markup = n(cost) > 0 ? (profit / n(cost)) * 100 : 0;
  return (
    <Shell
      inputs={
        <>
          <Field label="Cost" value={cost} onChange={setCost} />
          <Field label="Price" value={price} onChange={setPrice} />
        </>
      }
      result={
        <Result
          rows={[
            ["Profit", formatMoney(profit)],
            ["Margin", `${margin.toFixed(1)}%`],
            ["Markup", `${markup.toFixed(1)}%`]
          ]}
        />
      }
    />
  );
}

function Saas() {
  const [arpu, setArpu] = useState("499");
  const [churn, setChurn] = useState("5");
  const [cac, setCac] = useState("1500");
  const lifetimeMonths = n(churn) > 0 ? 100 / n(churn) : 0;
  const ltv = n(arpu) * lifetimeMonths;
  const ratio = n(cac) > 0 ? ltv / n(cac) : 0;
  const payback = n(arpu) > 0 ? n(cac) / n(arpu) : 0;
  return (
    <Shell
      inputs={
        <>
          <Field label="ARPU / month" value={arpu} onChange={setArpu} />
          <Field label="Monthly churn" value={churn} onChange={setChurn} suffix="%" />
          <Field label="CAC" value={cac} onChange={setCac} />
        </>
      }
      result={
        <Result
          rows={[
            ["Avg. lifetime", `${lifetimeMonths.toFixed(1)} mo`],
            ["LTV", formatMoney(ltv)],
            ["LTV : CAC", `${ratio.toFixed(2)}×`],
            ["CAC payback", `${payback.toFixed(1)} mo`]
          ]}
        />
      }
    />
  );
}

function Roi() {
  const [invest, setInvest] = useState("50000");
  const [ret, setRet] = useState("80000");
  const profit = n(ret) - n(invest);
  const roi = n(invest) > 0 ? (profit / n(invest)) * 100 : 0;
  return (
    <Shell
      inputs={
        <>
          <Field label="Amount invested" value={invest} onChange={setInvest} />
          <Field label="Amount returned" value={ret} onChange={setRet} />
        </>
      }
      result={
        <Result
          rows={[
            ["Net profit", formatMoney(profit)],
            ["ROI", `${roi.toFixed(1)}%`]
          ]}
        />
      }
    />
  );
}

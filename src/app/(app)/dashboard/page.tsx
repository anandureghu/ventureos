import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/data";
import { formatMoney } from "@/lib/format";
import {
  CATEGORY_LABEL,
  STAGE_LABEL,
  STAGE_ACCENT,
  priorityScore
} from "@/lib/constants";
import type { Transaction, Venture } from "@/lib/types";

export const dynamic = "force-dynamic";

async function loadTaskStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ventureIds: string[]
) {
  const [{ data: t }, { data: tasks }] = await Promise.all([
    supabase.from("transactions").select("*").in("venture_id", ventureIds),
    supabase
      .from("tasks")
      .select("status, completed_at, blocked_by")
      .in("venture_id", ventureIds)
  ]);

  const weekAgo = Date.now() - 7 * 864e5;
  let openTasks = 0;
  let blockedTasks = 0;
  let doneThisWeek = 0;

  for (const tk of tasks ?? []) {
    if (tk.status !== "completed") openTasks++;
    if (tk.blocked_by) blockedTasks++;
    if (tk.completed_at && new Date(tk.completed_at).getTime() > weekAgo)
      doneThisWeek++;
  }

  return {
    txns: (t ?? []) as Transaction[],
    openTasks,
    blockedTasks,
    doneThisWeek
  };
}

export default async function DashboardPage() {
  const { org, profile } = await getSession();
  const supabase = await createClient();

  const { data: venturesData } = await supabase
    .from("ventures")
    .select("*")
    .eq("org_id", org.id);
  const ventures = (venturesData ?? []) as Venture[];
  const ids = ventures.map((v) => v.id);

  let txns: Transaction[] = [];
  let openTasks = 0;
  let blockedTasks = 0;
  let doneThisWeek = 0;

  if (ids.length) {
    const stats = await loadTaskStats(supabase, ids);
    txns = stats.txns;
    openTasks = stats.openTasks;
    blockedTasks = stats.blockedTasks;
    doneThisWeek = stats.doneThisWeek;
  }

  const invested = txns
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);
  const revenue = txns
    .filter((t) => t.type === "revenue")
    .reduce((s, t) => s + Number(t.amount), 0);

  const active = ventures.filter((v) => v.state === "active");
  const ranked = [...active].sort((a, b) => priorityScore(b) - priorityScore(a));
  const top = ranked[0];

  const firstName = (profile.full_name ?? "there").split(" ")[0];

  return (
    <div>
      <header className="mb-7">
        <p className="eyebrow mb-1.5">Command Center</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Good to see you, {firstName}.
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          {active.length} active{" "}
          {active.length === 1 ? "venture" : "ventures"} ·{" "}
          {ventures.length} in the portfolio.
        </p>
      </header>

      {/* Top metric strip — the instrument panel */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Total invested" value={formatMoney(invested)} tone="muted" />
        <Stat label="Revenue generated" value={formatMoney(revenue)} tone="green" />
        <Stat
          label="Net position"
          value={formatMoney(revenue - invested)}
          tone={revenue - invested >= 0 ? "green" : "red"}
        />
        <Stat label="Done this week" value={String(doneThisWeek)} tone="violet" />
      </div>

      {/* Highest-leverage call-out */}
      {top && (
        <Link
          href={`/ventures/${top.id}`}
          className="panel-raised mt-3 block p-5 transition-colors hover:border-signal-violet"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="eyebrow text-signal-violet">Where to focus today</p>
              <p className="mt-1 truncate font-display text-lg font-semibold">
                {top.name}
              </p>
              <p className="mt-0.5 text-sm text-fg-muted">
                {top.next_action
                  ? `Next: ${top.next_action}`
                  : `Currently in ${STAGE_LABEL[top.current_stage]} — set a next action.`}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="stat-num text-3xl font-semibold">{priorityScore(top)}</p>
              <p className="eyebrow">priority</p>
            </div>
          </div>
        </Link>
      )}

      {/* Ranked venture grid */}
      <div className="mt-8 mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Ventures, ranked</h2>
        <Link href="/ventures" className="text-sm text-signal-violet hover:underline">
          View all →
        </Link>
      </div>

      {ranked.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ranked.map((v) => (
            <Link
              key={v.id}
              href={`/ventures/${v.id}`}
              className="panel group relative overflow-hidden p-4 transition-colors hover:border-ink-600"
            >
              <span
                className="absolute inset-y-0 left-0 w-1"
                style={{ background: STAGE_ACCENT[v.current_stage] }}
              />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="chip">{CATEGORY_LABEL[v.category]}</p>
                  <p className="mt-2 truncate font-display text-base font-semibold">
                    {v.name}
                  </p>
                </div>
                <span className="stat-num text-lg font-semibold text-fg">
                  {priorityScore(v)}
                </span>
              </div>
              <p className="mt-3 flex items-center gap-2 text-xs text-fg-muted">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: STAGE_ACCENT[v.current_stage] }}
                />
                {STAGE_LABEL[v.current_stage]} · {v.execution_mode}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "muted" | "green" | "red" | "violet";
}) {
  const color =
    tone === "green"
      ? "text-signal-green"
      : tone === "red"
        ? "text-signal-red"
        : tone === "violet"
          ? "text-signal-violet"
          : "text-fg";
  return (
    <div className="panel p-4">
      <p className="eyebrow">{label}</p>
      <p className={`stat-num mt-2 text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="panel flex flex-col items-center justify-center px-6 py-14 text-center">
      <p className="font-display text-lg font-semibold">No ventures yet</p>
      <p className="mt-1 max-w-sm text-sm text-fg-muted">
        Add your first idea — dropshipping, 3D printing, a story book, anything.
        VentureOS will rank it and tell you the next move.
      </p>
      <Link href="/ventures" className="btn-primary mt-5">
        Add a venture
      </Link>
    </div>
  );
}

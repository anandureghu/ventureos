import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/data";
import NewVentureDialog from "@/components/NewVentureDialog";
import {
  CATEGORY_LABEL,
  STAGE_LABEL,
  STAGE_ACCENT,
  LIFECYCLE_ORDER,
  priorityScore
} from "@/lib/constants";
import type { Venture } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function VenturesPage() {
  const { org, userId } = await getSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("ventures")
    .select("*")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });
  const ventures = (data ?? []) as Venture[];

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="eyebrow mb-1.5">Portfolio</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Ventures
          </h1>
        </div>
        <NewVentureDialog orgId={org.id} userId={userId} />
      </header>

      {ventures.length === 0 ? (
        <div className="panel px-6 py-14 text-center">
          <p className="font-display text-lg font-semibold">
            Your portfolio is empty
          </p>
          <p className="mt-1 text-sm text-fg-muted">
            Add an idea to start tracking its stage, tasks, and finances.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {ventures.map((v) => {
            const stageIdx = LIFECYCLE_ORDER.indexOf(v.current_stage);
            const progress = ((stageIdx + 1) / LIFECYCLE_ORDER.length) * 100;
            return (
              <Link
                key={v.id}
                href={`/ventures/${v.id}`}
                className="panel relative flex items-center gap-4 overflow-hidden p-4 transition-colors hover:border-ink-600"
              >
                <span
                  className="absolute inset-y-0 left-0 w-1"
                  style={{ background: STAGE_ACCENT[v.current_stage] }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-display text-base font-semibold">
                      {v.name}
                    </p>
                    {v.state !== "active" && (
                      <span className="chip border-ink-500 text-fg-faint">
                        {v.state}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-fg-muted">
                    {CATEGORY_LABEL[v.category]} · {STAGE_LABEL[v.current_stage]} ·{" "}
                    {v.execution_mode}
                  </p>
                  <div className="mt-2.5 h-1 w-full max-w-xs overflow-hidden rounded-full bg-ink-600">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${progress}%`,
                        background: STAGE_ACCENT[v.current_stage]
                      }}
                    />
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="stat-num text-xl font-semibold">
                    {priorityScore(v)}
                  </p>
                  <p className="eyebrow">priority</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

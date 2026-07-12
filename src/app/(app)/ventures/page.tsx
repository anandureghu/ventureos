import Link from "next/link";
import { getSession, getPortfolioVentures } from "@/lib/data";
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

function sortByPriority(ventures: Venture[]) {
  return [...ventures].sort(
    (a, b) =>
      priorityScore(b) - priorityScore(a) ||
      b.created_at.localeCompare(a.created_at)
  );
}

function VentureRow({ venture, badge }: { venture: Venture; badge?: string }) {
  const stageIdx = LIFECYCLE_ORDER.indexOf(venture.current_stage);
  const progress = ((stageIdx + 1) / LIFECYCLE_ORDER.length) * 100;

  return (
    <Link
      href={`/ventures/${venture.id}`}
      className="panel relative flex items-center gap-4 overflow-hidden p-4 transition-colors hover:border-ink-600"
    >
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: STAGE_ACCENT[venture.current_stage] }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-display text-base font-semibold">
            {venture.name}
          </p>
          {badge && <span className="chip text-fg-faint">{badge}</span>}
          {venture.state !== "active" && (
            <span className="chip border-ink-500 text-fg-faint">
              {venture.state}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-fg-muted">
          {CATEGORY_LABEL[venture.category]} · {STAGE_LABEL[venture.current_stage]} ·{" "}
          {venture.execution_mode}
        </p>
        <div className="mt-2.5 h-1 w-full max-w-xs overflow-hidden rounded-full bg-ink-600">
          <span
            className="block h-full rounded-full"
            style={{
              width: `${progress}%`,
              background: STAGE_ACCENT[venture.current_stage]
            }}
          />
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="stat-num text-xl font-semibold">{priorityScore(venture)}</p>
        <p className="eyebrow">priority</p>
      </div>
    </Link>
  );
}

export default async function VenturesPage() {
  const { org, userId } = await getSession();
  const { workspace, shared } = await getPortfolioVentures(org.id, userId);
  const ventures = sortByPriority(workspace);
  const sharedVentures = sortByPriority(shared);
  const isEmpty = ventures.length === 0 && sharedVentures.length === 0;

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

      {isEmpty ? (
        <div className="panel px-6 py-14 text-center">
          <p className="font-display text-lg font-semibold">
            Your portfolio is empty
          </p>
          <p className="mt-1 text-sm text-fg-muted">
            Add an idea to start tracking its stage, tasks, and finances.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {ventures.length > 0 && (
            <div className="space-y-3">
              {ventures.map((v) => (
                <VentureRow key={v.id} venture={v} />
              ))}
            </div>
          )}

          {sharedVentures.length > 0 && (
            <div>
              <p className="eyebrow mb-3">Shared with you</p>
              <div className="space-y-3">
                {sharedVentures.map((v) => (
                  <VentureRow key={v.id} venture={v} badge="External" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

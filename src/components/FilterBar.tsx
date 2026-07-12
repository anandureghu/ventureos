"use client";

import { LIFECYCLE_ORDER, STAGE_LABEL } from "@/lib/constants";
import type { LifecycleStage } from "@/lib/types";

export default function FilterBar({
  stage,
  onStageChange,
  tag,
  onTagChange,
  tagOptions
}: {
  stage: LifecycleStage | "";
  onStageChange: (v: LifecycleStage | "") => void;
  tag: string;
  onTagChange: (v: string) => void;
  tagOptions: string[];
}) {
  const active = stage !== "" || tag !== "";

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <select
        className="rounded-lg border border-ink-500 bg-ink-800 px-2.5 py-1.5 text-xs text-fg"
        value={stage}
        onChange={(e) => onStageChange(e.target.value as LifecycleStage | "")}
      >
        <option value="">All stages</option>
        {LIFECYCLE_ORDER.map((s) => (
          <option key={s} value={s}>
            {STAGE_LABEL[s]}
          </option>
        ))}
      </select>

      <select
        className="rounded-lg border border-ink-500 bg-ink-800 px-2.5 py-1.5 text-xs text-fg"
        value={tag}
        onChange={(e) => onTagChange(e.target.value)}
      >
        <option value="">All tags</option>
        {tagOptions.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      {active && (
        <button
          type="button"
          className="text-xs text-fg-faint hover:text-fg"
          onClick={() => {
            onStageChange("");
            onTagChange("");
          }}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

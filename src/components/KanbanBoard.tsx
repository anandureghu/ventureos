"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import TagInput from "@/components/TagInput";
import FilterBar from "@/components/FilterBar";
import Dialog from "@/components/Dialog";
import ResultDialog from "@/components/ResultDialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import { KANBAN_COLUMNS } from "@/lib/constants";
import { initials } from "@/lib/format";
import type { LifecycleStage, OrgMember, Task, TaskStatus } from "@/lib/types";

const STATUS_KEYS = KANBAN_COLUMNS.map((c) => c.key);

export default function KanbanBoard({
  ventureId,
  userId,
  members,
  initial,
  ventureStage
}: {
  ventureId: string;
  userId: string;
  members: OrgMember[];
  initial: Task[];
  ventureStage: LifecycleStage;
}) {
  const [tasks, setTasks] = useState<Task[]>(initial);
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [track, setTrack] = useState("");
  const [draftTags, setDraftTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [stageFilter, setStageFilter] = useState<LifecycleStage | "">("");
  const [tagFilter, setTagFilter] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState<{ variant: "success" | "error"; message: string } | null>(
    null
  );
  const supabase = createClient();
  const toast = useToast();

  const tagOptions = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => t.tags.forEach((tag) => set.add(tag)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    return tasks.filter(
      (t) =>
        (!stageFilter || t.stage === stageFilter) &&
        (!tagFilter || t.tags.includes(tagFilter))
    );
  }, [tasks, stageFilter, tagFilter]);

  function nameFor(id: string | null) {
    if (!id) return null;
    const m = members.find((x) => x.user_id === id);
    return m?.profiles?.full_name ?? m?.profiles?.email ?? "Member";
  }

  async function addTask() {
    if (!draft.trim()) {
      toast.warning("Enter a task title first.");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        venture_id: ventureId,
        created_by: userId,
        title: draft.trim(),
        track: track.trim() || null,
        stage: ventureStage,
        tags: draftTags
      })
      .select("*")
      .single();

    setSaving(false);
    if (error) {
      setResult({ variant: "error", message: `Could not add task: ${error.message}` });
      return;
    }
    if (data) setTasks((t) => [data as Task, ...t]);
    setDraft("");
    setTrack("");
    setDraftTags([]);
    setAddOpen(false);
    setResult({ variant: "success", message: "Task added." });
  }

  async function move(task: Task, dir: -1 | 1) {
    const idx = STATUS_KEYS.indexOf(task.status);
    const next = STATUS_KEYS[idx + dir];
    if (!next) return;
    const previous = task.status;
    setTasks((t) =>
      t.map((x) => (x.id === task.id ? { ...x, status: next } : x))
    );
    const { error } = await supabase
      .from("tasks")
      .update({ status: next })
      .eq("id", task.id);
    if (error) {
      setTasks((t) =>
        t.map((x) => (x.id === task.id ? { ...x, status: previous } : x))
      );
      toast.error(`Could not move task: ${error.message}`);
    }
  }

  async function assign(task: Task, assignee: string | null) {
    const previous = task.assignee_id;
    setTasks((t) =>
      t.map((x) => (x.id === task.id ? { ...x, assignee_id: assignee } : x))
    );
    const { error } = await supabase
      .from("tasks")
      .update({ assignee_id: assignee })
      .eq("id", task.id);
    if (error) {
      setTasks((t) =>
        t.map((x) => (x.id === task.id ? { ...x, assignee_id: previous } : x))
      );
      toast.error(`Could not reassign task: ${error.message}`);
    }
  }

  async function retag(task: Task, tags: string[]) {
    const previous = task.tags;
    setTasks((t) => t.map((x) => (x.id === task.id ? { ...x, tags } : x)));
    const { error } = await supabase.from("tasks").update({ tags }).eq("id", task.id);
    if (error) {
      setTasks((t) => t.map((x) => (x.id === task.id ? { ...x, tags: previous } : x)));
      toast.error(`Could not update tags: ${error.message}`);
    }
  }

  async function confirmDelete() {
    const task = pendingDelete;
    if (!task) return;
    setDeleting(true);
    setTasks((t) => t.filter((x) => x.id !== task.id));
    const { error } = await supabase.from("tasks").delete().eq("id", task.id);
    setDeleting(false);
    setPendingDelete(null);
    if (error) {
      setTasks((t) => [...t, task]);
      setResult({ variant: "error", message: `Could not delete task: ${error.message}` });
      return;
    }
    setResult({ variant: "success", message: "Task deleted." });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <FilterBar
          stage={stageFilter}
          onStageChange={setStageFilter}
          tag={tagFilter}
          onTagChange={setTagFilter}
          tagOptions={tagOptions}
        />
        <button className="btn-primary shrink-0" onClick={() => setAddOpen(true)}>
          + Add task
        </button>
      </div>

      <div className="scroll-x flex gap-3 overflow-x-auto pb-2">
        {KANBAN_COLUMNS.map((col) => {
          const items = visibleTasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="w-64 shrink-0">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="eyebrow">{col.label}</span>
                <span className="stat-num text-xs text-fg-faint">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((task) => (
                  <Card
                    key={task.id}
                    ventureId={ventureId}
                    task={task}
                    status={task.status}
                    assigneeName={nameFor(task.assignee_id)}
                    members={members}
                    onMove={move}
                    onAssign={assign}
                    onRemove={setPendingDelete}
                    onRetag={retag}
                  />
                ))}
                {items.length === 0 && (
                  <div className="rounded-lg border border-dashed border-ink-500 py-6 text-center text-xs text-fg-faint">
                    Empty
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)}>
        <p className="eyebrow mb-1">Pipeline</p>
        <h2 className="font-display text-xl font-semibold">Add a task</h2>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-fg-muted">Title</label>
            <input
              className="field"
              placeholder="What needs to happen?"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-fg-muted">Track (optional)</label>
            <input
              className="field"
              placeholder="e.g. Supplier research"
              value={track}
              onChange={(e) => setTrack(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-fg-muted">Tags</label>
            <TagInput ventureId={ventureId} value={draftTags} onChange={setDraftTags} />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setAddOpen(false)}>
            Cancel
          </button>
          <button className="btn-primary" onClick={addTask} disabled={saving}>
            {saving ? "Adding…" : "Add task"}
          </button>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!pendingDelete}
        message={`Delete "${pendingDelete?.title}"? This cannot be undone.`}
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

function Card({
  ventureId,
  task,
  status,
  assigneeName,
  members,
  onMove,
  onAssign,
  onRemove,
  onRetag
}: {
  ventureId: string;
  task: Task;
  status: TaskStatus;
  assigneeName: string | null;
  members: OrgMember[];
  onMove: (t: Task, d: -1 | 1) => void;
  onAssign: (t: Task, a: string | null) => void;
  onRemove: (t: Task) => void;
  onRetag: (t: Task, tags: string[]) => void;
}) {
  const idx = STATUS_KEYS.indexOf(status);
  const [tagging, setTagging] = useState(false);

  return (
    <div className="panel-raised group p-3">
      <p className="text-sm leading-snug">{task.title}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {task.track && <p className="chip">{task.track}</p>}
        {task.tags.map((tag) => (
          <span key={tag} className="chip">
            {tag}
          </span>
        ))}
        <button
          type="button"
          className="text-[11px] text-fg-faint hover:text-fg"
          onClick={() => setTagging((v) => !v)}
        >
          + tag
        </button>
      </div>
      {tagging && (
        <div className="mt-2">
          <TagInput
            ventureId={ventureId}
            value={task.tags}
            onChange={(tags) => onRetag(task, tags)}
          />
        </div>
      )}
      <div className="mt-3 flex items-center justify-between">
        <select
          className="rounded-md border border-ink-500 bg-ink-800 px-1.5 py-1 text-[11px] text-fg-muted"
          value={task.assignee_id ?? ""}
          onChange={(e) => onAssign(task, e.target.value || null)}
        >
          <option value="">Unassigned</option>
          {members.map((m) => (
            <option key={m.user_id} value={m.user_id}>
              {m.profiles?.full_name ?? m.profiles?.email ?? "Member"}
            </option>
          ))}
        </select>
        {assigneeName && (
          <span className="grid h-5 w-5 place-items-center rounded-full bg-ink-500 font-mono text-[9px]">
            {initials(assigneeName)}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between opacity-0 transition-opacity group-hover:opacity-100">
        <div className="flex gap-1">
          <button
            className="rounded border border-ink-500 px-1.5 text-xs text-fg-muted hover:bg-ink-700 disabled:opacity-30"
            disabled={idx === 0}
            onClick={() => onMove(task, -1)}
          >
            ←
          </button>
          <button
            className="rounded border border-ink-500 px-1.5 text-xs text-fg-muted hover:bg-ink-700 disabled:opacity-30"
            disabled={idx === STATUS_KEYS.length - 1}
            onClick={() => onMove(task, 1)}
          >
            →
          </button>
        </div>
        <button
          className="text-xs text-fg-faint hover:text-signal-red"
          onClick={() => onRemove(task)}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

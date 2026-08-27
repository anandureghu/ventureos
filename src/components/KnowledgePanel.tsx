"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import TagInput from "@/components/TagInput";
import FilterBar from "@/components/FilterBar";
import Dialog from "@/components/Dialog";
import ResultDialog from "@/components/ResultDialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import CopyButton from "@/components/CopyButton";
import { formatDate } from "@/lib/format";
import { STAGE_LABEL } from "@/lib/constants";
import type { LifecycleStage, Note, NoteType } from "@/lib/types";

const NOTE_TYPES: { key: NoteType; label: string }[] = [
  { key: "note", label: "Note" },
  { key: "research", label: "Research" },
  { key: "supplier", label: "Supplier" },
  { key: "competitor", label: "Competitor" },
  { key: "meeting", label: "Meeting" }
];

function sortNotes(list: Note[]): Note[] {
  return [...list].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.created_at.localeCompare(a.created_at);
  });
}

export default function KnowledgePanel({
  ventureId,
  userId,
  ventureStage,
  initial
}: {
  ventureId: string;
  userId: string;
  ventureStage: LifecycleStage;
  initial: Note[];
}) {
  const [notes, setNotes] = useState<Note[]>(() =>
    sortNotes(initial.map((n) => ({ ...n, pinned: n.pinned ?? false })))
  );
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<NoteType>("note");
  const [draftTags, setDraftTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [stageFilter, setStageFilter] = useState<LifecycleStage | "">("");
  const [tagFilter, setTagFilter] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Note | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState<{ variant: "success" | "error"; message: string } | null>(
    null
  );
  const supabase = createClient();
  const toast = useToast();

  const tagOptions = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => n.tags.forEach((tag) => set.add(tag)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [notes]);

  const visibleNotes = useMemo(() => {
    return sortNotes(
      notes.filter(
        (n) =>
          (!stageFilter || n.stage === stageFilter) &&
          (!tagFilter || n.tags.includes(tagFilter))
      )
    );
  }, [notes, stageFilter, tagFilter]);

  async function add() {
    if (!title.trim()) {
      toast.warning("Give the note a title first.");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("notes")
      .insert({
        venture_id: ventureId,
        created_by: userId,
        title: title.trim(),
        content: content.trim() || null,
        url: url.trim() || null,
        type,
        stage: ventureStage,
        tags: draftTags,
        pinned: false
      })
      .select("*")
      .single();
    setSaving(false);
    if (error) {
      setResult({ variant: "error", message: `Could not save note: ${error.message}` });
      return;
    }
    if (data) setNotes((n) => sortNotes([data as Note, ...n]));
    setTitle("");
    setContent("");
    setUrl("");
    setDraftTags([]);
    setAddOpen(false);
    setResult({ variant: "success", message: "Note saved." });
  }

  async function confirmDelete() {
    const note = pendingDelete;
    if (!note) return;
    setDeleting(true);
    setNotes((n) => n.filter((x) => x.id !== note.id));
    const { error } = await supabase.from("notes").delete().eq("id", note.id);
    setDeleting(false);
    setPendingDelete(null);
    if (error) {
      setNotes((n) => sortNotes([note, ...n]));
      setResult({ variant: "error", message: `Could not delete note: ${error.message}` });
      return;
    }
    setResult({ variant: "success", message: "Note deleted." });
  }

  async function retag(note: Note, tags: string[]) {
    const previous = note.tags;
    setNotes((n) => n.map((x) => (x.id === note.id ? { ...x, tags } : x)));
    const { error } = await supabase.from("notes").update({ tags }).eq("id", note.id);
    if (error) {
      setNotes((n) => n.map((x) => (x.id === note.id ? { ...x, tags: previous } : x)));
      toast.error(`Could not update tags: ${error.message}`);
    }
  }

  async function togglePin(note: Note) {
    const next = !note.pinned;
    setNotes((n) =>
      sortNotes(n.map((x) => (x.id === note.id ? { ...x, pinned: next } : x)))
    );
    const { error } = await supabase
      .from("notes")
      .update({ pinned: next })
      .eq("id", note.id);
    if (error) {
      setNotes((n) =>
        sortNotes(n.map((x) => (x.id === note.id ? { ...x, pinned: note.pinned } : x)))
      );
      toast.error(`Could not ${next ? "pin" : "unpin"} note: ${error.message}`);
      return;
    }
    toast.success(next ? "Note pinned." : "Note unpinned.");
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
          + Add note
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {visibleNotes.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-fg-faint">
            {notes.length === 0
              ? "Nothing in the vault yet. Keep research, supplier links, and competitor notes here so they never get lost in chat threads."
              : "No notes match the current filters."}
          </p>
        )}
        {visibleNotes.map((n) => (
          <NoteCard
            key={n.id}
            ventureId={ventureId}
            note={n}
            onRemove={setPendingDelete}
            onRetag={retag}
            onTogglePin={togglePin}
          />
        ))}
      </div>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)}>
        <p className="eyebrow mb-1">Knowledge vault</p>
        <h2 className="font-display text-xl font-semibold">Add a note</h2>

        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            <input
              className="field flex-1 min-w-[200px]"
              placeholder="Title — supplier name, competitor, finding…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
            <select
              className="field w-36"
              value={type}
              onChange={(e) => setType(e.target.value as NoteType)}
            >
              {NOTE_TYPES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <textarea
            className="field min-h-[70px]"
            placeholder="Details, notes, paste anything worth keeping…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <input
            className="field"
            placeholder="Link (optional)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <div>
            <label className="mb-1.5 block text-sm text-fg-muted">Tags</label>
            <TagInput ventureId={ventureId} value={draftTags} onChange={setDraftTags} />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setAddOpen(false)}>
            Cancel
          </button>
          <button className="btn-primary" onClick={add} disabled={saving}>
            {saving ? "Saving…" : "Save to vault"}
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

function NoteCard({
  ventureId,
  note,
  onRemove,
  onRetag,
  onTogglePin
}: {
  ventureId: string;
  note: Note;
  onRemove: (note: Note) => void;
  onRetag: (n: Note, tags: string[]) => void;
  onTogglePin: (n: Note) => void;
}) {
  const [tagging, setTagging] = useState(false);

  return (
    <div className={`panel group p-4 ${note.pinned ? "border-signal-amber/40" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <p className="chip">{note.type}</p>
          {note.pinned && <span className="chip text-signal-amber">Pinned</span>}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            title={note.pinned ? "Unpin note" : "Pin note"}
            aria-label={note.pinned ? "Unpin note" : "Pin note"}
            className={`rounded-md p-1 transition-colors ${
              note.pinned
                ? "text-signal-amber"
                : "text-fg-faint opacity-0 hover:text-signal-amber group-hover:opacity-100"
            }`}
            onClick={() => onTogglePin(note)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
              <path
                d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.4l1.1-6.5L2.6 9.3l6.5-.9L12 2.5z"
                fill={note.pinned ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            className="text-xs text-fg-faint opacity-0 transition-opacity hover:text-signal-red group-hover:opacity-100"
            onClick={() => onRemove(note)}
          >
            ✕
          </button>
        </div>
      </div>
      <p className="mt-2 font-display text-sm font-semibold">{note.title}</p>
      {note.content && (
        <p className="mt-1 whitespace-pre-wrap text-sm text-fg-muted">{note.content}</p>
      )}
      {note.url && (
        <div className="mt-2 flex items-center gap-1">
          <a
            href={note.url}
            target="_blank"
            rel="noreferrer"
            className="inline-block min-w-0 truncate text-xs text-signal-blue hover:underline"
          >
            {note.url}
          </a>
          <CopyButton value={note.url} label="URL" />
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {note.stage && <span className="chip">{STAGE_LABEL[note.stage]}</span>}
        {note.tags.map((tag) => (
          <span key={tag} className="chip text-fg-faint">
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
            value={note.tags}
            onChange={(tags) => onRetag(note, tags)}
          />
        </div>
      )}
      <p className="mt-2 text-[11px] text-fg-faint">{formatDate(note.created_at)}</p>
    </div>
  );
}

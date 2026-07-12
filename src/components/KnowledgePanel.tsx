"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import TagInput from "@/components/TagInput";
import FilterBar from "@/components/FilterBar";
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
  const [notes, setNotes] = useState<Note[]>(initial);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<NoteType>("note");
  const [draftTags, setDraftTags] = useState<string[]>([]);
  const [stageFilter, setStageFilter] = useState<LifecycleStage | "">("");
  const [tagFilter, setTagFilter] = useState("");
  const supabase = createClient();
  const toast = useToast();

  const tagOptions = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => n.tags.forEach((tag) => set.add(tag)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [notes]);

  const visibleNotes = useMemo(() => {
    return notes.filter(
      (n) =>
        (!stageFilter || n.stage === stageFilter) &&
        (!tagFilter || n.tags.includes(tagFilter))
    );
  }, [notes, stageFilter, tagFilter]);

  async function add() {
    if (!title.trim()) {
      toast.warning("Give the note a title first.");
      return;
    }
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
        tags: draftTags
      })
      .select("*")
      .single();
    if (error) {
      toast.error(`Could not save note: ${error.message}`);
      return;
    }
    if (data) setNotes((n) => [data as Note, ...n]);
    setTitle("");
    setContent("");
    setUrl("");
    setDraftTags([]);
    toast.success("Note saved.");
  }

  async function remove(id: string) {
    const removed = notes.find((x) => x.id === id);
    setNotes((n) => n.filter((x) => x.id !== id));
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error && removed) {
      setNotes((n) => [removed, ...n]);
      toast.error(`Could not delete note: ${error.message}`);
    }
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

  return (
    <div>
      <div className="panel p-4">
        <div className="flex flex-wrap gap-2">
          <input
            className="field flex-1 min-w-[200px]"
            placeholder="Title — supplier name, competitor, finding…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
          className="field mt-2 min-h-[70px]"
          placeholder="Details, notes, paste anything worth keeping…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            className="field flex-1 min-w-[200px]"
            placeholder="Link (optional)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button className="btn-primary" onClick={add}>
            Save to vault
          </button>
        </div>
        <div className="mt-2">
          <TagInput ventureId={ventureId} value={draftTags} onChange={setDraftTags} />
        </div>
      </div>

      <div className="mt-4">
        <FilterBar
          stage={stageFilter}
          onStageChange={setStageFilter}
          tag={tagFilter}
          onTagChange={setTagFilter}
          tagOptions={tagOptions}
        />
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
          <NoteCard key={n.id} ventureId={ventureId} note={n} onRemove={remove} onRetag={retag} />
        ))}
      </div>
    </div>
  );
}

function NoteCard({
  ventureId,
  note,
  onRemove,
  onRetag
}: {
  ventureId: string;
  note: Note;
  onRemove: (id: string) => void;
  onRetag: (n: Note, tags: string[]) => void;
}) {
  const [tagging, setTagging] = useState(false);

  return (
    <div className="panel group p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="chip">{note.type}</p>
        <button
          className="text-xs text-fg-faint opacity-0 transition-opacity hover:text-signal-red group-hover:opacity-100"
          onClick={() => onRemove(note.id)}
        >
          ✕
        </button>
      </div>
      <p className="mt-2 font-display text-sm font-semibold">{note.title}</p>
      {note.content && (
        <p className="mt-1 whitespace-pre-wrap text-sm text-fg-muted">{note.content}</p>
      )}
      {note.url && (
        <a
          href={note.url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block truncate text-xs text-signal-blue hover:underline"
        >
          {note.url}
        </a>
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

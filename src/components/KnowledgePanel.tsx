"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/format";
import type { Note, NoteType } from "@/lib/types";

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
  initial
}: {
  ventureId: string;
  userId: string;
  initial: Note[];
}) {
  const [notes, setNotes] = useState<Note[]>(initial);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<NoteType>("note");
  const supabase = createClient();

  async function add() {
    if (!title.trim()) return;
    const { data, error } = await supabase
      .from("notes")
      .insert({
        venture_id: ventureId,
        created_by: userId,
        title: title.trim(),
        content: content.trim() || null,
        url: url.trim() || null,
        type
      })
      .select("*")
      .single();
    if (error) {
      alert(`Could not save note: ${error.message}`);
      return;
    }
    if (data) setNotes((n) => [data as Note, ...n]);
    setTitle("");
    setContent("");
    setUrl("");
  }

  async function remove(id: string) {
    setNotes((n) => n.filter((x) => x.id !== id));
    await supabase.from("notes").delete().eq("id", id);
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
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {notes.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-fg-faint">
            Nothing in the vault yet. Keep research, supplier links, and competitor
            notes here so they never get lost in chat threads.
          </p>
        )}
        {notes.map((n) => (
          <div key={n.id} className="panel group p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="chip">{n.type}</p>
              <button
                className="text-xs text-fg-faint opacity-0 transition-opacity hover:text-signal-red group-hover:opacity-100"
                onClick={() => remove(n.id)}
              >
                ✕
              </button>
            </div>
            <p className="mt-2 font-display text-sm font-semibold">{n.title}</p>
            {n.content && (
              <p className="mt-1 whitespace-pre-wrap text-sm text-fg-muted">
                {n.content}
              </p>
            )}
            {n.url && (
              <a
                href={n.url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block truncate text-xs text-signal-blue hover:underline"
              >
                {n.url}
              </a>
            )}
            <p className="mt-2 text-[11px] text-fg-faint">{formatDate(n.created_at)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

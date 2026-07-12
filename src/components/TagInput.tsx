"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TagInput({
  ventureId,
  value,
  onChange
}: {
  ventureId: string;
  value: string[];
  onChange: (tags: string[]) => void;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    createClient()
      .from("tags")
      .select("name")
      .eq("venture_id", ventureId)
      .order("name")
      .then(({ data }) => {
        if (data) setSuggestions(data.map((t) => t.name as string));
      });
  }, [ventureId]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = input.trim().toLowerCase();
    return suggestions
      .filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()))
      .filter((s) => (q ? s.toLowerCase().includes(q) : true))
      .slice(0, 8);
  }, [suggestions, input, value]);

  function addTag(raw: string) {
    const name = raw.trim();
    if (!name) return;
    if (value.some((v) => v.toLowerCase() === name.toLowerCase())) {
      setInput("");
      return;
    }
    onChange([...value, name]);
    setInput("");
    setOpen(false);
    if (!suggestions.some((s) => s.toLowerCase() === name.toLowerCase())) {
      setSuggestions((s) => [...s, name].sort((a, b) => a.localeCompare(b)));
      // Best-effort registry write for future suggestions — a duplicate
      // (race with another tab) is harmless and ignored.
      supabase.from("tags").insert({ venture_id: ventureId, name }).then(() => {});
    }
  }

  function removeTag(name: string) {
    onChange(value.filter((v) => v !== name));
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="flex flex-wrap items-center gap-1.5">
        {value.map((tag) => (
          <span key={tag} className="chip gap-1">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-fg-faint hover:text-signal-red"
              aria-label={`Remove tag ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          className="field flex-1 min-w-[120px] py-1.5 text-xs"
          placeholder="Add a tag…"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag(input);
            }
          }}
        />
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute left-0 top-full z-20 mt-1 w-48 rounded-lg border border-ink-500 bg-ink-700 py-1 shadow-xl">
          {filtered.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="block w-full px-3 py-1.5 text-left text-xs text-fg-muted hover:bg-ink-600 hover:text-fg"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

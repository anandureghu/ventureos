"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import { CATEGORY_OPTIONS } from "@/lib/constants";
import type { VentureCategory } from "@/lib/types";

export default function NewVentureDialog({
  orgId,
  userId
}: {
  orgId: string;
  userId: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<VentureCategory>("dropshipping");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<"parallel" | "sequential">("parallel");

  async function create() {
    if (!name.trim()) {
      toast.warning("Give the venture a name first.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("ventures")
      .insert({
        org_id: orgId,
        created_by: userId,
        owner_id: userId,
        name: name.trim(),
        description: description.trim() || null,
        category,
        execution_mode: mode
      })
      .select("id")
      .single();

    setSaving(false);
    if (error) {
      toast.error(`Could not create venture: ${error.message}`);
      return;
    }
    setOpen(false);
    setName("");
    setDescription("");
    toast.success("Venture created.");
    if (data?.id) router.push(`/ventures/${data.id}`);
    router.refresh();
  }

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>
        + New venture
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="panel-raised w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="eyebrow mb-1">New venture</p>
            <h2 className="font-display text-xl font-semibold">Add a business idea</h2>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-fg-muted">Name</label>
                <input
                  className="field"
                  placeholder="e.g. Minimalist 3D-printed desk gear"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-fg-muted">Category</label>
                <select
                  className="field"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as VentureCategory)}
                >
                  {CATEGORY_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-fg-muted">
                  One-line description
                </label>
                <input
                  className="field"
                  placeholder="What is it, in a sentence?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-fg-muted">
                  Execution mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["parallel", "sequential"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={`rounded-lg border px-3 py-2 text-sm capitalize ${
                        mode === m
                          ? "border-signal-violet bg-ink-700 text-fg"
                          : "border-ink-500 text-fg-muted hover:bg-ink-700"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-fg-faint">
                  {mode === "parallel"
                    ? "Work multiple tracks at once — split them between you and your partner."
                    : "Move through stages one at a time; finish a stage before the next."}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={create} disabled={saving}>
                {saving ? "Creating…" : "Create venture"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

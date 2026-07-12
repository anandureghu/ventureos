"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import Dialog from "@/components/Dialog";
import ResultDialog from "@/components/ResultDialog";
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
  const [result, setResult] = useState<{ variant: "success" | "error"; message: string } | null>(
    null
  );
  const [createdId, setCreatedId] = useState<string | null>(null);

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
        category
      })
      .select("id")
      .single();

    setSaving(false);
    if (error) {
      setResult({ variant: "error", message: `Could not create venture: ${error.message}` });
      return;
    }
    setOpen(false);
    setName("");
    setDescription("");
    setCreatedId(data?.id ?? null);
    setResult({ variant: "success", message: "Venture created." });
  }

  function handleResultClose() {
    setResult(null);
    if (createdId) {
      router.push(`/ventures/${createdId}`);
      router.refresh();
      setCreatedId(null);
    }
  }

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>
        + New venture
      </button>

      <Dialog open={open} onClose={() => setOpen(false)}>
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
            <label className="mb-1.5 block text-sm text-fg-muted">One-line description</label>
            <input
              className="field"
              placeholder="What is it, in a sentence?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
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
      </Dialog>

      <ResultDialog
        open={!!result}
        variant={result?.variant ?? "success"}
        message={result?.message ?? ""}
        onClose={handleResultClose}
      />
    </>
  );
}

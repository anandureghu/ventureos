"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import Dialog from "@/components/Dialog";
import ResultDialog from "@/components/ResultDialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import SupplierFields, {
  EMPTY_SUPPLIER_DRAFT,
  supplierPayloadFromDraft
} from "@/components/SupplierFields";
import { formatDate } from "@/lib/format";
import type { Supplier, SupplierDraft } from "@/lib/types";

function draftFromSupplier(s: Supplier): SupplierDraft {
  return {
    name: s.name,
    contact_name: s.contact_name ?? "",
    email: s.email ?? "",
    phone: s.phone ?? "",
    address_line1: s.address_line1 ?? "",
    address_line2: s.address_line2 ?? "",
    city: s.city ?? "",
    region: s.region ?? "",
    postal_code: s.postal_code ?? "",
    country: s.country ?? "",
    notes: s.notes ?? ""
  };
}

function formatAddress(s: Supplier): string | null {
  const parts = [
    s.address_line1,
    s.address_line2,
    [s.city, s.region].filter(Boolean).join(", "),
    s.postal_code,
    s.country
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

export default function SuppliersPanel({
  orgId,
  userId,
  suppliers,
  onChange
}: {
  orgId: string;
  userId: string;
  suppliers: Supplier[];
  onChange: (next: Supplier[]) => void;
}) {
  const toast = useToast();
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [draft, setDraft] = useState<SupplierDraft>(EMPTY_SUPPLIER_DRAFT);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState<{ variant: "success" | "error"; message: string } | null>(
    null
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter((s) => {
      const hay = [
        s.name,
        s.contact_name,
        s.email,
        s.phone,
        s.city,
        s.region,
        s.country
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [suppliers, query]);

  function openCreate() {
    setEditing(null);
    setDraft(EMPTY_SUPPLIER_DRAFT);
    setEditorOpen(true);
  }

  function openEdit(s: Supplier) {
    setEditing(s);
    setDraft(draftFromSupplier(s));
    setEditorOpen(true);
  }

  async function save() {
    const payload = supplierPayloadFromDraft(draft);
    if (!payload) {
      toast.warning("Supplier name is required.");
      return;
    }
    setSaving(true);
    if (editing) {
      const { data, error } = await supabase
        .from("suppliers")
        .update(payload)
        .eq("id", editing.id)
        .eq("org_id", orgId)
        .select("*")
        .single();
      setSaving(false);
      if (error || !data) {
        setResult({
          variant: "error",
          message: `Could not update supplier: ${error?.message ?? "Unknown error"}`
        });
        return;
      }
      const updated = data as Supplier;
      onChange(
        suppliers
          .map((s) => (s.id === updated.id ? updated : s))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditorOpen(false);
      setResult({ variant: "success", message: "Supplier updated." });
      return;
    }

    const { data, error } = await supabase
      .from("suppliers")
      .insert({
        org_id: orgId,
        created_by: userId,
        ...payload
      })
      .select("*")
      .single();
    setSaving(false);
    if (error || !data) {
      setResult({
        variant: "error",
        message: `Could not create supplier: ${error?.message ?? "Unknown error"}`
      });
      return;
    }
    const created = data as Supplier;
    onChange([...suppliers, created].sort((a, b) => a.name.localeCompare(b.name)));
    setEditorOpen(false);
    setResult({ variant: "success", message: "Supplier added." });
  }

  async function confirmDelete() {
    const s = pendingDelete;
    if (!s) return;
    setDeleting(true);
    const { error } = await supabase
      .from("suppliers")
      .delete()
      .eq("id", s.id)
      .eq("org_id", orgId);
    setDeleting(false);
    setPendingDelete(null);
    if (error) {
      setResult({ variant: "error", message: `Could not delete supplier: ${error.message}` });
      return;
    }
    onChange(suppliers.filter((x) => x.id !== s.id));
    setResult({ variant: "success", message: "Supplier deleted." });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <input
          className="field max-w-xs"
          placeholder="Search suppliers…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="button" className="btn-primary" onClick={openCreate}>
          + Add supplier
        </button>
      </div>

      <div className="mt-3 space-y-1.5">
        {visible.length === 0 && (
          <p className="py-8 text-center text-sm text-fg-faint">
            {suppliers.length === 0
              ? "No suppliers yet. Add vendors here, then pick them on expense transactions."
              : "No suppliers match your search."}
          </p>
        )}
        {visible.map((s) => {
          const address = formatAddress(s);
          const contactBits = [s.contact_name, s.email, s.phone].filter(Boolean);
          return (
            <div
              key={s.id}
              className="group rounded-lg border border-ink-500 px-3 py-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-fg">{s.name}</p>
                  {contactBits.length > 0 && (
                    <p className="mt-0.5 text-[11px] text-fg-muted">{contactBits.join(" · ")}</p>
                  )}
                  {address && (
                    <p className="mt-0.5 text-[11px] text-fg-faint">{address}</p>
                  )}
                  <p className="mt-1 text-[11px] text-fg-faint">
                    Added {formatDate(s.created_at)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    className="text-xs text-fg-muted hover:text-fg"
                    onClick={() => openEdit(s)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-xs text-fg-faint hover:text-signal-red"
                    onClick={() => setPendingDelete(s)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        className="max-h-[90vh] overflow-y-auto"
      >
        <p className="eyebrow mb-1">Suppliers</p>
        <h2 className="font-display text-xl font-semibold">
          {editing ? "Edit supplier" : "Add supplier"}
        </h2>
        <div className="mt-5">
          <SupplierFields
            value={draft}
            onChange={setDraft}
            idPrefix={editing ? "edit-supplier" : "new-supplier"}
            autoFocusName
          />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={() => setEditorOpen(false)}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={save} disabled={saving}>
            {saving ? "Saving…" : editing ? "Save changes" : "Add supplier"}
          </button>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!pendingDelete}
        message={`Delete "${pendingDelete?.name ?? "this supplier"}"? Linked expenses will keep their history but lose the supplier link.`}
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

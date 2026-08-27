"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import Dialog from "@/components/Dialog";
import ResultDialog from "@/components/ResultDialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import CopyButton from "@/components/CopyButton";
import type { VentureResource } from "@/lib/types";

function ensureHref(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

export default function ResourcesPanel({
  ventureId,
  userId,
  initial
}: {
  ventureId: string;
  userId: string;
  initial: VentureResource[];
}) {
  const [resources, setResources] = useState<VentureResource[]>(initial);
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<VentureResource | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState<{ variant: "success" | "error"; message: string } | null>(
    null
  );
  const supabase = createClient();
  const toast = useToast();

  const sorted = useMemo(
    () =>
      [...resources].sort(
        (a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at)
      ),
    [resources]
  );

  function resetForm() {
    setTitle("");
    setUrl("");
    setDescription("");
  }

  async function add() {
    const trimmedTitle = title.trim();
    const trimmedUrl = url.trim();
    if (!trimmedTitle) {
      toast.warning("Give the resource a title.");
      return;
    }
    if (!trimmedUrl) {
      toast.warning("Add a URL for the resource.");
      return;
    }
    setSaving(true);
    const nextPosition =
      resources.reduce((max, r) => Math.max(max, r.position), -1) + 1;
    const { data, error } = await supabase
      .from("resources")
      .insert({
        venture_id: ventureId,
        created_by: userId,
        title: trimmedTitle,
        url: trimmedUrl,
        description: description.trim() || null,
        position: nextPosition
      })
      .select("*")
      .single();
    setSaving(false);
    if (error) {
      setResult({ variant: "error", message: `Could not save resource: ${error.message}` });
      return;
    }
    if (data) setResources((list) => [...list, data as VentureResource]);
    resetForm();
    setAddOpen(false);
    setResult({ variant: "success", message: "Resource added." });
  }

  async function confirmDelete() {
    const resource = pendingDelete;
    if (!resource) return;
    setDeleting(true);
    setResources((list) => list.filter((r) => r.id !== resource.id));
    const { error } = await supabase.from("resources").delete().eq("id", resource.id);
    setDeleting(false);
    setPendingDelete(null);
    if (error) {
      setResources((list) => [...list, resource]);
      setResult({ variant: "error", message: `Could not delete resource: ${error.message}` });
      return;
    }
    setResult({ variant: "success", message: "Resource removed." });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="text-sm text-fg-muted">
          Links to docs, repos, dashboards, and other tools — open in a new tab.
        </p>
        <button className="btn-primary shrink-0" onClick={() => setAddOpen(true)}>
          + Add resource
        </button>
      </div>

      <div className="panel divide-y divide-ink-500">
        {sorted.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-fg-faint">
            No resources yet. Add Notion docs, GitHub repos, Figma files, or any URL your team needs.
          </p>
        ) : (
          sorted.map((r) => (
            <div key={r.id} className="group flex items-start gap-3 px-5 py-3.5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={ensureHref(r.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-display text-sm font-semibold text-fg hover:text-signal-blue"
                  >
                    {r.title}
                    <span className="ml-1.5 text-[11px] font-sans font-normal text-fg-faint">
                      ↗
                    </span>
                  </a>
                </div>
                {r.description && (
                  <p className="mt-1 text-sm text-fg-muted">{r.description}</p>
                )}
                <div className="mt-1.5 flex items-center gap-1">
                  <a
                    href={ensureHref(r.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-xs text-signal-blue hover:underline"
                  >
                    {r.url}
                  </a>
                  <CopyButton value={r.url} label="URL" />
                </div>
              </div>
              <button
                type="button"
                className="shrink-0 text-xs text-fg-faint opacity-0 transition-opacity hover:text-signal-red group-hover:opacity-100"
                onClick={() => setPendingDelete(r)}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)}>
        <p className="eyebrow mb-1">Resources</p>
        <h2 className="font-display text-xl font-semibold">Add a resource</h2>

        <div className="mt-5 space-y-3">
          <div>
            <label className="mb-1.5 block text-xs text-fg-muted">Title</label>
            <input
              className="field"
              placeholder="e.g. Pitch deck, Repo, Analytics"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-fg-muted">URL</label>
            <input
              className="field"
              placeholder="https://…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-fg-muted">Description (optional)</label>
            <input
              className="field"
              placeholder="Short note about what this is for"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setAddOpen(false)}>
            Cancel
          </button>
          <button className="btn-primary" onClick={add} disabled={saving}>
            {saving ? "Saving…" : "Add resource"}
          </button>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!pendingDelete}
        message={`Remove "${pendingDelete?.title}"?`}
        confirmLabel="Remove"
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

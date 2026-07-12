"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import Dialog from "@/components/Dialog";
import ResultDialog from "@/components/ResultDialog";

export default function RenameWorkspace({
  orgId,
  initialName,
  canEdit
}: {
  orgId: string;
  initialName: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ variant: "success" | "error"; message: string } | null>(
    null
  );

  function openDialog() {
    setName(initialName);
    setOpen(true);
  }

  async function save() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === initialName) {
      toast.warning("Enter a different name first.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("organizations")
      .update({ name: trimmed })
      .eq("id", orgId);
    setBusy(false);
    if (error) {
      setResult({ variant: "error", message: error.message });
      return;
    }
    setOpen(false);
    setResult({ variant: "success", message: "Workspace renamed." });
    router.refresh();
  }

  if (!canEdit) {
    return (
      <div className="panel p-5">
        <p className="eyebrow mb-2">Workspace name</p>
        <p className="text-sm">{initialName}</p>
        <p className="mt-2 text-xs text-fg-faint">
          Only owners and admins can rename this workspace.
        </p>
      </div>
    );
  }

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow mb-1">Workspace name</p>
          <p className="text-sm">{initialName}</p>
        </div>
        <button className="btn-ghost shrink-0" onClick={openDialog}>
          Rename
        </button>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <p className="eyebrow mb-1">Workspace name</p>
        <h2 className="font-display text-xl font-semibold">Rename workspace</h2>

        <div className="mt-5">
          <input
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            autoFocus
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button className="btn-primary" onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </Dialog>

      <ResultDialog
        open={!!result}
        variant={result?.variant ?? "success"}
        message={result?.message ?? ""}
        onClose={() => setResult(null)}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
  const [name, setName] = useState(initialName);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === initialName) return;
    setBusy(true);
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("organizations")
      .update({ name: trimmed })
      .eq("id", orgId);
    setBusy(false);
    if (error) {
      setMsg({ ok: false, text: error.message });
      return;
    }
    setMsg({ ok: true, text: "Workspace renamed." });
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
      <p className="eyebrow mb-3">Workspace name</p>
      <div className="flex flex-wrap gap-2">
        <input
          className="field max-w-md flex-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
        />
        <button
          className="btn-primary"
          onClick={save}
          disabled={busy || !name.trim() || name.trim() === initialName}
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
      {msg && (
        <p
          className={`mt-2 text-xs ${msg.ok ? "text-signal-green" : "text-signal-red"}`}
        >
          {msg.text}
        </p>
      )}
    </div>
  );
}

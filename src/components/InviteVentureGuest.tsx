"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import Dialog from "@/components/Dialog";
import ResultDialog from "@/components/ResultDialog";

export default function InviteVentureGuest({ ventureId }: { ventureId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ variant: "success" | "error"; message: string } | null>(
    null
  );

  async function invite() {
    if (!email.trim()) {
      toast.warning("Enter an email address first.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("add_venture_guest_by_email", {
      _venture: ventureId,
      _email: email.trim(),
      _role: "member"
    });
    setBusy(false);
    if (error) {
      setResult({ variant: "error", message: error.message });
      return;
    }
    const invited = email.trim();
    setEmail("");
    setOpen(false);
    setResult({
      variant: "success",
      message: `${invited} can now view and edit this venture.`
    });
    router.refresh();
  }

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow mb-1">Invite external collaborator</p>
          <p className="text-xs text-fg-faint">
            For advisors or contractors not in your workspace — they get this
            venture only, not your full workspace.
          </p>
        </div>
        <button className="btn-primary shrink-0" onClick={() => setOpen(true)}>
          + Invite collaborator
        </button>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <p className="eyebrow mb-1">Invite external collaborator</p>
        <h2 className="font-display text-xl font-semibold">Bring in an advisor</h2>
        <p className="mt-1 text-xs text-fg-faint">
          They must sign in with Google once first. People already in your
          workspace already have access — use Workspace → Team for them.
        </p>

        <div className="mt-5">
          <label className="mb-1.5 block text-sm text-fg-muted">Email</label>
          <input
            className="field"
            type="email"
            placeholder="advisor@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button className="btn-primary" onClick={invite} disabled={busy}>
            {busy ? "Inviting…" : "Invite"}
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

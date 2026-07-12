"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import Dialog from "@/components/Dialog";
import ResultDialog from "@/components/ResultDialog";
import type { MemberRole } from "@/lib/types";

export default function InviteMember({ orgId }: { orgId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("member");
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
    const { error } = await supabase.rpc("add_member_by_email", {
      _org: orgId,
      _email: email.trim(),
      _role: role
    });
    setBusy(false);
    if (error) {
      setResult({ variant: "error", message: error.message });
      return;
    }
    const invited = email.trim();
    setEmail("");
    setOpen(false);
    setResult({ variant: "success", message: `${invited} now has access.` });
    router.refresh();
  }

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow mb-1">Invite to this workspace</p>
          <p className="text-xs text-fg-faint">
            They must sign in with Google once first, then can switch to this
            workspace from the sidebar.
          </p>
        </div>
        <button className="btn-primary shrink-0" onClick={() => setOpen(true)}>
          + Invite member
        </button>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <p className="eyebrow mb-1">Invite to this workspace</p>
        <h2 className="font-display text-xl font-semibold">Add a team member</h2>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-fg-muted">Email</label>
            <input
              className="field"
              type="email"
              placeholder="partner@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-fg-muted">Role</label>
            <select
              className="field"
              value={role}
              onChange={(e) => setRole(e.target.value as MemberRole)}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button className="btn-primary" onClick={invite} disabled={busy}>
            {busy ? "Adding…" : "Add member"}
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

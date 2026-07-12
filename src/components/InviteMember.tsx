"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import type { MemberRole } from "@/lib/types";

export default function InviteMember({ orgId }: { orgId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("member");
  const [busy, setBusy] = useState(false);

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
      toast.error(error.message);
      return;
    }
    toast.success(`${email.trim()} now has access.`);
    setEmail("");
    router.refresh();
  }

  return (
    <div className="panel p-5">
      <p className="eyebrow mb-3">Invite to this workspace</p>
      <div className="flex flex-wrap gap-2">
        <input
          className="field flex-1 min-w-[220px]"
          type="email"
          placeholder="partner@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <select
          className="field w-32"
          value={role}
          onChange={(e) => setRole(e.target.value as MemberRole)}
        >
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
        <button className="btn-primary" onClick={invite} disabled={busy}>
          {busy ? "Adding…" : "Add"}
        </button>
      </div>
      <p className="mt-2 text-xs text-fg-faint">
        They must sign in with Google once first. After joining, they can switch to
        this workspace from the sidebar — they only see ventures in workspaces they
        belong to.
      </p>
    </div>
  );
}

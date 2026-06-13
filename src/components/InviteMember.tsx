"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { MemberRole } from "@/lib/types";

export default function InviteMember({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("member");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function invite() {
    if (!email.trim()) return;
    setBusy(true);
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("add_member_by_email", {
      _org: orgId,
      _email: email.trim(),
      _role: role
    });
    setBusy(false);
    if (error) {
      setMsg({ ok: false, text: error.message });
      return;
    }
    setMsg({ ok: true, text: `${email.trim()} now has access.` });
    setEmail("");
    router.refresh();
  }

  return (
    <div className="panel p-5">
      <p className="eyebrow mb-3">Add a co-founder</p>
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
      {msg && (
        <p
          className={`mt-2 text-xs ${
            msg.ok ? "text-signal-green" : "text-signal-red"
          }`}
        >
          {msg.text}
        </p>
      )}
      <p className="mt-2 text-xs text-fg-faint">
        They must sign in with Google once first so VentureOS knows their account.
      </p>
    </div>
  );
}

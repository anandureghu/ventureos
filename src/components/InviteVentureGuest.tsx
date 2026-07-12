"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function InviteVentureGuest({
  ventureId
}: {
  ventureId: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function invite() {
    if (!email.trim()) return;
    setBusy(true);
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("add_venture_guest_by_email", {
      _venture: ventureId,
      _email: email.trim(),
      _role: "member"
    });
    setBusy(false);
    if (error) {
      setMsg({ ok: false, text: error.message });
      return;
    }
    setMsg({
      ok: true,
      text: `${email.trim()} can now view and edit this venture (not your full workspace).`
    });
    setEmail("");
    router.refresh();
  }

  return (
    <div className="panel p-5">
      <p className="eyebrow mb-3">Invite external collaborator</p>
      <p className="mb-3 text-xs text-fg-faint">
        For advisors, contractors, or partners who are not in your workspace.
        They can view and edit this venture — pipeline, financials, and notes.
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          className="field min-w-[220px] flex-1"
          type="email"
          placeholder="advisor@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="btn-primary" onClick={invite} disabled={busy}>
          {busy ? "Inviting…" : "Invite"}
        </button>
      </div>
      {msg && (
        <p
          className={`mt-2 text-xs ${msg.ok ? "text-signal-green" : "text-signal-red"}`}
        >
          {msg.text}
        </p>
      )}
      <p className="mt-2 text-xs text-fg-faint">
        They must sign in with Google once first. People already in your workspace
        already have access — use Workspace → Team for them.
      </p>
    </div>
  );
}

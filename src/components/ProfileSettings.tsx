"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { initials } from "@/lib/format";
import type { Profile } from "@/lib/types";

export default function ProfileSettings({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    const trimmed = fullName.trim();
    if (!trimmed) return;
    setBusy(true);
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: trimmed })
      .eq("id", profile.id);
    setBusy(false);
    if (error) {
      setMsg({ ok: false, text: error.message });
      return;
    }
    setMsg({ ok: true, text: "Profile updated." });
    router.refresh();
  }

  const displayName = profile.full_name ?? profile.email ?? "You";

  return (
    <div className="space-y-5">
      <div className="panel p-5">
        <p className="eyebrow mb-4">Your profile</p>
        <div className="mb-5 flex items-center gap-4">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt=""
              className="h-14 w-14 rounded-full"
            />
          ) : (
            <div className="grid h-14 w-14 place-items-center rounded-full bg-ink-600 font-mono text-sm text-fg-muted">
              {initials(displayName)}
            </div>
          )}
          <div>
            <p className="text-sm font-medium">{displayName}</p>
            <p className="text-xs text-fg-faint">{profile.email}</p>
          </div>
        </div>

        <label className="mb-1.5 block text-xs text-fg-muted">Display name</label>
        <div className="flex flex-wrap gap-2">
          <input
            className="field max-w-md flex-1"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
          />
          <button
            className="btn-primary"
            onClick={save}
            disabled={busy || !fullName.trim()}
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

      <div className="panel p-5">
        <p className="eyebrow mb-3">Sign-in</p>
        <p className="text-sm text-fg-muted">
          Signed in with Google. Email and avatar come from your Google account.
        </p>
        <p className="mt-2 font-mono text-xs text-fg-faint">{profile.email}</p>
      </div>
    </div>
  );
}

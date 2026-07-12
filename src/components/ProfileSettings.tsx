"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { initials } from "@/lib/format";
import { useToast } from "@/components/ToastProvider";
import type { Profile } from "@/lib/types";

export default function ProfileSettings({ profile }: { profile: Profile }) {
  const router = useRouter();
  const toast = useToast();
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    const trimmed = fullName.trim();
    if (!trimmed) {
      toast.warning("Display name can't be empty.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: trimmed })
      .eq("id", profile.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile updated.");
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

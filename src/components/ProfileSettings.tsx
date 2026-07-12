"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { initials } from "@/lib/format";
import { useToast } from "@/components/ToastProvider";
import Dialog from "@/components/Dialog";
import ResultDialog from "@/components/ResultDialog";
import type { Profile } from "@/lib/types";

export default function ProfileSettings({ profile }: { profile: Profile }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ variant: "success" | "error"; message: string } | null>(
    null
  );

  function openDialog() {
    setFullName(profile.full_name ?? "");
    setOpen(true);
  }

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
      setResult({ variant: "error", message: error.message });
      return;
    }
    setOpen(false);
    setResult({ variant: "success", message: "Profile updated." });
    router.refresh();
  }

  const displayName = profile.full_name ?? profile.email ?? "You";

  return (
    <div className="space-y-5">
      <div className="panel p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="eyebrow">Your profile</p>
          <button className="btn-ghost shrink-0" onClick={openDialog}>
            Edit name
          </button>
        </div>
        <div className="mt-4 flex items-center gap-4">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" className="h-14 w-14 rounded-full" />
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
      </div>

      <div className="panel p-5">
        <p className="eyebrow mb-3">Sign-in</p>
        <p className="text-sm text-fg-muted">
          Signed in with Google. Email and avatar come from your Google account.
        </p>
        <p className="mt-2 font-mono text-xs text-fg-faint">{profile.email}</p>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <p className="eyebrow mb-1">Your profile</p>
        <h2 className="font-display text-xl font-semibold">Edit display name</h2>

        <div className="mt-5">
          <input
            className="field"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
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

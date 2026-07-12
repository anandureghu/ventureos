"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { initials } from "@/lib/format";
import { useToast } from "@/components/ToastProvider";
import InviteVentureGuest from "@/components/InviteVentureGuest";
import type { OrgMember, Venture, VentureMember } from "@/lib/types";

export default function VentureSettings({
  venture,
  ventureMembers,
  orgMembers,
  canManage,
  onSave
}: {
  venture: Venture;
  ventureMembers: VentureMember[];
  orgMembers: OrgMember[];
  canManage: boolean;
  onSave: (fields: Partial<Venture>) => Promise<boolean>;
}) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState(venture.name);
  const [description, setDescription] = useState(venture.description ?? "");
  const [busy, setBusy] = useState(false);

  const orgMemberIds = new Set(orgMembers.map((m) => m.user_id));
  const externalGuests = ventureMembers.filter((m) => !orgMemberIds.has(m.user_id));

  async function saveDetails() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.warning("Venture name can't be empty.");
      return;
    }
    await onSave({
      name: trimmedName,
      description: description.trim() || null
    });
  }

  async function removeGuest(memberId: string) {
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("venture_members")
      .delete()
      .eq("id", memberId);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Collaborator removed.");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="panel p-5">
        <p className="eyebrow mb-3">Venture details</p>
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs text-fg-muted">Name</label>
            <input
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canManage}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-fg-muted">Description</label>
            <textarea
              className="field min-h-[80px] resize-y"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canManage}
            />
          </div>
          {canManage && (
            <button className="btn-primary" onClick={saveDetails}>
              Save details
            </button>
          )}
        </div>
      </div>

      <div className="panel p-4">
        <p className="text-xs text-fg-muted">
          Everyone in your workspace can access this venture. Invite external
          collaborators below — they can view and edit this venture only.
        </p>
      </div>

      {canManage && <InviteVentureGuest ventureId={venture.id} />}

      <div className="panel divide-y divide-ink-500">
        <p className="px-5 py-3 eyebrow">
          External collaborators · {externalGuests.length}
        </p>
        {externalGuests.length === 0 ? (
          <p className="px-5 py-4 text-sm text-fg-faint">
            No external collaborators yet.
          </p>
        ) : (
          externalGuests.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-5 py-3">
              {m.profiles?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.profiles.avatar_url}
                  alt=""
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <div className="grid h-8 w-8 place-items-center rounded-full bg-ink-600 font-mono text-xs text-fg-muted">
                  {initials(m.profiles?.full_name ?? m.profiles?.email)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  {m.profiles?.full_name ?? m.profiles?.email ?? "Guest"}
                </p>
                <p className="truncate text-xs text-fg-faint">{m.profiles?.email}</p>
              </div>
              <span className="chip text-fg-faint">Collaborator</span>
              {canManage && (
                <button
                  type="button"
                  className="btn-ghost px-2 py-1 text-xs text-signal-red"
                  onClick={() => removeGuest(m.id)}
                  disabled={busy}
                >
                  Remove
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {!canManage && (
        <p className="text-xs text-fg-faint">
          Only workspace owners and admins can edit venture settings and invites.
        </p>
      )}
    </div>
  );
}

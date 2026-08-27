"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { initials } from "@/lib/format";
import { CATEGORY_LABEL } from "@/lib/constants";
import { useToast } from "@/components/ToastProvider";
import Dialog from "@/components/Dialog";
import ResultDialog from "@/components/ResultDialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import InviteVentureGuest from "@/components/InviteVentureGuest";
import LogoUpload from "@/components/LogoUpload";
import CopyButton from "@/components/CopyButton";
import type { OrgMember, Venture, VentureMember } from "@/lib/types";

const EMPTY = "—";

type ProfileFieldKey =
  | "description"
  | "mission"
  | "vision"
  | "tagline"
  | "problem"
  | "solution"
  | "target_audience"
  | "industry"
  | "website";

const PROFILE_FIELDS: {
  key: ProfileFieldKey;
  label: string;
  multiline?: boolean;
  copyable?: boolean;
  link?: boolean;
}[] = [
  { key: "tagline", label: "Tagline", copyable: true },
  { key: "description", label: "Description", multiline: true, copyable: true },
  { key: "mission", label: "Mission", multiline: true, copyable: true },
  { key: "vision", label: "Vision", multiline: true, copyable: true },
  { key: "problem", label: "Problem", multiline: true, copyable: true },
  { key: "solution", label: "Solution", multiline: true, copyable: true },
  { key: "target_audience", label: "Target audience", multiline: true, copyable: true },
  { key: "industry", label: "Industry", copyable: true },
  { key: "website", label: "Website", copyable: true, link: true }
];

function displayValue(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : EMPTY;
}

function ensureHref(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

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
  onSave: (fields: Partial<Venture>) => Promise<{ ok: true } | { ok: false; message: string }>;
}) {
  const router = useRouter();
  const toast = useToast();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [name, setName] = useState(venture.name);
  const [fields, setFields] = useState<Record<ProfileFieldKey, string>>(() =>
    profileDraftFromVenture(venture)
  );
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ variant: "success" | "error"; message: string } | null>(
    null
  );
  const [pendingRemove, setPendingRemove] = useState<VentureMember | null>(null);

  const orgMemberIds = new Set(orgMembers.map((m) => m.user_id));
  const externalGuests = ventureMembers.filter((m) => !orgMemberIds.has(m.user_id));

  function openDetails() {
    setName(venture.name);
    setFields(profileDraftFromVenture(venture));
    setDetailsOpen(true);
  }

  async function saveDetails() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.warning("Venture name can't be empty.");
      return;
    }
    setSaving(true);
    const payload: Partial<Venture> = { name: trimmedName };
    for (const { key } of PROFILE_FIELDS) {
      payload[key] = fields[key].trim() || null;
    }
    const outcome = await onSave(payload);
    setSaving(false);
    if (!outcome.ok) {
      setResult({ variant: "error", message: outcome.message });
      return;
    }
    setDetailsOpen(false);
    setResult({ variant: "success", message: "Venture details saved." });
  }

  async function handleLogoUploaded(url: string) {
    const outcome = await onSave({ logo_url: url });
    if (!outcome.ok) {
      toast.error(`Could not save logo: ${outcome.message}`);
      return;
    }
    toast.success("Logo updated.");
  }

  async function confirmRemoveGuest() {
    if (!pendingRemove) return;
    const memberId = pendingRemove.id;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("venture_members").delete().eq("id", memberId);
    setBusy(false);
    setPendingRemove(null);
    if (error) {
      setResult({ variant: "error", message: error.message });
      return;
    }
    setResult({ variant: "success", message: "Collaborator removed." });
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="panel p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="eyebrow">Venture details</p>
          {canManage && (
            <button className="btn-ghost shrink-0" onClick={openDetails}>
              Edit details
            </button>
          )}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <LogoUpload
            bucket="venture-logos"
            path={venture.id}
            currentUrl={venture.logo_url}
            canEdit={canManage}
            onUploaded={handleLogoUploaded}
            fallbackInitial={venture.name.charAt(0).toUpperCase()}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-display text-base font-semibold">{venture.name}</p>
              <CopyButton value={venture.name} label="Name" />
            </div>
            <p className="mt-0.5 text-xs text-fg-faint">{CATEGORY_LABEL[venture.category]}</p>
          </div>
        </div>

        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          {PROFILE_FIELDS.map((field) => {
            const raw = venture[field.key];
            const shown = displayValue(raw);
            const hasValue = shown !== EMPTY;
            return (
              <div
                key={field.key}
                className={field.multiline ? "sm:col-span-2" : undefined}
              >
                <dt className="text-xs text-fg-muted">{field.label}</dt>
                <dd className="mt-1 flex items-start gap-1.5">
                  {field.link && hasValue ? (
                    <a
                      href={ensureHref(raw!.trim())}
                      target="_blank"
                      rel="noreferrer"
                      className="min-w-0 flex-1 break-all text-sm text-signal-blue hover:underline"
                    >
                      {shown}
                    </a>
                  ) : (
                    <p
                      className={`min-w-0 flex-1 text-sm whitespace-pre-wrap ${
                        hasValue ? "text-fg" : "text-fg-faint"
                      }`}
                    >
                      {shown}
                    </p>
                  )}
                  {field.copyable && hasValue && (
                    <CopyButton value={raw!.trim()} label={field.label} />
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
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
                <div className="flex items-center gap-1">
                  <p className="truncate text-xs text-fg-faint">{m.profiles?.email}</p>
                  {m.profiles?.email && (
                    <CopyButton value={m.profiles.email} label="Email" />
                  )}
                </div>
              </div>
              <span className="chip text-fg-faint">Collaborator</span>
              {canManage && (
                <button
                  type="button"
                  className="btn-ghost px-2 py-1 text-xs text-signal-red"
                  onClick={() => setPendingRemove(m)}
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

      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)}>
        <p className="eyebrow mb-1">Venture details</p>
        <h2 className="font-display text-xl font-semibold">Edit venture details</h2>

        <div className="mt-5 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          <div>
            <label className="mb-1.5 block text-xs text-fg-muted">Name</label>
            <input
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          {PROFILE_FIELDS.map((field) => (
            <div key={field.key}>
              <label className="mb-1.5 block text-xs text-fg-muted">{field.label}</label>
              {field.multiline ? (
                <textarea
                  className="field min-h-[72px] resize-y"
                  value={fields[field.key]}
                  onChange={(e) =>
                    setFields((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  placeholder={`Optional ${field.label.toLowerCase()}`}
                />
              ) : (
                <input
                  className="field"
                  value={fields[field.key]}
                  onChange={(e) =>
                    setFields((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  placeholder={
                    field.key === "website"
                      ? "https://…"
                      : `Optional ${field.label.toLowerCase()}`
                  }
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setDetailsOpen(false)}>
            Cancel
          </button>
          <button className="btn-primary" onClick={saveDetails} disabled={saving}>
            {saving ? "Saving…" : "Save details"}
          </button>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!pendingRemove}
        message={`Remove ${
          pendingRemove?.profiles?.full_name ?? pendingRemove?.profiles?.email ?? "this collaborator"
        } from this venture?`}
        confirmLabel="Remove"
        busy={busy}
        onConfirm={confirmRemoveGuest}
        onCancel={() => setPendingRemove(null)}
      />

      <ResultDialog
        open={!!result}
        variant={result?.variant ?? "success"}
        message={result?.message ?? ""}
        onClose={() => setResult(null)}
      />
    </div>
  );
}

function profileDraftFromVenture(venture: Venture): Record<ProfileFieldKey, string> {
  return {
    description: venture.description ?? "",
    mission: venture.mission ?? "",
    vision: venture.vision ?? "",
    tagline: venture.tagline ?? "",
    problem: venture.problem ?? "",
    solution: venture.solution ?? "",
    target_audience: venture.target_audience ?? "",
    industry: venture.industry ?? "",
    website: venture.website ?? ""
  };
}

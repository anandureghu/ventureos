"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import type { MyOrg } from "@/lib/data";

export default function WorkspaceSwitcher({
  orgs,
  activeOrgId
}: {
  orgs: MyOrg[];
  activeOrgId: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const active = orgs.find((item) => item.org.id === activeOrgId) ?? orgs[0];

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setCreating(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function switchTo(orgId: string) {
    if (orgId === activeOrgId) {
      setOpen(false);
      return;
    }
    setBusy(true);
    const res = await fetch("/api/workspace/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId })
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Could not switch workspace");
      return;
    }
    setOpen(false);
    router.push("/dashboard");
    router.refresh();
  }

  async function createWorkspace() {
    if (!newName.trim()) {
      toast.warning("Enter a workspace name first.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/workspace/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() })
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Could not create workspace");
      return;
    }
    setNewName("");
    setCreating(false);
    setOpen(false);
    toast.success("Workspace created.");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div ref={rootRef} className="relative px-2">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          setCreating(false);
        }}
        className="flex w-full items-center gap-2 rounded-lg border border-ink-500 bg-ink-700 px-2.5 py-2 text-left transition-colors hover:bg-ink-600"
        disabled={busy}
      >
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-signal-violet/20 font-mono text-xs font-semibold text-signal-violet">
          {active.org.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-fg">{active.org.name}</p>
          <p className="truncate text-[10px] text-fg-faint">
            {orgs.length} workspace{orgs.length === 1 ? "" : "s"}
          </p>
        </div>
        <span className="text-[10px] text-fg-faint">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div className="absolute left-2 right-2 top-full z-50 mt-1 rounded-lg border border-ink-500 bg-ink-700 py-1 shadow-xl">
          <p className="px-3 py-1.5 eyebrow">Workspaces</p>
          {orgs.map((item) => {
            const isActive = item.org.id === activeOrgId;
            return (
              <button
                key={item.org.id}
                type="button"
                onClick={() => switchTo(item.org.id)}
                disabled={busy}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-ink-600 ${
                  isActive ? "text-fg" : "text-fg-muted"
                }`}
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-ink-600 font-mono text-[10px]">
                  {item.org.name.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1 truncate">{item.org.name}</span>
                {isActive && (
                  <span className="text-[10px] text-signal-violet">●</span>
                )}
              </button>
            );
          })}

          <div className="my-1 border-t border-ink-500" />

          {creating ? (
            <div className="px-3 py-2">
              <input
                className="field mb-2"
                placeholder="Acme Ventures"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") createWorkspace();
                  if (e.key === "Escape") setCreating(false);
                }}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-primary flex-1 py-1.5 text-xs"
                  onClick={createWorkspace}
                  disabled={busy || !newName.trim()}
                >
                  {busy ? "Creating…" : "Create"}
                </button>
                <button
                  type="button"
                  className="btn-ghost py-1.5 text-xs"
                  onClick={() => setCreating(false)}
                  disabled={busy}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-fg-muted transition-colors hover:bg-ink-600 hover:text-fg"
            >
              <span className="grid h-6 w-6 place-items-center rounded-md border border-dashed border-ink-500 text-xs">
                +
              </span>
              New workspace
            </button>
          )}
        </div>
      )}
    </div>
  );
}

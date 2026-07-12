"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import type { MyOrg } from "@/lib/data";

export default function AppShell({
  orgs,
  activeOrgId,
  userName,
  avatarUrl,
  children
}: {
  orgs: MyOrg[];
  activeOrgId: string;
  userName: string;
  avatarUrl: string | null;
  children: React.ReactNode;
}) {
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();
  const [renderedPathname, setRenderedPathname] = useState(pathname);

  if (pathname !== renderedPathname) {
    setRenderedPathname(pathname);
    setNavOpen(false);
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        orgs={orgs}
        activeOrgId={activeOrgId}
        userName={userName}
        avatarUrl={avatarUrl}
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />

      {navOpen && (
        <button
          aria-label="Close menu"
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-3 border-b border-ink-500 bg-ink-800 px-4 py-3 md:hidden">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setNavOpen(true)}
            className="btn-ghost px-2.5 py-1.5 text-base"
          >
            ☰
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" className="h-6 w-6 object-contain" />
          <span className="font-display text-sm font-semibold">VentureOS</span>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

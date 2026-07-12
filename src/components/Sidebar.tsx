"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { initials } from "@/lib/format";
import type { MyOrg } from "@/lib/data";
import WorkspaceSwitcher from "@/components/WorkspaceSwitcher";

const NAV = [
  { href: "/dashboard", label: "Command Center", icon: "▦" },
  { href: "/ventures", label: "Ventures", icon: "◆" },
  { href: "/calculators", label: "Calculators", icon: "∑" },
  { href: "/settings", label: "Workspace", icon: "⚙" }
];

export default function Sidebar({
  orgs,
  activeOrgId,
  userName,
  avatarUrl
}: {
  orgs: MyOrg[];
  activeOrgId: string;
  userName: string;
  avatarUrl: string | null;
}) {
  const pathname = usePathname();
  const accountActive = pathname === "/account" || pathname.startsWith("/account/");

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-ink-500 bg-ink-800 px-3 py-5">
      <div className="flex items-center gap-2.5 px-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="VentureOS" className="h-8 w-8 object-contain" />
        <div className="min-w-0">
          <p className="font-display text-sm font-semibold leading-none">VentureOS</p>
          <p className="mt-1 truncate text-[11px] text-fg-faint">Portfolio OS</p>
        </div>
      </div>

      <div className="mt-5">
        <WorkspaceSwitcher orgs={orgs} activeOrgId={activeOrgId} />
      </div>

      <nav className="mt-5 flex flex-col gap-1">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-ink-600 text-fg"
                  : "text-fg-muted hover:bg-ink-700 hover:text-fg"
              }`}
            >
              <span className="w-4 text-center text-fg-faint">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-1">
        <Link
          href="/account"
          className={`flex items-center gap-2.5 rounded-lg border px-2.5 py-2 transition-colors ${
            accountActive
              ? "border-signal-violet/40 bg-ink-600"
              : "border-ink-500 hover:bg-ink-700"
          }`}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-7 w-7 rounded-full" />
          ) : (
            <div className="grid h-7 w-7 place-items-center rounded-full bg-ink-600 font-mono text-[11px] text-fg-muted">
              {initials(userName)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{userName}</p>
            <p className="truncate text-[10px] text-fg-faint">Account settings</p>
          </div>
        </Link>
        <form action="/auth/signout" method="post">
          <button type="submit" className="btn-ghost w-full py-1.5 text-xs">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}

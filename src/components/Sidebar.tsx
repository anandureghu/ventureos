"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { initials } from "@/lib/format";

const NAV = [
  { href: "/dashboard", label: "Command Center", icon: "▦" },
  { href: "/ventures", label: "Ventures", icon: "◆" },
  { href: "/calculators", label: "Calculators", icon: "∑" },
  { href: "/settings", label: "Team & Settings", icon: "⚙" }
];

export default function Sidebar({
  orgName,
  userName,
  avatarUrl
}: {
  orgName: string;
  userName: string;
  avatarUrl: string | null;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-ink-500 bg-ink-800 px-3 py-5">
      <div className="flex items-center gap-2.5 px-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-signal-violet font-display text-base font-bold text-white">
          V
        </div>
        <div className="min-w-0">
          <p className="font-display text-sm font-semibold leading-none">VentureOS</p>
          <p className="mt-1 truncate text-[11px] text-fg-faint">{orgName}</p>
        </div>
      </div>

      <nav className="mt-7 flex flex-col gap-1">
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

      <div className="mt-auto">
        <div className="mb-3 flex items-center gap-2.5 rounded-lg border border-ink-500 px-2.5 py-2">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-7 w-7 rounded-full" />
          ) : (
            <div className="grid h-7 w-7 place-items-center rounded-full bg-ink-600 font-mono text-[11px] text-fg-muted">
              {initials(userName)}
            </div>
          )}
          <span className="min-w-0 truncate text-xs text-fg-muted">{userName}</span>
        </div>
        <form action="/auth/signout" method="post">
          <button type="submit" className="btn-ghost w-full py-1.5 text-xs">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}

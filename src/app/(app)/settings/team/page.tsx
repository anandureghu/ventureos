import { getSession, getMembers } from "@/lib/data";
import InviteMember from "@/components/InviteMember";
import { initials } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function WorkspaceTeamPage() {
  const { org, role } = await getSession();
  const members = await getMembers(org.id);
  const canInvite = role === "owner" || role === "admin";

  return (
    <div>
      {canInvite && (
        <div className="mb-5">
          <InviteMember orgId={org.id} />
        </div>
      )}

      <div className="panel divide-y divide-ink-500">
        <p className="px-5 py-3 eyebrow">Members · {members.length}</p>
        {members.map((m) => (
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
                {m.profiles?.full_name ?? m.profiles?.email ?? "Member"}
              </p>
              <p className="truncate text-xs text-fg-faint">{m.profiles?.email}</p>
            </div>
            <span className="chip">{m.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

import { getSession } from "@/lib/data";
import RenameWorkspace from "@/components/RenameWorkspace";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function WorkspaceGeneralPage() {
  const { org, role } = await getSession();
  const canEdit = role === "owner" || role === "admin";

  return (
    <div className="space-y-5">
      <RenameWorkspace
        orgId={org.id}
        initialName={org.name}
        canEdit={canEdit}
      />

      <div className="panel divide-y divide-ink-500">
        <div className="flex items-center justify-between px-5 py-3">
          <span className="text-sm text-fg-muted">Your role</span>
          <span className="chip">{role}</span>
        </div>
        <div className="flex items-center justify-between px-5 py-3">
          <span className="text-sm text-fg-muted">Created</span>
          <span className="font-mono text-xs text-fg-faint">
            {formatDate(org.created_at)}
          </span>
        </div>
        <div className="flex items-center justify-between px-5 py-3">
          <span className="text-sm text-fg-muted">Workspace ID</span>
          <span className="max-w-[200px] truncate font-mono text-[10px] text-fg-faint">
            {org.id}
          </span>
        </div>
      </div>
    </div>
  );
}

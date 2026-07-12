import SettingsTabs from "@/components/SettingsTabs";
import { getSession } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SettingsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { org } = await getSession();

  return (
    <div>
      <header className="mb-2">
        <p className="eyebrow mb-1.5">Workspace</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {org.name}
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          Settings for this workspace only. Switch workspaces from the sidebar to
          manage another group.
        </p>
      </header>

      <SettingsTabs />
      {children}
    </div>
  );
}

import { getSession } from "@/lib/data";
import ProfileSettings from "@/components/ProfileSettings";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const { profile } = await getSession();

  return (
    <div>
      <header className="mb-6">
        <p className="eyebrow mb-1.5">Account</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Your settings
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          Profile and preferences across all workspaces.
        </p>
      </header>

      <ProfileSettings profile={profile} />
    </div>
  );
}

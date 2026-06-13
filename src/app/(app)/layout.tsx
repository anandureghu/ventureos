import Sidebar from "@/components/Sidebar";
import { getSession } from "@/lib/data";

export default async function AppLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { profile, org, orgs } = await getSession();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        orgs={orgs}
        activeOrgId={org.id}
        userName={profile.full_name ?? profile.email ?? "You"}
        avatarUrl={profile.avatar_url}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}

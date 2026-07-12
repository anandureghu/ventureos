import AppShell from "@/components/AppShell";
import { getSession } from "@/lib/data";

export default async function AppLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { profile, org, orgs } = await getSession();

  return (
    <AppShell
      orgs={orgs}
      activeOrgId={org.id}
      userName={profile.full_name ?? profile.email ?? "You"}
      avatarUrl={profile.avatar_url}
    >
      {children}
    </AppShell>
  );
}

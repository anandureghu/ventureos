import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { OrgMember, Organization, Profile } from "@/lib/types";

export interface Session {
  userId: string;
  profile: Profile;
  org: Organization;
  role: OrgMember["role"];
}

async function loadMembership(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return { user: null, membership: null, org: null };

  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("role, org_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    console.error("[getSession] membership query:", membershipError.message);
  }

  if (!membership) {
    return { user, membership: null, org: null };
  }

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", membership.org_id)
    .maybeSingle();

  if (orgError) {
    console.error("[getSession] org query:", orgError.message);
  }

  return { user, membership, org: org ?? null };
}

/**
 * Resolves the signed-in user and their active workspace.
 * Bootstraps a workspace when the new-user trigger did not run (e.g. signed in
 * before migrations were applied).
 */
export async function getSession(): Promise<Session> {
  const supabase = await createClient();
  let { user, membership, org } = await loadMembership(supabase);

  if (!user) redirect("/login");

  if (!membership || !org) {
    const { error: bootstrapError } = await supabase.rpc(
      "bootstrap_my_workspace"
    );

    if (bootstrapError) {
      console.error("[getSession] bootstrap failed:", bootstrapError.message);
      redirect("/login?error=setup");
    }

    ({ membership, org } = await loadMembership(supabase));
  }

  if (!membership || !org) redirect("/login?error=setup");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return {
    userId: user.id,
    profile: (profile ?? {
      id: user.id,
      email: user.email ?? null,
      full_name: user.email?.split("@")[0] ?? null,
      avatar_url: null
    }) as Profile,
    org: org as Organization,
    role: membership.role as OrgMember["role"]
  };
}

export async function getMembers(orgId: string): Promise<OrgMember[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organization_members")
    .select("id, org_id, user_id, role, profiles(*)")
    .eq("org_id", orgId);
  return (data ?? []) as unknown as OrgMember[];
}

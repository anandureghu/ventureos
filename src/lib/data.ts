import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_ORG_COOKIE } from "@/lib/workspace";
import type { OrgMember, Organization, Profile } from "@/lib/types";

export interface MyOrg {
  org: Organization;
  role: OrgMember["role"];
}

export interface Session {
  userId: string;
  profile: Profile;
  org: Organization;
  role: OrgMember["role"];
  orgs: MyOrg[];
}

async function getMyOrganizations(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<MyOrg[]> {
  const { data, error } = await supabase
    .from("organization_members")
    .select("role, organizations(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getMyOrganizations]", error.message);
    return [];
  }

  return (data ?? [])
    .map((row) => {
      const orgData = row.organizations as Organization | Organization[] | null;
      const org = Array.isArray(orgData) ? orgData[0] : orgData;
      if (!org) return null;
      return { org, role: row.role as OrgMember["role"] };
    })
    .filter((item): item is MyOrg => item !== null);
}

async function resolveActiveOrg(
  orgs: MyOrg[],
  preferredOrgId?: string | null
): Promise<MyOrg | null> {
  if (orgs.length === 0) return null;

  if (preferredOrgId) {
    const match = orgs.find((item) => item.org.id === preferredOrgId);
    if (match) return match;
  }

  return orgs[0];
}

/**
 * Resolves the signed-in user and their active workspace.
 * Bootstraps a workspace when the new-user trigger did not run (e.g. signed in
 * before migrations were applied).
 */
export async function getSession(): Promise<Session> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let orgs = await getMyOrganizations(supabase, user.id);

  if (orgs.length === 0) {
    const { error: bootstrapError } = await supabase.rpc(
      "bootstrap_my_workspace"
    );

    if (bootstrapError) {
      console.error("[getSession] bootstrap failed:", bootstrapError.message);
      redirect("/login?error=setup");
    }

    orgs = await getMyOrganizations(supabase, user.id);
  }

  if (orgs.length === 0) redirect("/login?error=setup");

  const cookieStore = await cookies();
  const preferredOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value ?? null;
  const active = await resolveActiveOrg(orgs, preferredOrgId);

  if (!active) redirect("/login?error=setup");

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
    org: active.org,
    role: active.role,
    orgs
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

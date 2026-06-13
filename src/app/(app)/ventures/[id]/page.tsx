import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSession, getMembers } from "@/lib/data";
import VentureWorkspace from "@/components/VentureWorkspace";
import type { Note, Task, Transaction, Venture } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function VenturePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { org, userId } = await getSession();
  const supabase = await createClient();

  const { data: venture } = await supabase
    .from("ventures")
    .select("*")
    .eq("id", id)
    .single();

  if (!venture || venture.org_id !== org.id) notFound();

  const [{ data: tasks }, { data: txns }, { data: notes }, members] =
    await Promise.all([
      supabase
        .from("tasks")
        .select("*")
        .eq("venture_id", id)
        .order("position", { ascending: true }),
      supabase
        .from("transactions")
        .select("*")
        .eq("venture_id", id)
        .order("occurred_on", { ascending: false }),
      supabase
        .from("notes")
        .select("*")
        .eq("venture_id", id)
        .order("created_at", { ascending: false }),
      getMembers(org.id)
    ]);

  return (
    <div>
      <Link
        href="/ventures"
        className="mb-4 inline-block text-sm text-fg-muted hover:text-fg"
      >
        ← Ventures
      </Link>
      <VentureWorkspace
        initialVenture={venture as Venture}
        tasks={(tasks ?? []) as Task[]}
        transactions={(txns ?? []) as Transaction[]}
        notes={(notes ?? []) as Note[]}
        members={members}
        userId={userId}
      />
    </div>
  );
}

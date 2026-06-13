import GoogleButton from "@/components/GoogleButton";

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const { error } = (await searchParams) ?? {};

  return (
    <main className="relative flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-signal-violet font-display text-lg font-bold text-white">
            V
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">
            VentureOS
          </span>
        </div>

        <div className="panel p-7">
          <p className="eyebrow mb-3">Command center · Sign in</p>
          <h1 className="font-display text-2xl font-semibold leading-tight">
            Run every idea from one cockpit.
          </h1>
          <p className="mt-2 text-sm text-fg-muted">
            Track each venture&apos;s stage, tasks, money, and next move — with your
            co-founder, in real time.
          </p>

          {error === "auth" && (
            <p className="mt-4 rounded-lg border border-signal-rose/30 bg-signal-rose/10 px-3 py-2 text-sm text-signal-rose">
              Sign-in failed. Clear cookies for localhost and try again.
            </p>
          )}
          {error === "setup" && (
            <p className="mt-4 rounded-lg border border-signal-amber/30 bg-signal-amber/10 px-3 py-2 text-sm text-signal-amber">
              Your account exists but the workspace could not be created. Run{" "}
              <code className="text-xs">supabase db push</code> to apply the latest
              migration, then sign in again.
            </p>
          )}

          <div className="my-6 h-px bg-ink-500" />

          <GoogleButton />

          <p className="mt-4 text-center text-xs text-fg-faint">
            We use Google sign-in. Your first sign-in creates a workspace you can
            invite your partner into.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          {[
            ["Portfolio", "All ideas, ranked"],
            ["Pipeline", "Stage by stage"],
            ["Ledger", "Every rupee tracked"]
          ].map(([t, s]) => (
            <div key={t} className="panel px-3 py-3">
              <p className="font-display text-sm font-semibold">{t}</p>
              <p className="mt-0.5 text-[11px] text-fg-faint">{s}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 text-center">
      <div>
        <p className="eyebrow mb-3">No connection</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          You&apos;re offline
        </h1>
        <p className="mt-2 text-sm text-fg-muted">
          VentureOS needs a connection to load your workspace. Reconnect and try again.
        </p>
      </div>
    </main>
  );
}

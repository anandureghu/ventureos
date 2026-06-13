import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="stat-num text-5xl font-semibold text-signal-violet">404</p>
      <p className="text-fg-muted">That page isn&apos;t part of the portfolio.</p>
      <Link href="/dashboard" className="btn-primary">
        Back to Command Center
      </Link>
    </main>
  );
}

import { BackendStatusCard } from "@/features/backend-status/backend-status-card";

export default function Home() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 py-16 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.16),_transparent_55%)]"
      />
      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center">
        <header className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
            Digital POS
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Development workspace
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            Your point-of-sale platform starts here.
          </p>
        </header>
        <BackendStatusCard />
      </div>
    </main>
  );
}

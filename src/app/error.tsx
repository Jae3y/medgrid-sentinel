"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 p-6">
      <div className="card max-w-lg">
        <h1 className="text-lg font-bold text-white">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-400">
          The simulation engine is deterministic and side-effect free — reloading restores the
          exact same state. If this persists, run <span className="font-mono text-cyan">npm run build &amp;&amp; npm start</span>.
        </p>
        <p className="mt-3 rounded-lg border border-surface-border/60 bg-navy-950/60 p-2 font-mono text-[11px] text-slate-500">
          {error.message}
        </p>
        <button
          onClick={reset}
          className="mt-4 rounded-md bg-cyan/15 px-4 py-2 text-sm font-semibold text-cyan ring-1 ring-cyan/40 hover:bg-cyan/25"
        >
          Return to the dashboard
        </button>
      </div>
    </div>
  );
}

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 p-6">
      <div className="card max-w-lg text-center">
        <h1 className="text-lg font-bold text-white">Page not found</h1>
        <p className="mt-2 text-sm text-slate-400">
          This proof of concept is a single-page application — every view lives under{" "}
          <span className="font-mono text-cyan">/</span>.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-md bg-cyan/15 px-4 py-2 text-sm font-semibold text-cyan ring-1 ring-cyan/40 hover:bg-cyan/25"
        >
          Open the dashboard
        </Link>
      </div>
    </div>
  );
}

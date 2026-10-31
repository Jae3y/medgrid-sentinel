"use client";

import { useApp, type TabId } from "@/lib/store";
import { SUBMISSION_DEADLINE_WAT, countdownParts, fmtNum } from "@/lib/format";
import { scenarioById } from "@/engine";
import { clsx } from "clsx";
import {
  Activity,
  BatteryCharging,
  BookOpenCheck,
  BrainCircuit,
  FlaskConical,
  Landmark,
  ScrollText,
  Timer,
} from "lucide-react";
import { useEffect, useState } from "react";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <Activity size={16} /> },
  { id: "twin", label: "Digital Twin", icon: <BatteryCharging size={16} /> },
  { id: "scenarios", label: "Scenario Lab", icon: <FlaskConical size={16} /> },
  { id: "financials", label: "Financials", icon: <Landmark size={16} /> },
  { id: "intelligence", label: "Intelligence", icon: <BrainCircuit size={16} /> },
  { id: "brief", label: "Brief & Metrics", icon: <BookOpenCheck size={16} /> },
  { id: "sources", label: "Data & Sources", icon: <ScrollText size={16} /> },
];

function DeadlineChip() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const iv = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(iv);
  }, []);
  if (!now) return null;
  const { h, m } = countdownParts(now);
  return (
    <div className="flex items-center gap-2 rounded-lg border border-energy-amber/30 bg-energy-amber/10 px-3 py-1.5">
      <Timer size={14} className="shrink-0 text-energy-amber" />
      <div className="hidden leading-tight sm:block">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-energy-amber">
          Submission deadline
        </div>
        <div className="num text-xs font-semibold text-slate-200">
          {SUBMISSION_DEADLINE_WAT} · T−{h}h {String(m).padStart(2, "0")}m
        </div>
      </div>
      <div className="num text-xs font-semibold text-energy-amber sm:hidden">T−{h}h</div>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan to-navy-600 text-navy-950 shadow-[0_0_18px_-4px_rgba(34,211,238,0.55)]">
        <Activity size={18} strokeWidth={2.5} />
      </div>
      <div>
        <div className="text-sm font-bold tracking-wide text-white">MEDGRID SENTINEL</div>
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-cyan">
          Hospital Energy Resilience
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { tab, setTab, config, scenarioId, sim, lastRunMs } = useApp();
  const scenario = scenarioId === "custom" ? null : scenarioById(scenarioId);

  return (
    <div className="min-h-screen">
      {/* ---------- Desktop sidebar ---------- */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-surface-border/80 bg-navy-900/70 backdrop-blur md:flex">
        <div className="border-b border-surface-border/70 px-4 py-4">
          <Brand />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={clsx("tabbtn w-full", tab === t.id && "tabbtn-active")}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>
        <div className="space-y-2 border-t border-surface-border/70 p-3 text-[11px] leading-relaxed text-slate-500">
          {scenario && (
            <div className="rounded-lg border border-surface-border/60 bg-navy-950/60 px-2.5 py-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-cyan">
                Active scenario · {scenario.id}
              </div>
              <div className="mt-0.5 text-slate-400">{scenario.name.replace(/^[A-J] · /, "")}</div>
            </div>
          )}
          {scenarioId === "custom" && (
            <div className="rounded-lg border border-cyan/30 bg-cyan/5 px-2.5 py-2 text-[10px] font-semibold uppercase tracking-wider text-cyan">
              Custom configuration — live edits
            </div>
          )}
          <div>
            Anneru IAS Global Energy Hackathon 2026
            <br />
            Track 2 · Digital Solutions & AI · Setting B
            <br />
            Brief #13 · {config.facility.beds}-bed reference hospital
          </div>
          <div className="num rounded-lg border border-surface-border/60 bg-navy-950/60 px-2.5 py-2 font-mono text-[10px] text-slate-500">
            engine · {fmtNum(sim.steps.length)} steps{lastRunMs > 0 ? ` · ${lastRunMs.toFixed(0)} ms` : ""}
            <br />
            deterministic · seed {config.seed} · 58 tests
          </div>
        </div>
      </aside>

      {/* ---------- Mobile top nav ---------- */}
      <div className="sticky top-0 z-30 border-b border-surface-border/80 bg-navy-950/90 backdrop-blur md:hidden">
        <div className="flex items-center justify-between px-4 pt-3">
          <Brand />
          <DeadlineChip />
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 py-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={clsx(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium",
                tab === t.id ? "bg-navy-800 text-white ring-1 ring-cyan/40" : "text-slate-400"
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="md:ml-60">
        <header className="sticky top-0 z-10 hidden items-center justify-between gap-4 border-b border-surface-border/80 bg-navy-950/85 px-6 py-3 backdrop-blur md:flex">
          <div>
            <h1 className="text-base font-bold text-white">Intelligent Hospital Microgrid Digital Twin</h1>
            <p className="text-xs text-slate-400">
              Predictive Energy Resilience · Uninterrupted Critical Care — every value simulated
              live from the documented engineering model
            </p>
          </div>
          <DeadlineChip />
        </header>
        <main className="mx-auto max-w-[1440px] p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

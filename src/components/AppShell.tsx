"use client";

import { useApp, type TabId } from "@/lib/store";
import { SUBMISSION_DEADLINE_WAT, countdownParts } from "@/lib/format";
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
      <Timer size={14} className="text-energy-amber" />
      <div className="leading-tight">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-energy-amber">
          Submission deadline
        </div>
        <div className="text-xs font-semibold text-slate-200">
          {SUBMISSION_DEADLINE_WAT} · T−{h}h {String(m).padStart(2, "0")}m
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { tab, setTab, config, scenarioId } = useApp();
  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-60 flex-col border-r border-surface-border bg-navy-900/80 backdrop-blur">
        <div className="border-b border-surface-border px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan to-navy-600 text-navy-950">
              <Activity size={18} strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-sm font-bold tracking-wide text-white">
                MEDGRID SENTINEL
              </div>
              <div className="text-[10px] font-medium uppercase tracking-widest text-cyan">
                Hospital Energy Resilience
              </div>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={clsx("tabbtn w-full", tab === t.id && "tabbtn-active")}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-surface-border p-3 text-[11px] leading-relaxed text-slate-500">
          Anneru IAS Global Energy Hackathon 2026
          <br />
          Track 2 · Digital Solutions & AI · Setting B
          <br />
          Brief #13 · {scenarioId === "custom" ? "Custom configuration" : `Scenario ${scenarioId}`}
          <br />
          <span className="text-slate-400">{config.facility.name}</span>
        </div>
      </aside>
      <div className="ml-60 flex-1">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-surface-border bg-navy-950/85 px-6 py-3 backdrop-blur">
          <div>
            <h1 className="text-base font-bold text-white">
              Intelligent Hospital Microgrid Digital Twin
            </h1>
            <p className="text-xs text-slate-400">
              Predictive Energy Resilience · Uninterrupted Critical Care — proof of concept, all
              values simulated from the documented engineering model
            </p>
          </div>
          <DeadlineChip />
        </header>
        <main className="mx-auto max-w-[1400px] p-6">{children}</main>
      </div>
    </div>
  );
}

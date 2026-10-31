"use client";

import { useApp, type TabId } from "@/lib/store";
import { fmtNum } from "@/lib/format";
import { clsx } from "clsx";
import {
  Activity,
  BatteryCharging,
  BookOpenCheck,
  BrainCircuit,
  Dice5,
  FlaskConical,
  Landmark,
  Network,
  ScrollText,
  Siren,
} from "lucide-react";
import { OfflineStatus } from "./OfflineStatus";

interface NavItem {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  title: string;
  lede: string;
}

const GROUPS: { name: string; items: NavItem[] }[] = [
  {
    name: "Brief #13",
    items: [
      { id: "mission", label: "Line outage replay", icon: <Siren size={16} />, title: "Maiduguri, 39 days without the 330 kV line", lede: "Four controllers, one hospital, the same diesel trucks. Measured weather, simulated care." },
      { id: "resilience", label: "Resilience lab", icon: <Dice5 size={16} />, title: "The next outage, run three hundred times", lede: "Generator failures from published reliability data, late convoys, three years of real weather." },
    ],
  },
  {
    name: "Plant",
    items: [
      { id: "dashboard", label: "Live dashboard", icon: <Activity size={16} />, title: "Plant dashboard", lede: "One-line diagram, power flows and state of charge for the active stress scenario." },
      { id: "twin", label: "Digital twin", icon: <BatteryCharging size={16} />, title: "Digital twin", lede: "Every load, panel, cell and generator setting is editable; results recompute instantly." },
      { id: "scenarios", label: "Stress scenarios", icon: <FlaskConical size={16} />, title: "Stress scenarios", lede: "Ten short, deterministic tests — including the ones the system fails." },
    ],
  },
  {
    name: "Business",
    items: [
      { id: "financials", label: "Financials", icon: <Landmark size={16} />, title: "What it costs, who pays, what it earns", lede: "A full measured operating year priced over twenty years — ownership and energy-as-a-service." },
      { id: "fleet", label: "Fleet & scale", icon: <Network size={16} />, title: "Where it pays, and where it only nearly pays", lede: "Ten facility-years on each city's own weather and grid." },
    ],
  },
  {
    name: "Evidence",
    items: [
      { id: "intelligence", label: "Forecasting & AI", icon: <BrainCircuit size={16} />, title: "Forecasting, tested on data it never saw", lede: "What is learned, what is rule-based, and why the two are kept apart." },
      { id: "brief", label: "Brief & metrics", icon: <BookOpenCheck size={16} />, title: "The brief, the metric, the answers", lede: "The seven questions judges cannot ask live, answered with computed numbers." },
      { id: "sources", label: "Data & sources", icon: <ScrollText size={16} />, title: "Data and sources", lede: "Every external number, where it came from, and how sure we are." },
    ],
  },
];

const ALL = GROUPS.flatMap((g) => g.items);

function Mark() {
  // A bus bar crossed by a heartbeat: power and care on one line.
  return (
    <svg viewBox="0 0 40 40" className="h-9 w-9 shrink-0" aria-hidden>
      <rect x="1" y="1" width="38" height="38" rx="10" fill="#13292C" stroke="#24474A" />
      <path d="M7 22h7l3-9 5 15 3-8 2 2h6" fill="none" stroke="#45E0A0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 30h26" stroke="#F2C14E" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <Mark />
      <div className="leading-none">
        <div className="display text-[19px] font-bold text-white">MedGrid Sentinel</div>
        <div className="mt-1 text-[11.5px] text-slate-400">Fuel-aware hospital microgrids</div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { tab, setTab, sim, lastRunMs } = useApp();
  const active = ALL.find((i) => i.id === tab) ?? ALL[0];

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-surface-border/60 bg-navy-900 md:flex">
        <div className="px-5 pb-5 pt-6">
          <Brand />
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4" aria-label="Sections">
          {GROUPS.map((g) => (
            <div key={g.name}>
              <div className="px-3 pb-1.5 text-[11.5px] font-semibold text-slate-500">{g.name}</div>
              <div className="space-y-0.5">
                {g.items.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    aria-current={tab === t.id ? "page" : undefined}
                    className={clsx("tabbtn w-full", tab === t.id && "tabbtn-active")}
                  >
                    <span className={tab === t.id ? "text-cyan" : "text-slate-500"}>{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="space-y-2 border-t border-surface-border/60 px-5 py-4 text-[11.5px] leading-relaxed text-slate-500">
          <div>
            Global Energy Hackathon 2026
            <br />
            Brief #13 · Track 2 Digital Solutions &amp; AI · Setting B
          </div>
          <div className="num">
            Engine {fmtNum(sim.steps.length)} steps{lastRunMs > 0 ? `, ${lastRunMs.toFixed(0)} ms` : ""} · 89 tests
          </div>
          <OfflineStatus />
        </div>
      </aside>

      {/* Mobile */}
      <div className="sticky top-0 z-30 border-b border-surface-border/60 bg-navy-950/95 backdrop-blur md:hidden">
        <div className="px-4 pt-3">
          <Brand />
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 py-2.5" aria-label="Sections">
          {ALL.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={clsx("flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium", tab === t.id ? "bg-navy-800 text-white ring-1 ring-cyan/40" : "text-slate-400")}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="md:ml-64">
        <header className="mx-auto max-w-[1480px] px-4 pb-1 pt-6 md:px-8 md:pt-8">
          <h1 className="display text-[30px] font-bold leading-[1.05] text-white md:text-[40px]">{active.title}</h1>
          <p className="mt-2 max-w-[70ch] text-[15px] text-slate-400">{active.lede}</p>
        </header>
        <main className="mx-auto max-w-[1480px] px-4 pb-10 pt-5 md:px-8">{children}</main>
      </div>
    </div>
  );
}

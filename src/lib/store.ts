"use client";

import { create } from "zustand";
import {
  compareAgainstBaseline,
  compareStrategies,
  defaultConfig,
  evaluateEconomics,
  lineOutageConfig,
  scenarioById,
  DEFAULT_FINANCIAL,
  DEFAULT_LINE_OUTAGE,
  type EconomicResult,
  type FinancialConfig,
  type LineOutageOptions,
  type SimResult,
  type Strategy,
  type SystemConfig,
} from "@/engine";

export type TabId =
  | "mission"
  | "resilience"
  | "dashboard"
  | "twin"
  | "scenarios"
  | "financials"
  | "fleet"
  | "intelligence"
  | "brief"
  | "sources";

/** Extra stress toggles for the line-outage replay (all default off). */
export interface MissionStress {
  /** Generator fails after this many run-hours (0 = never). */
  gensetFailAtRunHours: number;
  repairHours: number;
  /** Cancel the delivery with this index (−1 = none). */
  missedDelivery: number;
}

export const DEFAULT_STRESS: MissionStress = { gensetFailAtRunHours: 0, repairHours: 72, missedDelivery: -1 };

interface AppState {
  tab: TabId;
  config: SystemConfig;
  scenarioId: string;
  sim: SimResult;
  baseline: SimResult;
  econ: EconomicResult | null;
  econBusy: boolean;
  fin: FinancialConfig;
  playing: boolean;
  stepIndex: number;
  dayView: number;
  lastRunMs: number;
  mission: Partial<LineOutageOptions>;
  stress: MissionStress;
  missionResults: Record<Strategy, SimResult> | null;
  missionMs: number;
  setTab: (t: TabId) => void;
  runScenario: (id: string) => void;
  updateConfig: (mutate: (c: SystemConfig) => void) => void;
  setFin: (patch: Partial<FinancialConfig>) => void;
  ensureEcon: () => void;
  togglePlay: () => void;
  setStep: (i: number) => void;
  setDayView: (d: number) => void;
  setMission: (patch: Partial<LineOutageOptions>) => void;
  setStress: (patch: Partial<MissionStress>) => void;
  runMission: () => void;
}

export function missionConfig(m: Partial<LineOutageOptions>, stress: MissionStress): SystemConfig {
  const cfg = lineOutageConfig({
    ...m,
    missedDeliveries: stress.missedDelivery >= 0 ? [stress.missedDelivery] : [],
  });
  if (stress.gensetFailAtRunHours > 0) {
    cfg.reliability = { failToStartOnOutage: [], runFailureAtRunHours: [stress.gensetFailAtRunHours], repairHours: stress.repairHours };
  }
  return cfg;
}

function computeSim(cfg: SystemConfig) {
  const t0 = performance.now();
  const { proposed, baseline } = compareAgainstBaseline(cfg);
  return { sim: proposed, baseline, lastRunMs: performance.now() - t0 };
}

const initialCfg = defaultConfig();
// Initial results are computed synchronously, but the measured wall-clock time is
// intentionally NOT displayed until a client-side run occurs (a module-load timing
// value differs between SSR and hydration and would trip React error #418).
const initial = computeSim(initialCfg);
const initialMission = compareStrategies(missionConfig({}, DEFAULT_STRESS));

let econTimer: ReturnType<typeof setTimeout> | null = null;

export const useApp = create<AppState>((set, get) => ({
  tab: "mission",
  config: initialCfg,
  scenarioId: "J",
  sim: initial.sim,
  baseline: initial.baseline,
  econ: null,
  econBusy: false,
  fin: DEFAULT_FINANCIAL,
  playing: false,
  stepIndex: 0,
  dayView: 1,
  lastRunMs: 0,
  mission: { ...DEFAULT_LINE_OUTAGE },
  stress: DEFAULT_STRESS,
  missionResults: initialMission,
  missionMs: 0,
  setTab: (t) => set({ tab: t }),
  runScenario: (id) => {
    const cfg = scenarioById(id).build();
    set({ scenarioId: id, config: cfg, ...computeSim(cfg), playing: false, stepIndex: 0, dayView: Math.min(1, cfg.horizonDays - 1), econ: null });
    get().ensureEcon();
  },
  updateConfig: (mutate) => {
    const cfg = structuredClone(get().config);
    mutate(cfg);
    set({ config: cfg, scenarioId: "custom", ...computeSim(cfg), stepIndex: 0, playing: false, econ: null });
    get().ensureEcon();
  },
  setFin: (patch) => {
    set({ fin: { ...get().fin, ...patch }, econ: null });
    get().ensureEcon();
  },
  /** Full-year economics (two 35,136-step simulations) — scheduled off the input path. */
  ensureEcon: () => {
    if (econTimer) clearTimeout(econTimer);
    set({ econBusy: true });
    econTimer = setTimeout(() => {
      const t0 = performance.now();
      const econ = evaluateEconomics(get().config, get().fin);
      set({ econ, econBusy: false, lastRunMs: performance.now() - t0 });
    }, 30);
  },
  togglePlay: () => set((s) => ({ playing: !s.playing })),
  setStep: (i) => set({ stepIndex: i, playing: false }),
  setDayView: (d) => set({ dayView: d }),
  setMission: (patch) => {
    set({ mission: { ...get().mission, ...patch } });
    get().runMission();
  },
  setStress: (patch) => {
    set({ stress: { ...get().stress, ...patch } });
    get().runMission();
  },
  runMission: () => {
    const t0 = performance.now();
    const res = compareStrategies(missionConfig(get().mission, get().stress));
    set({ missionResults: res, missionMs: performance.now() - t0 });
  },
}));

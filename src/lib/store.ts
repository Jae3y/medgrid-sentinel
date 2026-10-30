"use client";

import { create } from "zustand";
import {
  compareAgainstBaseline,
  defaultConfig,
  evaluateEconomics,
  runSimulation,
  scenarioById,
  DEFAULT_FINANCIAL,
  type EconomicResult,
  type FinancialConfig,
  type SimResult,
  type SystemConfig,
} from "@/engine";

export type TabId =
  | "dashboard"
  | "twin"
  | "scenarios"
  | "financials"
  | "intelligence"
  | "brief"
  | "sources";

interface AppState {
  tab: TabId;
  config: SystemConfig;
  scenarioId: string;
  sim: SimResult;
  baseline: SimResult;
  econ: EconomicResult;
  fin: FinancialConfig;
  playing: boolean;
  stepIndex: number;
  dayView: number;
  lastRunMs: number;
  setTab: (t: TabId) => void;
  runScenario: (id: string) => void;
  updateConfig: (mutate: (c: SystemConfig) => void) => void;
  setFin: (patch: Partial<FinancialConfig>) => void;
  togglePlay: () => void;
  setStep: (i: number) => void;
  setDayView: (d: number) => void;
}

function computeAll(cfg: SystemConfig, fin: FinancialConfig) {
  const { proposed, baseline } = compareAgainstBaseline(cfg);
  const econ = evaluateEconomics(cfg, fin);
  return { sim: proposed, baseline, econ };
}

const initialCfg = defaultConfig();
const initial = computeAll(initialCfg, DEFAULT_FINANCIAL);

export const useApp = create<AppState>((set, get) => ({
  tab: "dashboard",
  config: initialCfg,
  scenarioId: "J",
  sim: initial.sim,
  baseline: initial.baseline,
  econ: initial.econ,
  fin: DEFAULT_FINANCIAL,
  playing: false,
  stepIndex: 0,
  dayView: 1,
  lastRunMs: 0,
  setTab: (t) => set({ tab: t }),
  runScenario: (id) => {
    const cfg = scenarioById(id).build();
    const r = computeAll(cfg, get().fin);
    set({
      scenarioId: id,
      config: cfg,
      ...r,
      playing: false,
      stepIndex: 0,
      dayView: Math.min(1, cfg.horizonDays - 1),
    });
  },
  updateConfig: (mutate) => {
    const cfg = structuredClone(get().config);
    mutate(cfg);
    const r = computeAll(cfg, get().fin);
    set({ config: cfg, scenarioId: "custom", ...r, stepIndex: 0, playing: false });
  },
  setFin: (patch) => {
    const fin = { ...get().fin, ...patch };
    const econ = evaluateEconomics(get().config, fin);
    set({ fin, econ });
  },
  togglePlay: () => set((s) => ({ playing: !s.playing })),
  setStep: (i) => set({ stepIndex: i, playing: false }),
  setDayView: (d) => set({ dayView: d }),
}));

/**
 * Transparent grid-search sizing optimizer (heuristic — not a proven global optimum).
 *
 * For each PV × battery combination (inverter scaled to the array, generator unchanged):
 *   1. Resilience test — the Brief #13 Maiduguri line-outage replay on measured weather
 *      at the constrained fuel supply, under Sentinel dispatch. Feasible only if Tier-1 is
 *      maintained for every outage hour AND critical (Tier 1+2) service for ≥ the target
 *      share of outage hours.
 *   2. Economics — full-year simulation and 20-year lifecycle cash flows.
 * Feasible designs are ranked by NPV (best value per naira, not biggest system).
 */

import type { SystemConfig } from "./types";
import { runSimulation } from "./simulate";
import { lineOutageConfig, DEFAULT_LINE_OUTAGE, MAIDUGURI_EVENT, type LineOutageOptions } from "./scenarios";
import { evaluateEconomics, crf, type FinancialConfig, DEFAULT_FINANCIAL } from "./financial";

export interface SizingCandidate {
  pvKwp: number;
  batteryKwh: number;
  inverterKw: number;
  /** Strict critical-service hours maintained in the replay. */
  criticalServiceHours: number;
  tier1Hours: number;
  outageHours: number;
  criticalServiceFraction: number;
  replayDieselLitres: number;
  /** Annual diesel avoided vs the diesel-only baseline (share). */
  dieselAvoidedPct: number;
  annualOpexNaira: number;
  capexNaira: number;
  npvNaira: number;
  paybackYears: number | null;
  totalAnnualizedCostNaira: number;
  renewableShare: number;
  feasible: boolean;
}

export interface SizingResult {
  candidates: SizingCandidate[];
  best: SizingCandidate | null;
  target: string;
}

export interface SizingOptions {
  pvValues?: number[];
  batteryValues?: number[];
  criticalShareTarget?: number;
  weeklySupplyLitres?: number;
  fin?: FinancialConfig;
}

export const DEFAULT_PV_GRID = [150, 300, 450, 600];
export const DEFAULT_BATTERY_GRID = [300, 600, 900, 1200];

export function evaluateCandidate(
  base: SystemConfig,
  pvKwp: number,
  batteryKwh: number,
  o: Required<Omit<SizingOptions, "pvValues" | "batteryValues">>
): SizingCandidate {
  const inverterKw = Math.max(150, Math.round(Math.max(pvKwp * 0.85, batteryKwh / 3) / 10) * 10);
  const replayOpts: Partial<LineOutageOptions> = {
    pvKwp,
    batteryKwh,
    inverterKw,
    gensetKw: base.genset.ratedKw || DEFAULT_LINE_OUTAGE.gensetKw,
    weeklySupplyLitres: o.weeklySupplyLitres,
    strategy: "sentinel",
  };
  const replay = runSimulation({ ...lineOutageConfig(replayOpts), facility: base.facility });
  const m = replay.metrics;
  const hw: SystemConfig = {
    ...structuredClone(base),
    pv: { ...base.pv, kwp: pvKwp },
    battery: { ...base.battery, nominalKwh: batteryKwh, maxChargeKw: Math.max(50, Math.round(batteryKwh / 3)), maxDischargeKw: Math.max(50, Math.round(batteryKwh / 3)) },
    inverter: { ratedKw: inverterKw },
  };
  const econ = evaluateEconomics(hw, o.fin);
  const outageH = MAIDUGURI_EVENT.outageDays * 24;
  const critShare = m.criticalMaintainedHours / outageH;
  return {
    pvKwp,
    batteryKwh,
    inverterKw,
    criticalServiceHours: Math.round(m.criticalMaintainedHours * 100) / 100,
    tier1Hours: Math.round(m.tier1MaintainedHours * 100) / 100,
    outageHours: outageH,
    criticalServiceFraction: Math.round(critShare * 1000) / 1000,
    replayDieselLitres: Math.round(m.dieselLitres),
    dieselAvoidedPct: Math.round(econ.dieselAvoidedPct * 1000) / 1000,
    annualOpexNaira: Math.round(econ.proposedAnnual.opexNaira),
    capexNaira: Math.round(econ.capex.totalNaira),
    npvNaira: Math.round(econ.npvNaira),
    paybackYears: econ.simplePaybackYears,
    totalAnnualizedCostNaira: Math.round(econ.proposedAnnual.opexNaira + econ.capex.totalNaira * crf(o.fin.financingRate, o.fin.financingYears)),
    renewableShare: Math.round(m.renewableShare * 1000) / 1000,
    feasible: m.tier1MaintainedHours >= outageH - 1e-9 && critShare >= o.criticalShareTarget,
  };
}

function resolve(options?: SizingOptions) {
  return {
    pvValues: options?.pvValues ?? DEFAULT_PV_GRID,
    batteryValues: options?.batteryValues ?? DEFAULT_BATTERY_GRID,
    rest: {
      criticalShareTarget: options?.criticalShareTarget ?? 0.99,
      weeklySupplyLitres: options?.weeklySupplyLitres ?? DEFAULT_LINE_OUTAGE.weeklySupplyLitres,
      fin: options?.fin ?? DEFAULT_FINANCIAL,
    },
  };
}

function rank(candidates: SizingCandidate[], o: ReturnType<typeof resolve>["rest"]): SizingResult {
  const feasible = candidates.filter((c) => c.feasible).sort((a, b) => b.npvNaira - a.npvNaira);
  const infeasible = candidates.filter((c) => !c.feasible).sort((a, b) => b.criticalServiceHours - a.criticalServiceHours);
  return {
    candidates: [...feasible, ...infeasible],
    best: feasible[0] ?? null,
    target: `Tier-1 maintained for all ${MAIDUGURI_EVENT.outageDays * 24} h AND critical service ≥ ${Math.round(o.criticalShareTarget * 100)}% of hours in the Maiduguri replay at ${o.weeklySupplyLitres.toLocaleString("en-US")} L/week; feasible designs ranked by ${o.fin.analysisYears}-yr NPV at ${Math.round(o.fin.discountRate * 100)}%`,
  };
}

export function searchSizing(base: SystemConfig, options?: SizingOptions): SizingResult {
  const r = resolve(options);
  const candidates: SizingCandidate[] = [];
  for (const pv of r.pvValues) for (const b of r.batteryValues) candidates.push(evaluateCandidate(base, pv, b, r.rest));
  return rank(candidates, r.rest);
}

/** Chunked variant for the browser (yields between candidates, reports progress). */
export async function searchSizingAsync(
  base: SystemConfig,
  options: SizingOptions | undefined,
  onProgress?: (done: number, total: number) => void
): Promise<SizingResult> {
  const r = resolve(options);
  const candidates: SizingCandidate[] = [];
  const total = r.pvValues.length * r.batteryValues.length;
  for (const pv of r.pvValues) {
    for (const b of r.batteryValues) {
      candidates.push(evaluateCandidate(base, pv, b, r.rest));
      onProgress?.(candidates.length, total);
      await new Promise((res) => setTimeout(res, 0));
    }
  }
  return rank(candidates, r.rest);
}

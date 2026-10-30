/**
 * Transparent grid-search sizing optimizer.
 *
 * Searches PV capacity × battery capacity combinations against the active scenario.
 * Feasibility requires BOTH brief metrics:
 *   1. critical-service continuity ≥ target during the outage window, and
 *   2. diesel litres avoided ≥ threshold vs the diesel-only baseline.
 * Feasible designs are ranked by TOTAL ANNUALIZED COST (operating cost + CapEx
 * recovered at the financing rate) — i.e. best value per naira, not biggest system.
 *
 * This is an exhaustive search over a small, explicit grid — documented as a
 * heuristic (not a proven global optimum) in docs/TECHNICAL_METHODOLOGY.md.
 */

import type { SystemConfig } from "./types";
import { buildBaselineConfig, runSimulation } from "./simulate";
import { evaluateEconomics, crf, type FinancialConfig, DEFAULT_FINANCIAL } from "./financial";

export interface SizingCandidate {
  pvKwp: number;
  batteryKwh: number;
  criticalServiceHours: number;
  outageHours: number;
  criticalServiceFraction: number;
  dieselLitres3Days: number;
  dieselAvoidedPct: number;
  annualOpexNaira: number;
  capexNaira: number;
  /** Operating cost + CapEx × CRF — the value-for-money ranking metric. */
  totalAnnualizedCostNaira: number;
  renewableShare: number;
  feasible: boolean;
}

export interface SizingResult {
  candidates: SizingCandidate[];
  best: SizingCandidate | null;
  target: string;
}

export function searchSizing(
  base: SystemConfig,
  options?: {
    pvValues?: number[];
    batteryValues?: number[];
    criticalHoursTarget?: number;
    dieselAvoidedTarget?: number;
    fin?: FinancialConfig;
  }
): SizingResult {
  const pvValues = options?.pvValues ?? [0, 100, 150, 200, 250, 300, 400];
  const batteryValues = options?.batteryValues ?? [0, 200, 400, 600, 800, 1000];
  const criticalHoursTarget = options?.criticalHoursTarget ?? 11.4; // of 12.5 islanded hours
  const dieselAvoidedTarget = options?.dieselAvoidedTarget ?? 0.3;
  const fin = options?.fin ?? DEFAULT_FINANCIAL;

  const baseline = runSimulation(buildBaselineConfig(base));
  const baseDiesel = Math.max(1, baseline.metrics.dieselLitres);

  const candidates: SizingCandidate[] = [];
  for (const pvKwp of pvValues) {
    for (const batteryKwh of batteryValues) {
      const cfg: SystemConfig = {
        ...structuredClone(base),
        pv: { ...base.pv, kwp: pvKwp },
        battery: {
          ...base.battery,
          nominalKwh: batteryKwh,
          maxChargeKw: Math.max(50, Math.round(batteryKwh / 3)),
          maxDischargeKw: Math.max(50, Math.round(batteryKwh / 3)),
        },
        inverter: { ratedKw: Math.max(250, Math.round(pvKwp * 0.8)) },
      };
      const sim = runSimulation(cfg);
      const m = sim.metrics;
      const econ = evaluateEconomics(cfg, fin);
      const crfVal = crf(fin.financingRate, fin.financingYears);
      candidates.push({
        pvKwp,
        batteryKwh,
        criticalServiceHours: Math.round(m.criticalServiceHours * 100) / 100,
        outageHours: Math.round(m.outageHours * 100) / 100,
        criticalServiceFraction:
          m.outageHours > 0 ? Math.round((m.criticalServiceHours / m.outageHours) * 1000) / 1000 : 0,
        dieselLitres3Days: Math.round(m.dieselLitres),
        dieselAvoidedPct: Math.round((1 - m.dieselLitres / baseDiesel) * 1000) / 1000,
        annualOpexNaira: Math.round(econ.proposedAnnual.opexNaira),
        capexNaira: Math.round(econ.capex.totalNaira),
        totalAnnualizedCostNaira: Math.round(
          econ.proposedAnnual.opexNaira + econ.capex.totalNaira * crfVal
        ),
        renewableShare: Math.round(m.renewableShare * 1000) / 1000,
        feasible:
          m.criticalServiceHours >= criticalHoursTarget &&
          1 - m.dieselLitres / baseDiesel >= dieselAvoidedTarget,
      });
    }
  }

  const feasible = candidates.filter((c) => c.feasible);
  feasible.sort((a, b) => a.totalAnnualizedCostNaira - b.totalAnnualizedCostNaira);
  const infeasible = candidates
    .filter((c) => !c.feasible)
    .sort((a, b) => b.criticalServiceHours - a.criticalServiceHours)
    .slice(0, 5);

  const outageH = Math.max(
    1e-9,
    ...base.grid.outageWindows.map((w) => Math.max(0, w.endHour - w.startHour) + base.grid.reconnectDelaySteps * 0.25)
  );

  return {
    candidates: [...feasible.slice(0, 10), ...infeasible],
    best: feasible[0] ?? null,
    target: `≥ ${criticalHoursTarget} critical-service hours of the ${outageH.toFixed(1)} islanded hours AND ≥ ${Math.round(
      dieselAvoidedTarget * 100
    )}% diesel avoided vs baseline; ranked by total annualized cost (opex + CapEx × CRF ${fin.financingRate
      .toString()
      .slice(2, 4)}%, ${fin.financingYears} yr)`,
  };
}

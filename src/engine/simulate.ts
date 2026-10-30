/**
 * Simulation orchestrator: runs the deterministic 15-minute-step model over the
 * configured horizon, aggregates metrics, and provides the baseline system builder
 * (grid + diesel only, no PV/battery) used for before/after comparison.
 */

import type {
  DayMetrics,
  SimResult,
  StepResult,
  SystemConfig,
} from "./types";
import { CO2_KG_PER_LITRE_DIESEL, STEP_HOURS } from "./types";
import { irradianceAt } from "./pv";
import { initialRuntime, stepSim } from "./dispatch";

export function runSimulation(cfg: SystemConfig): SimResult {
  const steps: StepResult[] = [];
  const events: ReturnType<typeof stepSim>["events"] = [];
  let rt = initialRuntime(cfg);

  const totalSteps = cfg.horizonDays * 96;
  for (let t = 0; t < totalSteps; t++) {
    const irr = irradianceAt(cfg.weather, Math.floor(t / 96), t, cfg.seed);
    const out = stepSim(cfg, rt, irr);
    rt = out.runtime;
    steps.push(out.step);
    events.push(...out.events);
  }

  const metrics = computeMetrics(steps);
  const perDay = computePerDay(steps);
  return { steps, events, metrics, perDay, config: cfg };
}

export function computeMetrics(steps: StepResult[]) {
  const m = {
    horizonHours: steps.length * STEP_HOURS,
    totalDemandKwh: 0,
    totalServedKwh: 0,
    tier1DemandKwh: 0,
    tier1ServedKwh: 0,
    criticalDemandKwh: 0,
    criticalServedKwh: 0,
    unserved1Kwh: 0,
    unserved2Kwh: 0,
    unserved3Kwh: 0,
    outageHours: 0,
    criticalServiceHours: 0,
    tier1ServiceHours: 0,
    pvKwh: 0,
    pvUsedKwh: 0,
    pvCurtailedKwh: 0,
    gridKwh: 0,
    battChargedKwh: 0,
    battDischargedKwh: 0,
    gensetKwh: 0,
    gensetRuntimeH: 0,
    dieselLitres: 0,
    peakDemandKw: 0,
    gridCostNaira: 0,
    dieselCostNaira: 0,
    maintenanceNaira: 0,
  };

  for (const s of steps) {
    const dTot = s.demandKw[1] + s.demandKw[2] + s.demandKw[3];
    const sTot = s.servedKw[1] + s.servedKw[2] + s.servedKw[3];
    m.totalDemandKwh += dTot * STEP_HOURS;
    m.totalServedKwh += sTot * STEP_HOURS;
    m.tier1DemandKwh += s.demandKw[1] * STEP_HOURS;
    m.tier1ServedKwh += s.servedKw[1] * STEP_HOURS;
    m.criticalDemandKwh += (s.demandKw[1] + s.demandKw[2]) * STEP_HOURS;
    m.criticalServedKwh += (s.servedKw[1] + s.servedKw[2]) * STEP_HOURS;
    m.unserved1Kwh += s.unservedKw[1] * STEP_HOURS;
    m.unserved2Kwh += s.unservedKw[2] * STEP_HOURS;
    m.unserved3Kwh += s.unservedKw[3] * STEP_HOURS;
    m.peakDemandKw = Math.max(m.peakDemandKw, dTot);

    if (s.islanded) {
      m.outageHours += STEP_HOURS;
      const critDem = s.demandKw[1] + s.demandKw[2];
      const critServed = s.servedKw[1] + s.servedKw[2];
      if (critDem > 0) {
        const frac = Math.min(1, critServed / critDem);
        m.criticalServiceHours += frac * STEP_HOURS;
      }
      const t1Dem = s.demandKw[1];
      if (t1Dem > 0) m.tier1ServiceHours += Math.min(1, s.servedKw[1] / t1Dem) * STEP_HOURS;
    }

    m.pvKwh += s.pvAvailableKw * STEP_HOURS;
    m.pvUsedKwh += s.pvKw * STEP_HOURS;
    m.pvCurtailedKwh += s.pvCurtailedKw * STEP_HOURS;
    m.gridKwh += s.gridKw * STEP_HOURS;
    if (s.battKw > 0) m.battChargedKwh += s.battKw * STEP_HOURS;
    else m.battDischargedKwh += -s.battKw * STEP_HOURS;
    m.gensetKwh += s.gensetKw * STEP_HOURS;
    if (s.gensetOn) m.gensetRuntimeH += STEP_HOURS;
    m.dieselLitres += (s.dieselLph * STEP_HOURS);
    m.gridCostNaira += s.gridCostNaira;
    m.dieselCostNaira += s.dieselCostNaira;
    m.maintenanceNaira += s.maintenanceNaira;
  }

  return {
    ...m,
    unservedKwh: { 1: m.unserved1Kwh, 2: m.unserved2Kwh, 3: m.unserved3Kwh },
    renewableShare: m.totalServedKwh > 0 ? m.pvUsedKwh / m.totalServedKwh : 0,
    opexNaira: m.gridCostNaira + m.dieselCostNaira + m.maintenanceNaira,
    co2Kg: m.dieselLitres * CO2_KG_PER_LITRE_DIESEL,
  };
}

export function computePerDay(steps: StepResult[]): DayMetrics[] {
  const days = new Map<number, DayMetrics>();
  for (const s of steps) {
    let d = days.get(s.day);
    if (!d) {
      d = {
        day: s.day,
        demandKwh: 0,
        servedKwh: 0,
        outageHours: 0,
        criticalServiceHours: 0,
        dieselLitres: 0,
        gensetKwh: 0,
        gridKwh: 0,
        pvKwh: 0,
        opexNaira: 0,
        unservedKwh: 0,
      };
      days.set(s.day, d);
    }
    const dTot = s.demandKw[1] + s.demandKw[2] + s.demandKw[3];
    const sTot = s.servedKw[1] + s.servedKw[2] + s.servedKw[3];
    d.demandKwh += dTot * STEP_HOURS;
    d.servedKwh += sTot * STEP_HOURS;
    d.unservedKwh += (s.unservedKw[1] + s.unservedKw[2] + s.unservedKw[3]) * STEP_HOURS;
    d.dieselLitres += s.dieselLph * STEP_HOURS;
    d.gensetKwh += s.gensetKw * STEP_HOURS;
    d.gridKwh += s.gridKw * STEP_HOURS;
    d.pvKwh += s.pvKw * STEP_HOURS;
    d.opexNaira += s.gridCostNaira + s.dieselCostNaira + s.maintenanceNaira;
    if (s.islanded) {
      d.outageHours += STEP_HOURS;
      const critDem = s.demandKw[1] + s.demandKw[2];
      const critServed = s.servedKw[1] + s.servedKw[2];
      if (critDem > 0) d.criticalServiceHours += Math.min(1, critServed / critDem) * STEP_HOURS;
    }
  }
  return [...days.values()].sort((a, b) => a.day - b.day);
}

/**
 * Baseline system: the typical current installation — grid supply when available and
 * a diesel generator sized to carry the full load during outages. No PV, no battery.
 */
export function buildBaselineConfig(cfg: SystemConfig): SystemConfig {
  const peakLoadKw = peakFacilityLoadKw(cfg);
  return {
    ...cfg,
    pv: { kwp: 0, performanceRatio: cfg.pv.performanceRatio },
    battery: { ...cfg.battery, nominalKwh: 0, maxChargeKw: 0, maxDischargeKw: 0, gridChargeEnabled: false },
    inverter: { ratedKw: 0 },
    genset: {
      ...cfg.genset,
      ratedKw: Math.max(450, Math.ceil(peakLoadKw * 1.15 / 10) * 10),
      canSupportGridPeak: false,
      chargesBattery: false,
      failed: false,
    },
    islandOnSeverePQ: false,
    peakShaveKw: null,
  };
}

export function peakFacilityLoadKw(cfg: SystemConfig): number {
  let peak = 0;
  for (let h = 0; h < 24; h++) {
    const d = cfg.facility.loads.reduce(
      (s, l) => s + l.ratedKw * (l.profile[h] ?? 0),
      0
    );
    peak = Math.max(peak, d);
  }
  return peak;
}

/** Compare a proposed system against its diesel-only baseline over the same scenario. */
export function compareAgainstBaseline(cfg: SystemConfig): {
  proposed: SimResult;
  baseline: SimResult;
} {
  return {
    proposed: runSimulation(cfg),
    baseline: runSimulation(buildBaselineConfig(cfg)),
  };
}

/**
 * Simulation orchestrator: runs the deterministic 15-minute-step model over the
 * configured horizon, aggregates metrics, and builds comparison systems (diesel-only
 * baseline, conventional hybrid, Sentinel) over identical loads, weather and outages.
 */

import type { DayMetrics, OutageWindow, SimMetrics, SimResult, StepResult, Strategy, SystemConfig } from "./types";
import { CO2_KG_PER_LITRE_DIESEL, STEP_HOURS, STEPS_PER_DAY } from "./types";
import { irradianceAt } from "./pv";
import { initialRuntime, stepSim } from "./dispatch";
import { measuredAt } from "./measured";
import { mulberry32 } from "./weather";

/** Expands an optional stochastic feeder regime into explicit, day-scoped outage windows. */
export function expandOutageWindows(cfg: SystemConfig): OutageWindow[] {
  const windows = [...cfg.grid.outageWindows];
  const r = cfg.feederRegime;
  if (!r || r.outagesPerDay <= 0) return windows;
  const rng = mulberry32(cfg.seed * 104729 + 17);
  const gauss = () => {
    const u = Math.max(1e-12, rng());
    const v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const poisson = (lambda: number) => {
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
      k++;
      p *= rng();
    } while (p > L);
    return k - 1;
  };
  for (let d = 0; d < cfg.horizonDays; d++) {
    const n = poisson(r.outagesPerDay);
    for (let i = 0; i < n; i++) {
      const start = Math.floor(rng() * 96) / 4;
      const dur = Math.max(0.25, Math.round(r.medianDurationHours * Math.exp(r.sigma * gauss()) * 4) / 4);
      let s = start;
      let rem = dur;
      let day = d;
      while (rem > 0 && day < cfg.horizonDays) {
        const end = Math.min(24, s + rem);
        windows.push({ day, startHour: s, endHour: end });
        rem -= end - s;
        s = 0;
        day++;
      }
    }
  }
  return windows;
}

export function weatherAt(cfg: SystemConfig, t: number): { irradianceWm2: number; ambientC?: number } {
  if (cfg.measuredWeather) {
    const m = measuredAt(cfg.measuredWeather.datasetId, cfg.measuredWeather.startDayOfYear, t);
    return { irradianceWm2: m.ghi, ambientC: m.tC };
  }
  return { irradianceWm2: irradianceAt(cfg.weather, Math.floor(t / STEPS_PER_DAY), t, cfg.seed) };
}

export function runSimulation(cfgIn: SystemConfig): SimResult {
  const cfg: SystemConfig = cfgIn.feederRegime
    ? { ...cfgIn, grid: { ...cfgIn.grid, outageWindows: expandOutageWindows(cfgIn) }, feederRegime: undefined }
    : cfgIn;
  const steps: StepResult[] = [];
  const events: SimResult["events"] = [];
  let rt = initialRuntime(cfg);
  const totalSteps = cfg.horizonDays * STEPS_PER_DAY;
  for (let t = 0; t < totalSteps; t++) {
    const out = stepSim(cfg, rt, weatherAt(cfg, t));
    rt = out.runtime;
    steps.push(out.step);
    for (const e of out.events) events.push(e);
  }
  return { steps, events, metrics: computeMetrics(steps), perDay: computePerDay(steps), config: cfgIn };
}

const MAINTAINED = 0.995;

export function computeMetrics(steps: StepResult[]): SimMetrics {
  const m = {
    totalDemandKwh: 0,
    totalServedKwh: 0,
    tier1DemandKwh: 0,
    tier1ServedKwh: 0,
    criticalDemandKwh: 0,
    criticalServedKwh: 0,
    u1: 0,
    u2: 0,
    u3: 0,
    outageHours: 0,
    criticalServiceHours: 0,
    tier1ServiceHours: 0,
    tier1MaintainedHours: 0,
    criticalMaintainedHours: 0,
    tier1Interruptions: 0,
    deferredKwh: 0,
    gensetUnavailableHours: 0,
    fuelOutHours: 0,
    fuelDeliveredLitres: 0,
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
  let interrupted = false;
  for (const s of steps) {
    const dTot = s.demandKw[1] + s.demandKw[2] + s.demandKw[3];
    const sTot = s.servedKw[1] + s.servedKw[2] + s.servedKw[3];
    m.totalDemandKwh += dTot * STEP_HOURS;
    m.totalServedKwh += sTot * STEP_HOURS;
    m.tier1DemandKwh += s.demandKw[1] * STEP_HOURS;
    m.tier1ServedKwh += s.servedKw[1] * STEP_HOURS;
    m.criticalDemandKwh += (s.demandKw[1] + s.demandKw[2]) * STEP_HOURS;
    m.criticalServedKwh += (s.servedKw[1] + s.servedKw[2]) * STEP_HOURS;
    m.u1 += s.unservedKw[1] * STEP_HOURS;
    m.u2 += s.unservedKw[2] * STEP_HOURS;
    m.u3 += s.unservedKw[3] * STEP_HOURS;
    m.deferredKwh += (s.deferredKw[1] + s.deferredKw[2] + s.deferredKw[3]) * STEP_HOURS;
    m.peakDemandKw = Math.max(m.peakDemandKw, dTot);
    m.fuelDeliveredLitres += s.deliveredL;

    const t1Short = s.demandKw[1] > 0 && s.servedKw[1] < MAINTAINED * s.demandKw[1];
    if (t1Short && !interrupted) m.tier1Interruptions += 1;
    interrupted = t1Short;

    if (s.islanded) {
      m.outageHours += STEP_HOURS;
      const critDem = s.demandKw[1] + s.demandKw[2];
      const critServed = s.servedKw[1] + s.servedKw[2];
      if (critDem > 0) m.criticalServiceHours += Math.min(1, critServed / critDem) * STEP_HOURS;
      if (s.demandKw[1] > 0) m.tier1ServiceHours += Math.min(1, s.servedKw[1] / s.demandKw[1]) * STEP_HOURS;
      // Strict "maintained" hours. A seconds-scale generator transfer break is counted as
      // an interruption (above) but does not erase the quarter-hour it occurred in.
      const shortBreak = s.startGapSec > 0 && s.startGapSec <= 90;
      if (!t1Short || shortBreak) m.tier1MaintainedHours += STEP_HOURS;
      if (critServed >= MAINTAINED * critDem || shortBreak) m.criticalMaintainedHours += STEP_HOURS;
      if (s.gensetUnavailable) m.gensetUnavailableHours += STEP_HOURS;
      if (s.fuelLitres < 3) m.fuelOutHours += STEP_HOURS;
    }

    m.pvKwh += s.pvAvailableKw * STEP_HOURS;
    m.pvUsedKwh += s.pvKw * STEP_HOURS;
    m.pvCurtailedKwh += s.pvCurtailedKw * STEP_HOURS;
    m.gridKwh += s.gridKw * STEP_HOURS;
    if (s.battKw > 0) m.battChargedKwh += s.battKw * STEP_HOURS;
    else m.battDischargedKwh += -s.battKw * STEP_HOURS;
    m.gensetKwh += s.gensetKw * STEP_HOURS;
    if (s.gensetOn) m.gensetRuntimeH += STEP_HOURS;
    m.dieselLitres += s.dieselLph * STEP_HOURS;
    m.gridCostNaira += s.gridCostNaira;
    m.dieselCostNaira += s.dieselCostNaira;
    m.maintenanceNaira += s.maintenanceNaira;
  }
  const last = steps[steps.length - 1];
  const { u1, u2, u3, ...rest } = m;
  return {
    ...rest,
    horizonHours: steps.length * STEP_HOURS,
    unservedKwh: { 1: u1, 2: u2, 3: u3 },
    renewableShare: m.totalServedKwh > 0 ? m.pvUsedKwh / m.totalServedKwh : 0,
    opexNaira: m.gridCostNaira + m.dieselCostNaira + m.maintenanceNaira,
    co2Kg: m.dieselLitres * CO2_KG_PER_LITRE_DIESEL,
    fuelEndLitres: last ? last.fuelLitres : 0,
    litresPerCriticalHour: m.criticalMaintainedHours > 0 ? m.dieselLitres / m.criticalMaintainedHours : 0,
  };
}

export function computePerDay(steps: StepResult[]): DayMetrics[] {
  const days = new Map<number, DayMetrics>();
  for (const s of steps) {
    let d = days.get(s.day);
    if (!d) {
      d = { day: s.day, demandKwh: 0, servedKwh: 0, outageHours: 0, criticalServiceHours: 0, dieselLitres: 0, gensetKwh: 0, gridKwh: 0, pvKwh: 0, opexNaira: 0, unservedKwh: 0 };
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
 * Baseline system: the typical current installation — grid supply when available and a
 * diesel generator sized to carry the full load during outages. No PV, no battery.
 * Fuel logistics, weather and outages are identical to the proposed configuration.
 */
export function buildBaselineConfig(cfg: SystemConfig, strategy: Strategy = "baseline"): SystemConfig {
  const peakLoadKw = peakFacilityLoadKw(cfg);
  return {
    ...cfg,
    strategy,
    pv: { ...cfg.pv, kwp: 0 },
    battery: { ...cfg.battery, nominalKwh: 0, maxChargeKw: 0, maxDischargeKw: 0, gridChargeEnabled: false },
    inverter: { ratedKw: 0 },
    genset: {
      ...cfg.genset,
      ratedKw: Math.max(450, Math.ceil((peakLoadKw * 1.15) / 10) * 10),
      canSupportGridPeak: false,
      chargesBattery: false,
      // Same generator condition as the proposed system: a failure scenario fails both.
      failed: cfg.genset.failed,
    },
    islandOnSeverePQ: false,
    peakShaveKw: null,
  };
}

/** Same hardware as `cfg`, different control strategy. */
export function withStrategy(cfg: SystemConfig, strategy: Strategy): SystemConfig {
  if (strategy === "baseline" || strategy === "baseline_rationed") return buildBaselineConfig(cfg, strategy);
  return { ...cfg, strategy };
}

export function peakFacilityLoadKw(cfg: SystemConfig): number {
  let peak = 0;
  for (let h = 0; h < 24; h++) {
    const d = cfg.facility.loads.reduce((s, l) => s + l.ratedKw * (l.profile[h] ?? 0), 0);
    peak = Math.max(peak, d);
  }
  return peak * (cfg.loadScale ?? 1);
}

/** Compare a proposed system against its diesel-only baseline over the same scenario. */
export function compareAgainstBaseline(cfg: SystemConfig): { proposed: SimResult; baseline: SimResult } {
  return { proposed: runSimulation(cfg), baseline: runSimulation(buildBaselineConfig(cfg)) };
}

export const STRATEGIES: { id: Strategy; label: string; short: string; hardware: string }[] = [
  { id: "baseline", label: "Status quo — grid + diesel", short: "Diesel only", hardware: "Generator only" },
  { id: "baseline_rationed", label: "Status quo + manual rationing", short: "Diesel + rationing", hardware: "Generator only" },
  { id: "conventional", label: "Solar + battery, fixed-rule inverter", short: "Conventional hybrid", hardware: "PV + BESS + generator" },
  { id: "sentinel", label: "Solar + battery + MedGrid Sentinel", short: "Sentinel", hardware: "PV + BESS + generator" },
];

/** Runs every strategy over identical conditions. */
export function compareStrategies(cfg: SystemConfig, strategies: Strategy[] = STRATEGIES.map((s) => s.id)): Record<Strategy, SimResult> {
  const out = {} as Record<Strategy, SimResult>;
  for (const s of strategies) out[s] = runSimulation(withStrategy(cfg, s));
  return out;
}

/**
 * Deterministic energy dispatch engine (one step = 15 minutes).
 *
 * Every strategy shares the same physics: PV, battery SOC limits, inverter cap,
 * generator rating / start time / fuel curve, the diesel tank and the resupply chain.
 * Strategies differ only in DECISIONS, so comparing them on identical hardware isolates
 * what the control software itself is worth.
 *
 * Grid-connected (all strategies): PV → grid (import cap / peak shave) → battery above
 * the outage reserve; PV surplus and off-peak grid charging restore the reserve.
 *
 * Islanded:
 *   baseline            generator load-follows the whole facility (status quo).
 *   baseline_rationed   as baseline, with every Tier-3 load switched off while islanded.
 *   conventional        battery first; generator auto-starts near the SOC floor and
 *                       load-follows (fixed-rule hybrid inverter). No fuel awareness.
 *   sentinel            MedGrid Sentinel:
 *                        1. Fuel-runway governor — each hour compares diesel + battery +
 *                           forecast solar against the energy each service level needs until
 *                           the next expected fuel delivery, and picks the highest level the
 *                           runway can sustain (Tier-3 deferred first, Tier-1 never).
 *                        2. Clinical ride-through reserve — the battery never discharges below
 *                           the energy needed to carry Tier-1 for `clinicalReserveHours` while
 *                           the generator is off, so a failed start never darkens the ICU.
 *                        3. Efficient generator cycling — when it runs, the set runs hard
 *                           (load + battery charging) and shuts down once the battery is full,
 *                           cutting low-load fixed-burn hours.
 *
 * Supply deficits are shed strictly Tier 3 → Tier 2 → Tier 1 and reported as unserved
 * energy. Policy rationing is reported separately as "deferred" energy — never hidden.
 */

import type {
  BatteryConfig,
  ServiceLevel,
  SimEvent,
  StepResult,
  SystemConfig,
  TierDemand,
} from "./types";
import { STEP_HOURS, STEPS_PER_DAY } from "./types";
import { tierDemandAt, tierTable } from "./facility";
import type { OutageWindow } from "./types";
import { applyCharge, applyDischarge, maxChargePowerNow, maxDischargePowerNow } from "./battery";
import { fuelLph } from "./genset";
import { DEFAULT_SENTINEL_POLICY } from "./policy";

export interface DispatchRuntime {
  t: number;
  socKwh: number;
  gensetOn: boolean;
  /** Seconds of start sequence still to elapse (0 when running or idle). */
  gensetStartRemainingSec: number;
  /** Legacy counter kept for API compatibility. */
  gensetStartCountdown: number;
  islanded: boolean;
  reconnectCountdown: number;
  gensetStartedEpisode: boolean;
  lowBatteryWarned: boolean;
  underMinLoadWarned: boolean;
  fuelL: number;
  nextDeliveryIdx: number;
  outageCount: number;
  gensetRunHours: number;
  nextRunFailureIdx: number;
  /** Step index until which the generator is under repair (exclusive). */
  gensetRepairUntilT: number;
  serviceLevel: ServiceLevel;
  governorNextEvalT: number;
  /** Generator steps since start (minimum run time). */
  gensetRunSteps: number;
  /** PV potential energy of the last completed days, kWh (most recent last, max 3). */
  pvDayHistory: number[];
  pvTodayKwh: number;
  tier1Interrupted: boolean;
  fuelOutWarned: boolean;
  lastGensetAvailable: boolean;
}

export function initialRuntime(cfg: SystemConfig): DispatchRuntime {
  return {
    t: 0,
    socKwh: cfg.battery.initialSocFrac * cfg.battery.nominalKwh,
    gensetOn: false,
    gensetStartRemainingSec: 0,
    gensetStartCountdown: 0,
    islanded: false,
    reconnectCountdown: 0,
    gensetStartedEpisode: false,
    lowBatteryWarned: false,
    underMinLoadWarned: false,
    fuelL: cfg.fuel ? Math.min(cfg.fuel.initialLitres, cfg.fuel.tankLitres) : Infinity,
    nextDeliveryIdx: 0,
    outageCount: 0,
    gensetRunHours: 0,
    nextRunFailureIdx: 0,
    gensetRepairUntilT: -1,
    serviceLevel: 3,
    governorNextEvalT: 0,
    gensetRunSteps: 0,
    pvDayHistory: [],
    pvTodayKwh: 0,
    tier1Interrupted: false,
    fuelOutWarned: false,
    lastGensetAvailable: true,
  };
}

export interface StepOutput {
  step: StepResult;
  events: SimEvent[];
  runtime: DispatchRuntime;
}

export interface StepInputs {
  irradianceWm2: number;
  /** Ambient air temperature, °C (measured weather only). */
  ambientC?: number;
}

function mkEvent(t: number, severity: SimEvent["severity"], type: string, message: string): SimEvent {
  return { t, day: Math.floor(t / STEPS_PER_DAY), hour: (t % STEPS_PER_DAY) / 4, severity, type, message };
}

/** Fraction of each tier the service level keeps on: [T1, T2, T3]. */
export const LEVEL_FRACTIONS: Record<ServiceLevel, [number, number, number]> = {
  3: [1, 1, 1],
  2: [1, 1, 0],
  1: [1, 0.5, 0],
  0: [1, 0, 0],
};

export const LEVEL_LABEL: Record<ServiceLevel, string> = {
  3: "Full facility",
  2: "Tier 1 + 2 (Tier-3 deferred)",
  1: "Tier 1 + essential Tier 2",
  0: "Tier 1 life-critical only",
};

/** Diesel delivery k: scheduled arrival step (without any delay). */
export function deliveryStep(cfg: SystemConfig, k: number): number {
  const f = cfg.fuel!;
  return Math.round((f.firstDeliveryDay + k * f.deliveryEveryDays) * STEPS_PER_DAY + f.deliveryHour * 4);
}

/** Energy (kWh) the generator converts per litre at a given output (kWh/L). */
export function kwhPerLitre(cfg: SystemConfig, outputKw: number): number {
  const lph = fuelLph({ ...cfg.genset, failed: false }, outputKw);
  return lph > 0 ? outputKw / lph : 0;
}

/** Scheduled demand energy (kWh) of each tier over the next `hours`, starting at step t. */
export function demandAhead(cfg: SystemConfig, t: number, hours: number): TierDemand {
  const scale = cfg.loadScale ?? 1;
  const table = tierTable(cfg.facility.loads);
  const out: TierDemand = { 1: 0, 2: 0, 3: 0 };
  const steps = Math.round(hours * 4);
  for (let i = 0; i < steps; i++) {
    const d = table[Math.floor(((t + i) % STEPS_PER_DAY) / 4)];
    out[1] += d[1];
    out[2] += d[2];
    out[3] += d[3];
  }
  const k = scale * STEP_HOURS;
  out[1] *= k;
  out[2] *= k;
  out[3] *= k;
  return out;
}

/**
 * Solar energy forecast for the next `hours` (kWh at the AC bus): mean of the last
 * (up to) three days' PV potential — the persistence-mean model validated against
 * held-out NASA POWER data in forecast.ts. Falls back to a conservative 3.5 kWh/kWp/day.
 */
export function forecastPvKwh(cfg: SystemConfig, rt: DispatchRuntime, hours: number): number {
  const hist = rt.pvDayHistory;
  const perDay = hist.length
    ? hist.reduce((s, v) => s + v, 0) / hist.length
    : cfg.pv.kwp * 3.5 * cfg.pv.performanceRatio;
  return (perDay * hours) / 24;
}

export interface GovernorAssessment {
  horizonHours: number;
  fuelKwh: number;
  batteryKwh: number;
  pvKwh: number;
  supplyKwh: number;
  needKwh: Record<ServiceLevel, number>;
  level: ServiceLevel;
}

/** Fuel-runway governor: highest service level the runway sustains to the next delivery. */
export function assessRunway(
  cfg: SystemConfig,
  rt: DispatchRuntime,
  gensetUsable: boolean
): GovernorAssessment {
  const pol = cfg.sentinel ?? DEFAULT_SENTINEL_POLICY;
  const t = rt.t;
  // Without a fuel-logistics schedule the outage end is unknown: plan one day ahead.
  let horizon = cfg.fuel ? pol.maxHorizonHours : pol.minHorizonHours;
  if (cfg.fuel && cfg.fuel.deliveryEveryDays > 0) {
    // Next delivery the hospital EXPECTS (it does not know about future delays or misses).
    let k = rt.nextDeliveryIdx;
    while (deliveryStep(cfg, k) <= t) k++;
    const hoursToNext = (deliveryStep(cfg, k) - t) / 4;
    horizon = hoursToNext + pol.deliveryMarginHours;
  }
  horizon = Math.min(pol.maxHorizonHours, Math.max(pol.minHorizonHours, horizon));

  const g = cfg.genset;
  const effKwhPerL = kwhPerLitre(cfg, Math.max(g.minLoadKw, 0.75 * g.ratedKw));
  const fuelKwh = gensetUsable && Number.isFinite(rt.fuelL) ? rt.fuelL * effKwhPerL : gensetUsable ? Infinity : 0;
  const b = cfg.battery;
  const batteryKwh = Math.max(0, rt.socKwh - b.minSocFrac * b.nominalKwh) * b.dischargeEff;
  const pvKwh = forecastPvKwh(cfg, rt, horizon) * pol.pvForecastConfidence;
  const supply = fuelKwh + batteryKwh + pvKwh;

  const d = demandAhead(cfg, t, horizon);
  const loss = 1.04; // conversion & cycling losses allowance
  const needKwh = {} as Record<ServiceLevel, number>;
  for (const lvl of [3, 2, 1, 0] as ServiceLevel[]) {
    const [f1, f2, f3] = LEVEL_FRACTIONS[lvl];
    needKwh[lvl] = (d[1] * f1 + d[2] * f2 + d[3] * f3) * loss;
  }
  let level: ServiceLevel = 0;
  for (const lvl of [3, 2, 1, 0] as ServiceLevel[]) {
    const margin = lvl > rt.serviceLevel ? 1 + pol.restoreMargin : 1;
    if (needKwh[lvl] * margin <= supply) {
      level = lvl;
      break;
    }
  }
  return { horizonHours: horizon, fuelKwh, batteryKwh, pvKwh, supplyKwh: supply, needKwh, level };
}

export function stepSim(cfg: SystemConfig, rtIn: DispatchRuntime, input: StepInputs | number): StepOutput {
  const { irradianceWm2, ambientC } = typeof input === "number" ? { irradianceWm2: input, ambientC: undefined } : input;
  const rt: DispatchRuntime = { ...rtIn, pvDayHistory: rtIn.pvDayHistory };
  const events: SimEvent[] = [];
  const t = rt.t;
  const day = Math.floor(t / STEPS_PER_DAY);
  const hourOfDay = (t % STEPS_PER_DAY) / 4;
  const hourFloor = Math.floor(hourOfDay);
  const strategy = cfg.strategy ?? "conventional";
  const pol = cfg.sentinel ?? DEFAULT_SENTINEL_POLICY;
  const scale = cfg.loadScale ?? 1;
  const batt = cfg.battery;
  const g = cfg.genset;
  const hasBatt = batt.nominalKwh > 0 && strategy !== "baseline" && strategy !== "baseline_rationed";

  // ---------- Day roll-over (PV history for the forecaster) ----------
  if (t > 0 && t % STEPS_PER_DAY === 0) {
    rt.pvDayHistory = [...rt.pvDayHistory, rt.pvTodayKwh].slice(-3);
    rt.pvTodayKwh = 0;
  }

  // ---------- Fuel deliveries ----------
  let deliveredL = 0;
  if (cfg.fuel && cfg.fuel.deliveryEveryDays > 0) {
    const f = cfg.fuel;
    for (;;) {
      const k = rt.nextDeliveryIdx;
      const arrival = deliveryStep(cfg, k) + Math.round((f.delayHours?.[k] ?? 0) * 4);
      if (arrival > t) break;
      rt.nextDeliveryIdx = k + 1;
      if (f.missedDeliveries?.includes(k)) {
        events.push(mkEvent(t, "warning", "fuel_missed", `Scheduled diesel delivery #${k + 1} did not arrive (supply chain disruption).`));
        continue;
      }
      const room = Math.max(0, f.tankLitres - rt.fuelL);
      const add = Math.min(f.deliveryLitres, room);
      rt.fuelL += add;
      deliveredL += add;
      rt.fuelOutWarned = false;
      const late = f.delayHours?.[k] ? ` (${Math.round(f.delayHours[k])} h late)` : "";
      events.push(mkEvent(t, "info", "fuel_delivery", `Diesel delivery #${k + 1}: +${Math.round(add).toLocaleString("en-US")} L${late} → tank ${Math.round(rt.fuelL).toLocaleString("en-US")} L.`));
    }
  }

  const raw = tierDemandAt(cfg.facility.loads, hourFloor);
  const demand: TierDemand = { 1: raw[1] * scale, 2: raw[2] * scale, 3: raw[3] * scale };

  // ---------- PV (with optional measured-temperature derate) ----------
  let tempFactor = 1;
  if (ambientC !== undefined && cfg.pv.tempCoeffPerC !== undefined) {
    const cellC = ambientC + (((cfg.pv.noctC ?? 45) - 20) / 800) * irradianceWm2;
    tempFactor = Math.max(0, 1 + cfg.pv.tempCoeffPerC * (cellC - 25));
  }
  const pvDc = cfg.pv.kwp * (irradianceWm2 / 1000) * cfg.pv.performanceRatio * tempFactor;
  const pvCapped = Math.max(0, Math.min(pvDc, cfg.inverter.ratedKw));
  rt.pvTodayKwh += pvCapped * STEP_HOURS;

  // ---------- Grid state machine ----------
  const inOutage = (windowsForDay(cfg.grid.outageWindows, day)).some(
    (w) => hourOfDay >= w.startHour && hourOfDay < w.endHour
  );
  const pq = cfg.pqEvents.find((e) => e.day === day && hourOfDay >= e.startHour && hourOfDay < e.endHour);
  const gridHealthy = cfg.grid.available && !inOutage && !(pq && pq.tripsBreaker && cfg.islandOnSeverePQ);

  let newlyIslanded = false;
  if (rt.islanded) {
    if (gridHealthy) {
      if (rt.reconnectCountdown > 0) rt.reconnectCountdown -= 1;
      else {
        rt.islanded = false;
        rt.serviceLevel = 3;
        events.push(mkEvent(t, "info", "grid_reconnect", "Grid tie re-closed after stability delay."));
        rt.gensetStartedEpisode = false;
      }
    }
  } else if (!gridHealthy) {
    rt.islanded = true;
    newlyIslanded = true;
    rt.outageCount += 1;
    rt.reconnectCountdown = cfg.grid.reconnectDelaySteps;
    rt.gensetStartedEpisode = false;
    rt.governorNextEvalT = t; // assess the runway immediately
    if (inOutage) {
      events.push(mkEvent(t, "warning", "outage_start", `Grid outage detected at ${fmtHour(hourOfDay)} — islanding.`));
    } else if (pq) {
      events.push(
        mkEvent(t, "critical", "pq_trip", `${pqLabel(pq.kind)} to ${pq.value}${pq.kind.startsWith("voltage") ? " V" : " Hz"} at ${fmtHour(hourOfDay)} — protective islanding (simulated).`)
      );
    }
    if (cfg.reliability?.failToStartOnOutage?.includes(rt.outageCount) && !g.failed) {
      rt.gensetRepairUntilT = t + Math.round(cfg.reliability.repairHours * 4);
      events.push(mkEvent(t, "critical", "genset_fts", `Generator FAILED TO START on outage #${rt.outageCount} — repair ETA ${cfg.reliability.repairHours.toFixed(0)} h.`));
    }
  } else if (pq && !pq.tripsBreaker) {
    events.push(
      mkEvent(t, "warning", "pq_warning", `${pqLabel(pq.kind)} to ${pq.value}${pq.kind.startsWith("voltage") ? " V" : " Hz"} — within ride-through band, tie stays closed (simulated).`)
    );
  }

  // ---------- Generator availability ----------
  const inRepair = rt.gensetRepairUntilT > t;
  if (!inRepair && rt.gensetRepairUntilT >= 0 && rt.gensetRepairUntilT === t) {
    events.push(mkEvent(t, "info", "genset_repaired", "Generator repaired and available."));
  }
  // Below one quarter-hour of no-load burn the set cannot sustain output: treat as empty.
  const fuelOut = rt.fuelL < g.fuelFixedLph * STEP_HOURS + 0.5;
  const gensetUsable = !g.failed && !inRepair && !fuelOut && g.ratedKw > 0;
  if (!gensetUsable && rt.gensetOn) {
    rt.gensetOn = false;
    rt.gensetRunSteps = 0;
  }
  if (fuelOut && !rt.fuelOutWarned && rt.islanded && g.ratedKw > 0) {
    events.push(mkEvent(t, "critical", "fuel_out", `Diesel tank EMPTY at ${fmtHour(hourOfDay)} — generator cannot run until resupply.`));
    rt.fuelOutWarned = true;
  }
  if (gensetUsable !== rt.lastGensetAvailable) rt.governorNextEvalT = t;
  rt.lastGensetAvailable = gensetUsable;

  // ---------- Service level (policy) ----------
  if (!rt.islanded) rt.serviceLevel = 3;
  else if (strategy === "baseline_rationed") rt.serviceLevel = 2;
  else if (strategy === "sentinel" && t >= rt.governorNextEvalT) {
    const a = assessRunway(cfg, rt, gensetUsable);
    if (a.level !== rt.serviceLevel) {
      const down = a.level < rt.serviceLevel;
      events.push(
        mkEvent(
          t,
          down ? "warning" : "info",
          "governor",
          `Fuel-runway governor → ${LEVEL_LABEL[a.level]}. Runway ${fmtKwh(a.supplyKwh)} (diesel ${fmtKwh(a.fuelKwh)} + battery ${fmtKwh(a.batteryKwh)} + solar ${fmtKwh(a.pvKwh)}) vs ${fmtKwh(a.needKwh[3])} for full service over ${a.horizonHours.toFixed(0)} h to next delivery.`
        )
      );
      rt.serviceLevel = a.level;
    }
    rt.governorNextEvalT = t + 4;
  }
  const [f1, f2, f3] = LEVEL_FRACTIONS[rt.serviceLevel];
  const target: TierDemand = { 1: demand[1] * f1, 2: demand[2] * f2, 3: demand[3] * f3 };
  const deferred: TierDemand = { 1: 0, 2: demand[2] - target[2], 3: demand[3] - target[3] };
  let targetTotal = target[1] + target[2] + target[3];

  let pvToLoad = Math.min(pvCapped, targetTotal);
  let pvSurplus = pvCapped - pvToLoad;
  let remaining = targetTotal - pvToLoad;

  const reserveKwh = Math.max(batt.minSocFrac, batt.gridReserveSocFrac) * batt.nominalKwh;
  let gridToLoad = 0;
  let gridToBatt = 0;
  let battDis = 0;
  let gensetToLoad = 0;
  let gensetToBatt = 0;
  let gensetStarting = false;
  let transferGapSec = 0;
  /** Energy the generator could not deliver because it was mid start-sequence, kW. */
  let startShortfallKw = 0;

  if (!rt.islanded) {
    // ===== Grid-connected =====
    const cap = cfg.grid.importLimitKw;
    if (cfg.peakShaveKw != null && targetTotal > cfg.peakShaveKw) {
      gridToLoad = Math.min(Math.max(0, cfg.peakShaveKw - pvToLoad), cap, remaining);
    } else gridToLoad = Math.min(cap, remaining);
    remaining -= gridToLoad;
    if (hasBatt && batt.gridChargeEnabled && hourOfDay < batt.gridChargeWindowEndHour && rt.socKwh < reserveKwh) {
      const want = (reserveKwh - rt.socKwh) / (STEP_HOURS * batt.chargeEff);
      gridToBatt = Math.min(maxChargePowerNow(batt, rt.socKwh), want, Math.max(0, cap - gridToLoad));
    }
    if (hasBatt && remaining > 0) {
      battDis = Math.min(remaining, maxDischargePowerNow(batt, rt.socKwh, Math.max(batt.minSocFrac, batt.gridReserveSocFrac)));
      remaining -= battDis;
    }
    if (remaining > 0 && g.canSupportGridPeak && gensetUsable) {
      const s = startGenset(cfg, rt, events, t, hourOfDay);
      gensetStarting = s.starting;
      gensetToLoad = Math.min(remaining, g.ratedKw) * s.availFrac;
      remaining -= gensetToLoad;
    } else if (rt.gensetOn) {
      rt.gensetOn = false;
      rt.gensetRunSteps = 0;
    }
  } else {
    // ===== Islanded =====
    const floorKwh = batt.minSocFrac * batt.nominalKwh;
    const battAvailTo = (floorFrac: number) => (hasBatt ? maxDischargePowerNow(batt, rt.socKwh, floorFrac) : 0);

    if (strategy === "baseline" || strategy === "baseline_rationed" || !hasBatt) {
      if (remaining > 0 && gensetUsable) {
        const s = startGenset(cfg, rt, events, t, hourOfDay);
        gensetStarting = s.starting;
        // The start-to-transfer break is a TIME gap: nothing flows for startupSeconds,
        // however large the set is.
        const full = Math.min(remaining, g.ratedKw);
        gensetToLoad = full * s.availFrac;
        startShortfallKw = full - gensetToLoad;
        remaining -= gensetToLoad;
      } else if (rt.gensetOn) {
        rt.gensetOn = false;
        rt.gensetRunSteps = 0;
      }
    } else if (strategy === "conventional") {
      // Fixed-rule hybrid inverter: auto-start at floor+5 % SOC, load-follow, stop when PV covers the load.
      const startSoc = floorKwh + 0.05 * batt.nominalKwh;
      const wantGenset =
        gensetUsable && remaining > 0 && (rt.gensetOn || rt.socKwh <= startSoc || battAvailTo(batt.minSocFrac) < remaining);
      if (wantGenset) {
        const s = startGenset(cfg, rt, events, t, hourOfDay);
        gensetStarting = s.starting;
        gensetToLoad = Math.min(remaining, g.ratedKw) * s.availFrac;
        startShortfallKw = Math.min(remaining, g.ratedKw) - gensetToLoad;
        remaining -= gensetToLoad;
        if (g.chargesBattery && gensetToLoad < g.minLoadKw && s.availFrac >= 1) {
          gensetToBatt = Math.min(g.minLoadKw - gensetToLoad, g.ratedKw - gensetToLoad, maxChargePowerNow(batt, rt.socKwh));
        }
      } else if (rt.gensetOn) {
        rt.gensetOn = false;
        rt.gensetRunSteps = 0;
      }
      if (remaining > 0) {
        battDis = Math.min(remaining, battAvailTo(batt.minSocFrac));
        remaining -= battDis;
      }
    } else {
      // ===== Sentinel =====
      const clinicalReserve = Math.min(
        0.9 * batt.nominalKwh,
        floorKwh + (demand[1] * pol.clinicalReserveHours) / batt.dischargeEff
      );
      const reserveFloorFrac = gensetUsable ? clinicalReserve / batt.nominalKwh : batt.minSocFrac;
      const stopKwh = pol.gensetStopSocFrac * batt.nominalKwh;
      let run = rt.gensetOn && gensetUsable;
      if (run && rt.gensetRunSteps >= 4) {
        // Shut down once the battery is charged and storage + PV can carry the load, or PV covers it.
        const battCan = battAvailTo(reserveFloorFrac) >= remaining;
        if ((rt.socKwh >= stopKwh && battCan) || (pvSurplus > 0 && rt.socKwh > clinicalReserve)) run = false;
      }
      if (!run && gensetUsable && remaining > 0 && (rt.socKwh <= clinicalReserve || battAvailTo(reserveFloorFrac) < remaining)) {
        run = true;
      }
      if (run) {
        const s = startGenset(cfg, rt, events, t, hourOfDay);
        gensetStarting = s.starting;
        const cap = g.ratedKw;
        gensetToLoad = Math.min(remaining, cap) * s.availFrac;
        startShortfallKw = Math.min(remaining, cap) - gensetToLoad;
        remaining -= gensetToLoad;
        if (s.availFrac >= 1 && pvSurplus <= 0 && rt.socKwh < stopKwh) {
          gensetToBatt = Math.max(0, Math.min(cap - gensetToLoad, maxChargePowerNow(batt, rt.socKwh), (stopKwh - rt.socKwh) / (STEP_HOURS * batt.chargeEff)));
        }
      } else if (rt.gensetOn) {
        rt.gensetOn = false;
        rt.gensetRunSteps = 0;
      }
      if (remaining > 0) {
        // Storage bridges start-up gaps and covers what the set cannot; dips into the
        // clinical reserve only when the generator is unavailable or still starting.
        const floor = gensetToLoad > 0 && !gensetStarting ? reserveFloorFrac : batt.minSocFrac;
        battDis = Math.min(remaining, battAvailTo(floor));
        remaining -= battDis;
      }
    }

    if (
      hasBatt &&
      !rt.lowBatteryWarned &&
      battDis > 0 &&
      rt.socKwh - (battDis * STEP_HOURS) / batt.dischargeEff <= floorKwh * 1.02 &&
      rt.socKwh > floorKwh
    ) {
      events.push(mkEvent(t, "warning", "battery_reserve", `Battery at outage floor (${Math.round(batt.minSocFrac * 100)}% SOC) at ${fmtHour(hourOfDay)}.`));
      rt.lowBatteryWarned = true;
    }
  }
  if (!rt.islanded) rt.lowBatteryWarned = false;

  // ---------- Fuel limit ----------
  let gensetKw = gensetToLoad + gensetToBatt;
  let dieselLph = 0;
  if (gensetKw > 0) {
    dieselLph = fuelLph(g, gensetKw);
    const litres = dieselLph * STEP_HOURS;
    if (litres > rt.fuelL) {
      // Run only as long/hard as the remaining fuel allows: drop charging first, then load.
      const pMax = Math.max(0, (rt.fuelL / STEP_HOURS - g.fuelFixedLph) / g.fuelLinearLperKwh);
      const cutCharge = Math.min(gensetToBatt, Math.max(0, gensetKw - pMax));
      gensetToBatt -= cutCharge;
      const cutLoad = Math.min(gensetToLoad, Math.max(0, gensetToLoad + gensetToBatt - pMax));
      gensetToLoad -= cutLoad;
      remaining += cutLoad;
      gensetKw = gensetToLoad + gensetToBatt;
      dieselLph = gensetKw > 0 ? Math.min(fuelLph(g, gensetKw), rt.fuelL / STEP_HOURS) : 0;
    }
    rt.fuelL = Math.max(0, rt.fuelL - dieselLph * STEP_HOURS);
  }
  if (gensetKw <= 0 && rt.gensetOn && !gensetStarting) {
    rt.gensetOn = false;
    rt.gensetRunSteps = 0;
    rt.gensetStartedEpisode = false;
  }
  const gensetRunning = gensetKw > 0;
  if (gensetRunning) {
    rt.gensetRunHours += STEP_HOURS;
    rt.gensetRunSteps += 1;
    const fails = cfg.reliability?.runFailureAtRunHours;
    if (fails && rt.nextRunFailureIdx < fails.length && rt.gensetRunHours >= fails[rt.nextRunFailureIdx]) {
      rt.nextRunFailureIdx += 1;
      rt.gensetRepairUntilT = t + 1 + Math.round(cfg.reliability!.repairHours * 4);
      rt.gensetOn = false;
      rt.gensetRunSteps = 0;
      events.push(
        mkEvent(t, "critical", "genset_ftr", `Generator FAILED WHILE RUNNING after ${rt.gensetRunHours.toFixed(0)} run-hours — repair ETA ${cfg.reliability!.repairHours.toFixed(0)} h.`)
      );
    }
  }
  if (gensetRunning && gensetKw < g.minLoadKw * 0.95 && !rt.underMinLoadWarned) {
    events.push(mkEvent(t, "warning", "genset_underload", `Generator below minimum load (${Math.round(gensetKw)} kW < ${g.minLoadKw} kW) — wet-stacking risk flagged.`));
    rt.underMinLoadWarned = true;
  }
  if (gensetKw >= g.minLoadKw) rt.underMinLoadWarned = false;

  // ---------- PV surplus → battery ----------
  let pvToBatt = 0;
  if (hasBatt && pvSurplus > 0) {
    pvToBatt = Math.min(pvSurplus, Math.max(0, maxChargePowerNow(batt, rt.socKwh) - gridToBatt - gensetToBatt));
    pvSurplus -= pvToBatt;
  }

  // ---------- Opportunistic solar ----------
  // PV that would otherwise be curtailed is free: it serves policy-deferred loads
  // (Tier 2 first, then Tier 3) without touching the fuel runway or the battery.
  if (rt.islanded && pvSurplus > 1e-9 && deferred[2] + deferred[3] > 0) {
    const o2 = Math.min(pvSurplus, deferred[2]);
    deferred[2] -= o2;
    target[2] += o2;
    pvSurplus -= o2;
    const o3 = Math.min(pvSurplus, deferred[3]);
    deferred[3] -= o3;
    target[3] += o3;
    pvSurplus -= o3;
    pvToLoad += o2 + o3;
    targetTotal += o2 + o3;
  }

  // ---------- SOC bookkeeping ----------
  if (hasBatt) {
    const start = rt.socKwh;
    let soc = start;
    const chargeKw = gridToBatt + gensetToBatt + pvToBatt;
    if (chargeKw > 0) soc = applyCharge(batt, soc, chargeKw);
    if (battDis > 0) soc = applyDischarge(batt, soc, battDis);
    const achievable = (soc - (start - (battDis * STEP_HOURS) / batt.dischargeEff)) / (STEP_HOURS * batt.chargeEff);
    if (chargeKw > 0 && achievable < chargeKw - 1e-9) {
      const k = Math.max(0, achievable) / chargeKw;
      gridToBatt *= k;
      gensetToBatt *= k;
      pvToBatt *= k;
    }
    rt.socKwh = Math.max(batt.minSocFrac * batt.nominalKwh * 0.999, soc);
  }

  // ---------- Allocation & shedding ----------
  const servedGross = pvToLoad + gridToLoad + battDis + gensetToLoad;
  const served: TierDemand = { 1: 0, 2: 0, 3: 0 };
  const deficit = targetTotal - servedGross;
  const isTransferGap = startShortfallKw > 0 && deficit > 1e-6 && deficit <= startShortfallKw + 1e-6;
  if (isTransferGap) {
    // A start-to-transfer break blacks out the whole bus for a few seconds: every tier
    // loses the same fraction of the quarter-hour (no tier can be prioritised).
    const f = targetTotal > 0 ? servedGross / targetTotal : 1;
    for (const tier of [1, 2, 3] as const) served[tier] = target[tier] * f;
  } else {
    let left = servedGross;
    for (const tier of [1, 2, 3] as const) {
      served[tier] = Math.min(target[tier], left);
      left -= served[tier];
    }
  }
  const unserved: TierDemand = {
    1: Math.max(0, demand[1] - served[1] - deferred[1]),
    2: Math.max(0, demand[2] - served[2] - deferred[2]),
    3: Math.max(0, demand[3] - served[3] - deferred[3]),
  };
  const t1Gap = demand[1] > 0 ? unserved[1] / demand[1] : 0;
  // A short start-to-transfer break (seconds) is recorded as an interruption but kept
  // distinct from sustained deficits in the hours metrics.
  if (isTransferGap && unserved[1] > 0) {
    transferGapSec = Math.min(900, Math.round(t1Gap * 900));
  }
  if (t1Gap > 0.005) {
    if (!rt.tier1Interrupted) {
      const why = isTransferGap
        ? `generator start transfer gap (~${g.startupSeconds ?? g.startupSteps * 900} s break)`
        : `${unserved[1].toFixed(1)} kW deficit`;
      events.push(mkEvent(t, "critical", "tier1_unserved", `Tier-1 life-critical supply interrupted at ${fmtHour(hourOfDay)} — ${why}.`));
    }
    rt.tier1Interrupted = true;
  } else rt.tier1Interrupted = false;
  if (newlyIslanded && strategy === "sentinel" && hasBatt && unserved[1] <= 0.005 * demand[1]) {
    events.push(mkEvent(t, "info", "seamless", "Battery inverter formed the island instantly — no break on Tier-1 circuits."));
  }

  const pvKw = pvToLoad + pvToBatt;
  const pvCurtailedKw = Math.max(0, pvCapped - pvToLoad - pvToBatt);
  const battKw = pvToBatt + gensetToBatt + gridToBatt - battDis;
  const gridKw = gridToLoad + gridToBatt;

  const gridCostNaira = gridKw * STEP_HOURS * cfg.grid.tariffNairaPerKwh;
  const dieselCostNaira = dieselLph * STEP_HOURS * g.fuelNairaPerLitre;
  const maintenanceNaira = gensetRunning ? g.maintenanceNairaPerHour * STEP_HOURS : 0;

  // ---------- Simulated telemetry (never presented as measured facility data) ----------
  let voltageV = 230;
  let freqHz = 50;
  if (rt.islanded && (gensetRunning || battDis > 0 || pvToLoad > 0)) {
    const r = (Math.sin((t + cfg.seed) * 12.9898) * 43758.5453) % 1;
    voltageV = 230 + r * (gensetRunning ? 4 : 1.5);
    freqHz = 50 + ((Math.sin((t + cfg.seed) * 7.13) * 0.5) % (gensetRunning ? 0.2 : 0.05));
  } else if (rt.islanded) {
    voltageV = 0;
    freqHz = 0;
  } else if (pq) {
    voltageV = pq.kind === "voltage_sag" || pq.kind === "voltage_swell" ? pq.value : 230;
    freqHz = pq.kind === "under_frequency" || pq.kind === "over_frequency" ? pq.value : 50;
  }

  const step: StepResult = {
    t,
    day,
    hour: hourOfDay,
    demandKw: demand,
    servedKw: served,
    unservedKw: unserved,
    pvAvailableKw: pvDc,
    pvKw,
    pvCurtailedKw,
    gridKw,
    gridConnected: !rt.islanded,
    islanded: rt.islanded,
    battKw,
    socFrac: batt.nominalKwh > 0 && hasBatt ? rt.socKwh / batt.nominalKwh : 0,
    socKwh: hasBatt ? rt.socKwh : 0,
    gensetKw,
    gensetOn: gensetRunning,
    gensetStarting,
    dieselLph,
    gridCostNaira,
    dieselCostNaira,
    maintenanceNaira,
    fuelLitres: rt.fuelL,
    deferredKw: deferred,
    serviceLevel: rt.serviceLevel,
    gensetUnavailable: !gensetUsable,
    irradianceWm2,
    startGapSec: transferGapSec,
    deliveredL,
    telemetry: { voltageV: Math.round(voltageV * 10) / 10, freqHz: Math.round(freqHz * 100) / 100, pqKind: pq?.kind },
  };

  rt.t = t + 1;
  rt.gensetOn = rt.gensetRepairUntilT > t ? false : gensetRunning || (gensetStarting && rt.gensetOn);
  return { step, events, runtime: rt };
}

const windowIndex = new WeakMap<OutageWindow[], { daily: OutageWindow[]; byDay: Map<number, OutageWindow[]> }>();

/** Outage windows applying to a day (indexed once per window list). */
function windowsForDay(windows: OutageWindow[], day: number): OutageWindow[] {
  let idx = windowIndex.get(windows);
  if (!idx) {
    idx = { daily: [], byDay: new Map() };
    for (const w of windows) {
      if (w.day === undefined) idx.daily.push(w);
      else {
        const list = idx.byDay.get(w.day) ?? [];
        list.push(w);
        idx.byDay.set(w.day, list);
      }
    }
    windowIndex.set(windows, idx);
  }
  const specific = idx.byDay.get(day);
  return specific ? (idx.daily.length ? [...idx.daily, ...specific] : specific) : idx.daily;
}

/** Advances the generator start sequence; returns the fraction of this step it can supply. */
function startGenset(
  cfg: SystemConfig,
  rt: DispatchRuntime,
  events: SimEvent[],
  t: number,
  hourOfDay: number
): { availFrac: number; starting: boolean } {
  const g = cfg.genset;
  const startSec = g.startupSeconds ?? g.startupSteps * 900;
  if (!rt.gensetOn) {
    rt.gensetOn = true;
    rt.gensetRunSteps = 0;
    rt.gensetStartRemainingSec = startSec;
    if (!rt.gensetStartedEpisode) {
      events.push(mkEvent(t, rt.islanded ? "warning" : "info", "genset_start", `Generator start command at ${fmtHour(hourOfDay)}${startSec > 0 ? ` (${startSec < 900 ? `${startSec} s` : `${Math.round(startSec / 60)} min`} to transfer)` : ""}.`));
      rt.gensetStartedEpisode = true;
    }
  }
  const rem = rt.gensetStartRemainingSec;
  const availFrac = Math.max(0, 1 - rem / 900);
  rt.gensetStartRemainingSec = Math.max(0, rem - 900);
  rt.gensetStartCountdown = Math.ceil(rt.gensetStartRemainingSec / 900);
  return { availFrac, starting: availFrac < 1 };
}

function fmtHour(h: number): string {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function fmtKwh(v: number): string {
  if (!Number.isFinite(v)) return "unlimited";
  return v >= 10000 ? `${(v / 1000).toFixed(1)} MWh` : `${Math.round(v).toLocaleString("en-US")} kWh`;
}

function pqLabel(kind: string): string {
  switch (kind) {
    case "voltage_sag":
      return "Voltage sag";
    case "voltage_swell":
      return "Voltage swell";
    case "under_frequency":
      return "Under-frequency";
    case "over_frequency":
      return "Over-frequency";
    default:
      return "Disturbance";
  }
}

export type { BatteryConfig };

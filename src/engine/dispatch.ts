/**
 * Deterministic energy dispatch engine.
 *
 * One step = 15 minutes. Source priority at the AC bus:
 *   1. Solar PV (free, zero-carbon)
 *   2. Grid import (tariffed, capped by import limit / peak-shave target)
 *   3. Battery discharge (floor depends on grid state: reserve kept when connected)
 *   4. Diesel generator (islanded support or configured grid-peak support)
 *   5. Load shedding, strictly tier 3 → tier 2 → tier 1 (tier-1 deficits are reported
 *      honestly as unserved energy, never hidden).
 *
 * Charging order: PV surplus first, then genset minimum-load top-up, then off-peak
 * grid charging to restore the outage reserve.
 */

import type {
  BatteryConfig,
  SimEvent,
  StepResult,
  SystemConfig,
  TierDemand,
} from "./types";
import { STEP_HOURS } from "./types";
import { tierDemandAt } from "./facility";
import {
  applyCharge,
  applyDischarge,
  maxChargePowerNow,
  maxDischargePowerNow,
} from "./battery";
import { fuelLph } from "./genset";

export interface DispatchRuntime {
  t: number;
  socKwh: number;
  gensetOn: boolean;
  gensetStartCountdown: number;
  islanded: boolean;
  reconnectCountdown: number;
  /** Ensures one-time events per episode. */
  gensetStartedEpisode: boolean;
  lowBatteryWarned: boolean;
  underMinLoadWarned: boolean;
}

export function initialRuntime(cfg: SystemConfig): DispatchRuntime {
  return {
    t: 0,
    socKwh: cfg.battery.initialSocFrac * cfg.battery.nominalKwh,
    gensetOn: false,
    gensetStartCountdown: 0,
    islanded: false,
    reconnectCountdown: 0,
    gensetStartedEpisode: false,
    lowBatteryWarned: false,
    underMinLoadWarned: false,
  };
}

export interface StepOutput {
  step: StepResult;
  events: SimEvent[];
  runtime: DispatchRuntime;
}

function mkEvent(
  t: number,
  severity: SimEvent["severity"],
  type: string,
  message: string
): SimEvent {
  return {
    t,
    day: Math.floor(t / 96),
    hour: ((t % 96) / 4),
    severity,
    type,
    message,
  };
}

export function stepSim(cfg: SystemConfig, rtIn: DispatchRuntime, irradianceWm2: number): StepOutput {
  const rt: DispatchRuntime = { ...rtIn };
  const events: SimEvent[] = [];
  const t = rt.t;
  const day = Math.floor(t / 96);
  const hourOfDay = (t % 96) / 4;
  const hourFloor = Math.floor(hourOfDay);

  const demand: TierDemand = tierDemandAt(cfg.facility.loads, hourFloor);
  const demandTotal = demand[1] + demand[2] + demand[3];

  // ---------- PV ----------
  const pvDc = cfg.pv.kwp * (irradianceWm2 / 1000) * cfg.pv.performanceRatio;
  const pvCapped = Math.max(0, Math.min(pvDc, cfg.inverter.ratedKw));
  let pvToLoad = Math.min(pvCapped, demandTotal);
  let pvSurplus = pvCapped - pvToLoad;
  let remaining = demandTotal - pvToLoad;

  // ---------- Grid state machine ----------
  const inOutage = cfg.grid.outageWindows.some(
    (w) => (w.day === undefined || w.day === day) && hourOfDay >= w.startHour && hourOfDay < w.endHour
  );
  const pq = cfg.pqEvents.find(
    (e) => e.day === day && hourOfDay >= e.startHour && hourOfDay < e.endHour
  );
  const gridHealthy =
    cfg.grid.available && !inOutage && !(pq && pq.tripsBreaker && cfg.islandOnSeverePQ);

  if (rt.islanded) {
    if (gridHealthy) {
      if (rt.reconnectCountdown > 0) {
        rt.reconnectCountdown -= 1;
      } else {
        rt.islanded = false;
        events.push(mkEvent(t, "info", "grid_reconnect", "Grid tie re-closed after stability delay."));
        rt.gensetStartedEpisode = false;
      }
    }
  } else if (!gridHealthy) {
    rt.islanded = true;
    rt.reconnectCountdown = cfg.grid.reconnectDelaySteps;
    rt.gensetStartedEpisode = false;
    if (inOutage) {
      events.push(
        mkEvent(t, "warning", "outage_start", `Grid outage detected at ${fmtHour(hourOfDay)} — islanding, battery assumes the bus.`)
      );
    } else if (pq) {
      events.push(
        mkEvent(
          t,
          "critical",
          "pq_trip",
          `${pqLabel(pq.kind)} to ${pq.value}${pq.kind.startsWith("voltage") ? " V" : " Hz"} at ${fmtHour(hourOfDay)} — protective islanding (simulated).`
        )
      );
    }
  } else if (pq && !pq.tripsBreaker) {
    events.push(
      mkEvent(
        t,
        "warning",
        "pq_warning",
        `${pqLabel(pq.kind)} to ${pq.value}${pq.kind.startsWith("voltage") ? " V" : " Hz"} — within ride-through band, tie stays closed (simulated).`
      )
    );
  }

  // ---------- Sources ----------
  const batt = cfg.battery;
  const hasBatt = batt.nominalKwh > 0;
  const reserveKwh = Math.max(batt.minSocFrac, batt.gridReserveSocFrac) * batt.nominalKwh;

  let gridToLoad = 0;
  let gridToBatt = 0;

  if (!rt.islanded) {
    let cap = cfg.grid.importLimitKw;
    if (cfg.peakShaveKw != null && demandTotal > cfg.peakShaveKw) {
      const shaveTarget = Math.max(0, cfg.peakShaveKw - pvToLoad);
      gridToLoad = Math.min(shaveTarget, cap, remaining);
    } else {
      gridToLoad = Math.min(cap, remaining);
    }
    remaining -= gridToLoad;

    // Off-peak grid charging to restore the outage reserve.
    if (
      hasBatt &&
      batt.gridChargeEnabled &&
      hourOfDay < batt.gridChargeWindowEndHour &&
      rt.socKwh < reserveKwh
    ) {
      const want = (reserveKwh - rt.socKwh) / (STEP_HOURS * batt.chargeEff);
      gridToBatt = Math.min(maxChargePowerNow(batt, rt.socKwh), want, Math.max(0, cap - gridToLoad));
    }
  }

  // Battery discharge (floor depends on grid state).
  let battDis = 0;
  if (hasBatt && remaining > 0) {
    const floorFrac = rt.islanded ? batt.minSocFrac : Math.max(batt.minSocFrac, batt.gridReserveSocFrac);
    const avail = maxDischargePowerNow(batt, rt.socKwh, floorFrac);
    battDis = Math.min(remaining, avail);
    remaining -= battDis;
    if (
      !rt.lowBatteryWarned &&
      rt.islanded &&
      rt.socKwh - (battDis * STEP_HOURS) / batt.dischargeEff <= batt.minSocFrac * batt.nominalKwh * 1.02 &&
      rt.socKwh > batt.minSocFrac * batt.nominalKwh
    ) {
      events.push(
        mkEvent(t, "warning", "battery_reserve", `Battery at outage floor (${Math.round(batt.minSocFrac * 100)}% SOC) — remaining deficit must come from the generator.`)
      );
      rt.lowBatteryWarned = true;
    }
  }
  if (!rt.islanded) rt.lowBatteryWarned = false;

  // Generator.
  const g = cfg.genset;
  let gensetKw = 0;
  let gensetToLoad = 0;
  let gensetToBatt = 0;
  let gensetOn = rt.gensetOn;
  let gensetStarting = false;

  if (g.failed && gensetOn) {
    gensetOn = false;
    events.push(mkEvent(t, "critical", "genset_fault", "Generator fault — unit unavailable (scenario condition)."));
  }

  if (!g.failed && remaining > 0) {
    const gensetAllowed = rt.islanded || g.canSupportGridPeak;
    if (gensetAllowed) {
      if (!gensetOn) {
        if (rt.gensetStartCountdown > 0) {
          rt.gensetStartCountdown -= 1;
          gensetStarting = true;
          if (rt.gensetStartCountdown === 0) {
            gensetOn = true; // breaker closes; unit produces from this step
          }
        } else {
          rt.gensetStartCountdown = g.startupSteps;
          if (g.startupSteps === 0) gensetOn = true;
        }
      }
      if (gensetOn) {
        gensetToLoad = Math.min(remaining, g.ratedKw);
        if (g.chargesBattery && hasBatt && gensetToLoad < g.minLoadKw) {
          gensetToBatt = Math.min(
            g.minLoadKw - gensetToLoad,
            g.ratedKw - gensetToLoad,
            maxChargePowerNow(batt, rt.socKwh)
          );
        }
      }
    }
  }
  if (gensetOn && !rt.gensetStartedEpisode) {
    events.push(
      mkEvent(
        t,
        rt.islanded ? "warning" : "info",
        "genset_start",
        `Generator online at ${fmtHour(hourOfDay)}${gensetStarting ? " (after start delay)" : ""}.`
      )
    );
    rt.gensetStartedEpisode = true;
  }
  if (gensetOn) {
    gensetKw = gensetToLoad + gensetToBatt;
    if (gensetKw === 0) {
      gensetOn = false; // nothing to serve anymore
      rt.gensetStartedEpisode = false;
    }
  }
  if (gensetOn && gensetKw < g.minLoadKw * 0.95 && !rt.underMinLoadWarned) {
    events.push(
      mkEvent(
        t,
        "warning",
        "genset_underload",
        `Generator running below minimum load point (${Math.round(gensetKw)} kW < ${g.minLoadKw} kW) — inefficient operation flagged.`
      )
    );
    rt.underMinLoadWarned = true;
  }
  if (gensetKw >= g.minLoadKw) rt.underMinLoadWarned = false;

  // PV surplus → battery.
  let pvToBatt = 0;
  if (hasBatt && pvSurplus > 0) {
    pvToBatt = Math.min(pvSurplus, maxChargePowerNow(batt, rt.socKwh));
    pvSurplus -= pvToBatt;
  }

  // ---------- SOC bookkeeping ----------
  let soc = rt.socKwh;
  if (hasBatt) {
    const chargeSeq: Array<[number, number]> = [
      [gridToBatt, batt.chargeEff],
      [gensetToBatt, batt.chargeEff],
      [pvToBatt, batt.chargeEff],
    ];
    for (const [p] of chargeSeq) {
      if (p > 0) soc = applyCharge(batt, soc, p);
    }
    if (battDis > 0) soc = applyDischarge(batt, soc, battDis);
    // Re-derive actual charge powers if room shrank mid-step (keep display consistent)
    const totalChargeKw = gridToBatt + gensetToBatt + pvToBatt;
    const achievable = (soc - (rt.socKwh - (battDis * STEP_HOURS) / batt.dischargeEff)) / (STEP_HOURS * batt.chargeEff);
    if (totalChargeKw > 0 && achievable < totalChargeKw) {
      const scale = Math.max(0, achievable) / totalChargeKw;
      gridToBatt *= scale;
      gensetToBatt *= scale;
      pvToBatt *= scale;
    }
    rt.socKwh = Math.max(batt.minSocFrac * batt.nominalKwh * 0.999, soc);
  }

  // ---------- Allocation & shedding ----------
  const servedGross = pvToLoad + gridToLoad + battDis + gensetToLoad;
  const served: TierDemand = { 1: 0, 2: 0, 3: 0 };
  let left = servedGross;
  for (const tier of [1, 2, 3] as const) {
    served[tier] = Math.min(demand[tier], left);
    left -= served[tier];
  }
  const unserved: TierDemand = {
    1: demand[1] - served[1],
    2: demand[2] - served[2],
    3: demand[3] - served[3],
  };
  if (unserved[1] > 0.5) {
    events.push(
      mkEvent(
        t,
        "critical",
        "tier1_unserved",
        `Tier-1 life-critical load deficit of ${unserved[1].toFixed(1)} kW at ${fmtHour(hourOfDay)} — system cannot serve all critical demand.`
      )
    );
  }

  const pvKw = pvToLoad + pvToBatt;
  const pvCurtailedKw = Math.max(0, pvCapped - pvToLoad - pvToBatt);
  const battKw = pvToBatt + gensetToBatt + gridToBatt - battDis;
  const gridKw = gridToLoad + gridToBatt;

  // ---------- Costs & telemetry ----------
  const gridCostNaira = gridKw * STEP_HOURS * cfg.grid.tariffNairaPerKwh;
  const dieselLph = gensetOn ? fuelLph(g, gensetKw) : 0;
  const dieselLitres = dieselLph * STEP_HOURS;
  const dieselCostNaira = dieselLitres * g.fuelNairaPerLitre;
  const maintenanceNaira = gensetOn ? g.maintenanceNairaPerHour * STEP_HOURS : 0;

  let voltageV = 230;
  let freqHz = 50;
  if (rt.islanded && gensetOn) {
    const rng = (Math.sin((t + cfg.seed) * 12.9898) * 43758.5453) % 1;
    voltageV = 230 + rng * 4;
    freqHz = 50 + ((Math.sin((t + cfg.seed) * 7.13) * 0.5) % 0.2);
  } else if (rt.islanded && !gensetOn) {
    voltageV = 0;
    freqHz = 0;
  } else if (pq) {
    voltageV = pq.kind === "voltage_sag" ? pq.value : pq.kind === "voltage_swell" ? pq.value : 230;
    freqHz = pq.kind === "under_frequency" ? pq.value : pq.kind === "over_frequency" ? pq.value : 50;
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
    socFrac: batt.nominalKwh > 0 ? rt.socKwh / batt.nominalKwh : 0,
    socKwh: rt.socKwh,
    gensetKw: gensetOn ? gensetKw : 0,
    gensetOn,
    gensetStarting,
    dieselLph: gensetOn ? dieselLph : 0,
    gridCostNaira,
    dieselCostNaira,
    maintenanceNaira,
    telemetry: {
      voltageV: Math.round(voltageV * 10) / 10,
      freqHz: Math.round(freqHz * 100) / 100,
      pqKind: pq?.kind,
    },
  };

  rt.t = t + 1;
  rt.gensetOn = gensetOn;
  return { step, events, runtime: rt };
}

function fmtHour(h: number): string {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
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

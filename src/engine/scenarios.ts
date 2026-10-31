/**
 * Default system configuration and named scenario presets for the Scenario Lab.
 *
 * All configurations are illustrative and user-editable. The brief scenario (J)
 * implements the selected competition brief: critical service continuity during a
 * city line outage (Brief #13), measured as critical-service hours maintained and
 * diesel litres avoided.
 */

import type { FeederRegime, Strategy, SystemConfig, WeatherDay } from "./types";
import { REFERENCE_HOSPITAL } from "./facility";
import { WEATHER_LIBRARY } from "./weather";
import { DEFAULT_SENTINEL_POLICY } from "./policy";
import { dayOfYear } from "./measured";

/** Engineering defaults (all documented in docs/TECHNICAL_METHODOLOGY.md). */
export const DEFAULTS = {
  gridTariffNairaPerKwh: 207, // Band A, NERC order effective 6 May 2024: ₦206.80/kWh (no later Band A order found; verify at pilot)
  dieselNairaPerLitre: 1950, // Oct-2026 retail range ₦1,900–2,020/L; Dangote gantry ₦1,800/L from 10 Oct 2026 (DATA_SOURCES #12)
  fxNairaPerUsd: 1500, // planning rate; sensitivity covers ±20 %
};

const W: Record<string, WeatherDay> = WEATHER_LIBRARY;

export function defaultConfig(): SystemConfig {
  return {
    facility: REFERENCE_HOSPITAL,
    // Reference design selected by the sizing optimizer (src/engine/sizing.ts) for the
    // Maiduguri case: 600 kWp (~3,600 m² ground/carport mount) + 600 kWh LFP + 510 kW PCS.
    pv: { kwp: 600, performanceRatio: 0.78 },
    battery: {
      nominalKwh: 600,
      minSocFrac: 0.15,
      maxSocFrac: 1.0,
      initialSocFrac: 1.0,
      maxChargeKw: 200,
      maxDischargeKw: 200,
      chargeEff: 0.95,
      dischargeEff: 0.95,
      gridReserveSocFrac: 0.8,
      gridChargeEnabled: true,
      gridChargeWindowEndHour: 6,
    },
    inverter: { ratedKw: 510 },
    genset: {
      ratedKw: 400,
      minLoadKw: 120,
      fuelFixedLph: 10,
      fuelLinearLperKwh: 0.27,
      startupSteps: 1,
      startupSeconds: 15, // ATS-class standby set: start + transfer ≈ 10–15 s
      maintenanceNairaPerHour: 3500,
      fuelNairaPerLitre: DEFAULTS.dieselNairaPerLitre,
      canSupportGridPeak: false,
      chargesBattery: true,
      failed: false,
    },
    grid: {
      available: true,
      importLimitKw: 500,
      tariffNairaPerKwh: DEFAULTS.gridTariffNairaPerKwh,
      outageWindows: [],
      reconnectDelaySteps: 2,
    },
    weather: [W.sunny, W.sunny, W.partly_cloudy],
    pqEvents: [],
    horizonDays: 3,
    islandOnSeverePQ: true,
    peakShaveKw: null,
    seed: 42,
    strategy: "sentinel",
    sentinel: DEFAULT_SENTINEL_POLICY,
  };
}

export interface ScenarioDef {
  id: string;
  name: string;
  description: string;
  briefScenario?: boolean;
  build: () => SystemConfig;
}

function withGrid(
  cfg: SystemConfig,
  windows: Array<[day: number, start: number, end: number]>
): SystemConfig {
  return {
    ...cfg,
    grid: {
      ...cfg.grid,
      outageWindows: windows.map(([d, s, e]) => ({ day: d, startHour: s, endHour: e })),
    },
  };
}

export const SCENARIOS: ScenarioDef[] = [
  {
    id: "A",
    name: "A · Normal operations",
    description: "Sunny day with two short afternoon feeder trips (2 h + 1 h). System rides through on solar and storage.",
    build: () => withGrid(defaultConfig(), [[1, 13, 15], [1, 19, 20]]),
  },
  {
    id: "B",
    name: "B · 12-hour line outage",
    description: "Transmission/feeder outage 06:00–18:00 on day 2 — the Brief #13 headline scenario.",
    briefScenario: true,
    build: () => {
      const cfg = withGrid(defaultConfig(), [[1, 6, 18]]);
      cfg.weather = [W.sunny, W.sunny, W.partly_cloudy];
      return cfg;
    },
  },
  {
    id: "C",
    name: "C · 24-hour extended outage",
    description: "Full-day blackout (day 2). Stress test of storage plus generator duty cycling.",
    build: () => withGrid(defaultConfig(), [[1, 0, 24]]),
  },
  {
    id: "D",
    name: "D · Low solar (overcast)",
    description: "Three overcast/rainy days with a 6-hour evening outage — worst-case renewable input.",
    build: () => {
      const cfg = withGrid(defaultConfig(), [[1, 12, 18]]);
      cfg.weather = [W.overcast, W.overcast, W.overcast];
      return cfg;
    },
  },
  {
    id: "E",
    name: "E · Battery degradation",
    description: "Battery at 70% of nameplate (end-of-life condition) under scenario B's outage.",
    build: () => {
      const cfg = withGrid(defaultConfig(), [[1, 6, 18]]);
      cfg.battery = {
        ...cfg.battery,
        nominalKwh: 420,
        maxChargeKw: 140,
        maxDischargeKw: 140,
      };
      return cfg;
    },
  },
  {
    id: "F",
    name: "F · Demand surge (+30%)",
    description: "Mass-casualty response: all loads up 30% during the outage day.",
    build: () => {
      const cfg = withGrid(defaultConfig(), [[1, 6, 18]]);
      cfg.facility = {
        ...cfg.facility,
        loads: cfg.facility.loads.map((l) => ({ ...l, ratedKw: l.ratedKw * 1.3 })),
      };
      return cfg;
    },
  },
  {
    id: "G",
    name: "G · Generator failure",
    description: "12-hour outage with the diesel generator unavailable — storage and solar alone carry critical loads.",
    build: () => {
      const cfg = withGrid(defaultConfig(), [[1, 6, 18]]);
      cfg.genset = { ...cfg.genset, failed: true };
      return cfg;
    },
  },
  {
    id: "H",
    name: "H · Power-quality disturbance",
    description: "Voltage sags and under-frequency excursions on the feeder; Sentinel islands protectively.",
    build: () => {
      const cfg = defaultConfig();
      cfg.pqEvents = [
        { day: 1, startHour: 10, endHour: 11, kind: "voltage_sag", value: 186, tripsBreaker: true },
        { day: 1, startHour: 15.5, endHour: 16, kind: "under_frequency", value: 48.4, tripsBreaker: true },
        { day: 2, startHour: 13, endHour: 13.5, kind: "voltage_swell", value: 253, tripsBreaker: false },
      ];
      return cfg;
    },
  },
  {
    id: "I",
    name: "I · Undersized system",
    description: "A quarter of the reference PV and storage under scenario B — shows a failing design honestly.",
    build: () => {
      const cfg = withGrid(defaultConfig(), [[1, 6, 18]]);
      cfg.pv = { kwp: 150, performanceRatio: 0.78 };
      cfg.inverter = { ratedKw: 150 };
      cfg.battery = { ...cfg.battery, nominalKwh: 150, maxChargeKw: 50, maxDischargeKw: 50 };
      return cfg;
    },
  },
  {
    id: "J",
    name: "J · Brief #13 — city feeder collapse",
    description:
      "Day-2 national grid disturbance collapsing to a 12-hour city feeder outage 06:00–18:00, day 3 partly cloudy. Sentinel's brief scenario: maximize critical-service hours, minimize diesel.",
    briefScenario: true,
    build: () => {
      const cfg = withGrid(defaultConfig(), [[1, 6, 18]]);
      cfg.weather = [W.sunny, W.sunny, W.partly_cloudy];
      return cfg;
    },
  },
];

export function scenarioById(id: string): ScenarioDef {
  return SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[0];
}


// ============================================================================
// Brief #13 — "Power for a city the grid can't protect": Maiduguri line-outage replay
// ============================================================================

/**
 * Documented event (DATA_SOURCES #9–#11): tower 372 on the Gombe–Damaturu–Maiduguri
 * 330 kV line was vandalised on 22 Sep 2024; TCN restored the Damaturu–Maiduguri section
 * on 31 Oct 2024 (~39 days). The replay uses NASA POWER measured hourly irradiance and
 * temperature for Maiduguri over exactly those dates. The hospital is the illustrative
 * 250-bed reference facility — NOT measured data from a named hospital.
 */
export const MAIDUGURI_EVENT = {
  city: "Maiduguri, Borno State, Nigeria",
  line: "Gombe–Damaturu–Maiduguri 330 kV",
  vandalised: "2024-09-22",
  restored: "2024-10-31",
  simStart: "2024-09-20",
  outageStartDay: 2,
  outageDays: 39,
  horizonDays: 42,
};

export interface LineOutageOptions {
  strategy: Strategy;
  /** Litres delivered per week, in two drops 3.5 days apart (the constrained fuel supply chain). */
  weeklySupplyLitres: number;
  tankLitres: number;
  initialFuelFrac: number;
  /** Hours/day the city's emergency plant still feeds the hospital feeder during the line outage. */
  residualGridHoursPerDay: number;
  pvKwp: number;
  batteryKwh: number;
  inverterKw: number;
  gensetKw: number;
  missedDeliveries: number[];
}

export const DEFAULT_LINE_OUTAGE: LineOutageOptions = {
  strategy: "sentinel",
  weeklySupplyLitres: 6000,
  tankLitres: 10000,
  initialFuelFrac: 0.6,
  residualGridHoursPerDay: 0,
  pvKwp: 600,
  batteryKwh: 600,
  inverterKw: 510,
  gensetKw: 400,
  missedDeliveries: [],
};

/** Typical Nigerian feeder regime: frequency matched to WBES 2014 (32.8 outages/month). */
export const TYPICAL_FEEDER: FeederRegime = { outagesPerDay: 1.08, medianDurationHours: 4, sigma: 0.8 };

export function lineOutageConfig(opts: Partial<LineOutageOptions> = {}): SystemConfig {
  const o = { ...DEFAULT_LINE_OUTAGE, ...opts };
  const base = defaultConfig();
  const ev = MAIDUGURI_EVENT;
  const windows: SystemConfig["grid"]["outageWindows"] = [];
  for (let d = ev.outageStartDay; d < ev.outageStartDay + ev.outageDays; d++) {
    if (o.residualGridHoursPerDay <= 0) windows.push({ day: d, startHour: 0, endHour: 24 });
    else {
      // Residual emergency-plant supply assumed in the evening peak window 17:00 onward.
      windows.push({ day: d, startHour: 0, endHour: 17 });
      const end = Math.min(24, 17 + o.residualGridHoursPerDay);
      if (end < 24) windows.push({ day: d, startHour: end, endHour: 24 });
    }
  }
  return {
    ...base,
    strategy: o.strategy,
    sentinel: DEFAULT_SENTINEL_POLICY,
    pv: { kwp: o.pvKwp, performanceRatio: 0.82, tempCoeffPerC: -0.0035, noctC: 45 },
    battery: {
      ...base.battery,
      nominalKwh: o.batteryKwh,
      maxChargeKw: Math.max(50, Math.round(o.batteryKwh / 3)),
      maxDischargeKw: Math.max(50, Math.round(o.batteryKwh / 3)),
      initialSocFrac: 0.9,
    },
    inverter: { ratedKw: o.inverterKw },
    genset: { ...base.genset, ratedKw: o.gensetKw, fuelNairaPerLitre: DEFAULTS.dieselNairaPerLitre },
    grid: { ...base.grid, outageWindows: windows },
    fuel: {
      tankLitres: o.tankLitres,
      initialLitres: o.tankLitres * o.initialFuelFrac,
      deliveryLitres: o.weeklySupplyLitres / 2,
      deliveryEveryDays: o.weeklySupplyLitres > 0 ? 3.5 : 0,
      firstDeliveryDay: 3,
      deliveryHour: 10,
      missedDeliveries: o.missedDeliveries,
    },
    measuredWeather: { datasetId: "maiduguri_2024", startDayOfYear: dayOfYear(ev.simStart) },
    calendarStart: ev.simStart,
    horizonDays: ev.horizonDays,
    weather: [W.sunny],
    seed: 2024,
  };
}

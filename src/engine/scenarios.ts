/**
 * Default system configuration and named scenario presets for the Scenario Lab.
 *
 * All configurations are illustrative and user-editable. The brief scenario (J)
 * implements the selected competition brief: critical service continuity during a
 * city line outage (Brief #13), measured as critical-service hours maintained and
 * diesel litres avoided.
 */

import type { SystemConfig, WeatherDay } from "./types";
import { REFERENCE_HOSPITAL } from "./facility";
import { WEATHER_LIBRARY } from "./weather";

/** Engineering defaults (all documented in docs/TECHNICAL_METHODOLOGY.md). */
export const DEFAULTS = {
  gridTariffNairaPerKwh: 210, // Band A service class, July-2024 order ~₦209.5/kWh (verify current MYTO order)
  dieselNairaPerLitre: 1550, // Lagos early-2026 average ~₦1,560/L (NBS tracker; volatile)
  fxNairaPerUsd: 1550,
};

const W: Record<string, WeatherDay> = WEATHER_LIBRARY;

export function defaultConfig(): SystemConfig {
  return {
    facility: REFERENCE_HOSPITAL,
    pv: { kwp: 300, performanceRatio: 0.78 },
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
    inverter: { ratedKw: 250 },
    genset: {
      ratedKw: 400,
      minLoadKw: 120,
      fuelFixedLph: 10,
      fuelLinearLperKwh: 0.27,
      startupSteps: 1,
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
    description: "Half the PV and battery under scenario B — shows a failing design honestly.",
    build: () => {
      const cfg = withGrid(defaultConfig(), [[1, 6, 18]]);
      cfg.pv = { kwp: 150, performanceRatio: 0.78 };
      cfg.battery = { ...cfg.battery, nominalKwh: 300, maxChargeKw: 100, maxDischargeKw: 100 };
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

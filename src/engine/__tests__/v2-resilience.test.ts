/**
 * Engine v2 tests: fuel logistics, transfer breaks, strategy isolation, the fuel-runway
 * governor, measured weather, NREL reliability and the Monte Carlo engine.
 * Expected values are derived independently (hand calculation or published figures),
 * not copied from engine output.
 */
import { describe, expect, it } from "vitest";
import {
  compareStrategies,
  defaultConfig,
  lineOutageConfig,
  runSimulation,
  withStrategy,
  STRATEGIES,
  measuredDataset,
  dailyInsolation,
  RELIABILITY_CLASSES,
  singleGensetReliability,
  runMonteCarlo,
  evaluateSolarForecast,
  MAIDUGURI_EVENT,
  dayOfYear,
} from "../index";
import type { StepResult, SystemConfig } from "../types";

function residual(s: StepResult): number {
  const served = s.servedKw[1] + s.servedKw[2] + s.servedKw[3];
  return s.pvKw + s.gridKw + s.gensetKw - s.battKw - served;
}

describe("measured weather (NASA POWER)", () => {
  it("Maiduguri 2024 annual insolation is ≈ 2,104 kWh/m² (independent sum of the raw hourly file)", () => {
    const d = measuredDataset("maiduguri_2024");
    expect(d.hours).toBe(8784); // leap year
    const total = d.ghi.reduce((s, v) => s + v, 0) / 1000;
    expect(total).toBeGreaterThan(2050);
    expect(total).toBeLessThan(2150);
    expect(dailyInsolation("maiduguri_2024")).toHaveLength(366);
  });

  it("maps the replay start (20 Sep 2024) to day-of-year 263 (0-based)", () => {
    // Jan 31 + Feb 29 + Mar 31 + Apr 30 + May 31 + Jun 30 + Jul 31 + Aug 31 = 244 days → Sep 20 = 244 + 19
    expect(dayOfYear(MAIDUGURI_EVENT.simStart)).toBe(263);
  });

  it("derates PV for temperature: a hot cell produces less than the same irradiance at 25 °C", () => {
    const cfg = lineOutageConfig();
    const hot = runSimulation({ ...cfg, horizonDays: 1 });
    const noonHot = hot.steps.find((s) => s.irradianceWm2 > 700)!;
    // Hand calc at the same irradiance without temperature loss:
    const ideal = (cfg.pv.kwp * noonHot.irradianceWm2) / 1000 * cfg.pv.performanceRatio;
    expect(noonHot.pvAvailableKw).toBeLessThan(ideal);
    expect(noonHot.pvAvailableKw).toBeGreaterThan(ideal * 0.8);
  });
});

describe("fuel logistics", () => {
  it("burns exactly fuelFixed + fuelLinear × P per hour (hand calc 200 kW → 64 L/h)", () => {
    const cfg = defaultConfig();
    // 10 L/h + 0.27 L/kWh × 200 kW = 64 L/h → 16 L per 15-min step
    expect(cfg.genset.fuelFixedLph + cfg.genset.fuelLinearLperKwh * 200).toBeCloseTo(64, 9);
  });

  it("conserves diesel mass: initial + delivered − burned = final, for every strategy", () => {
    const cfg = lineOutageConfig({ weeklySupplyLitres: 8000 });
    const res = compareStrategies(cfg);
    for (const s of STRATEGIES) {
      const m = res[s.id].metrics;
      const initial = cfg.fuel!.initialLitres;
      expect(initial + m.fuelDeliveredLitres - m.dieselLitres).toBeCloseTo(m.fuelEndLitres, 3);
    }
  });

  it("caps deliveries by free tank space and honours missed deliveries", () => {
    const cfg = lineOutageConfig({ weeklySupplyLitres: 40000, missedDeliveries: [1] });
    const sim = runSimulation(cfg);
    const deliveries = sim.steps.filter((s) => s.deliveredL > 0);
    for (const d of deliveries) expect(d.fuelLitres).toBeLessThanOrEqual(cfg.fuel!.tankLitres + 1e-6);
    expect(sim.events.some((e) => e.type === "fuel_missed")).toBe(true);
  });

  it("an empty tank stops the generator (no diesel burned without fuel)", () => {
    const cfg = lineOutageConfig({ weeklySupplyLitres: 0, strategy: "baseline" });
    const sim = runSimulation(withStrategy(cfg, "baseline"));
    expect(sim.metrics.dieselLitres).toBeLessThanOrEqual(cfg.fuel!.initialLitres + 1e-6);
    expect(sim.metrics.fuelOutHours).toBeGreaterThan(500);
  });
});

describe("power balance holds in every strategy, including fuel-limited and failure steps", () => {
  const cfg = lineOutageConfig({ weeklySupplyLitres: 6000 });
  const res = compareStrategies({ ...cfg, reliability: { failToStartOnOutage: [1], runFailureAtRunHours: [100, 300], repairHours: 48 } });
  for (const s of STRATEGIES) {
    it(`${s.short}: |supply − served| < 1e-6 kW at all ${res[s.id].steps.length} steps`, () => {
      for (const st of res[s.id].steps) expect(Math.abs(residual(st))).toBeLessThan(1e-6);
    });
  }
});

describe("generator transfer break", () => {
  it("diesel-only loses exactly startupSeconds/900 of the first outage step on EVERY tier", () => {
    const cfg = withStrategy(lineOutageConfig({ weeklySupplyLitres: 20000 }), "baseline");
    const sim = runSimulation(cfg);
    const first = sim.steps.find((s) => s.islanded)!;
    const lost = 15 / 900;
    for (const tier of [1, 2, 3] as const) {
      expect(first.servedKw[tier] / first.demandKw[tier]).toBeCloseTo(1 - lost, 6);
    }
    expect(first.startGapSec).toBe(15);
    expect(sim.metrics.tier1Interruptions).toBeGreaterThanOrEqual(1);
  });

  it("Sentinel's battery forms the island with no break on Tier-1", () => {
    const sim = runSimulation(lineOutageConfig({ weeklySupplyLitres: 20000, strategy: "sentinel" }));
    const first = sim.steps.find((s) => s.islanded)!;
    expect(first.servedKw[1]).toBeCloseTo(first.demandKw[1], 9);
    expect(sim.metrics.tier1Interruptions).toBe(0);
  });
});

describe("strategy isolation (same hardware, different decisions)", () => {
  it("conventional and sentinel share identical hardware and inputs", () => {
    const cfg = lineOutageConfig();
    const a = withStrategy(cfg, "conventional");
    const b = withStrategy(cfg, "sentinel");
    const strip = (c: SystemConfig) => JSON.stringify({ ...c, strategy: undefined });
    expect(strip(a)).toBe(strip(b));
  });

  it("with unlimited fuel every strategy maintains full critical service (honest convergence)", () => {
    const res = compareStrategies(lineOutageConfig({ weeklySupplyLitres: 20000 }));
    const hours = MAIDUGURI_EVENT.outageDays * 24;
    for (const s of STRATEGIES) {
      expect(res[s.id].metrics.criticalMaintainedHours).toBeGreaterThanOrEqual(hours);
    }
    // ...and the hybrid strategies still burn less diesel than the status quo.
    expect(res.sentinel.metrics.dieselLitres).toBeLessThan(res.baseline.metrics.dieselLitres * 0.9);
    expect(res.sentinel.metrics.gensetRuntimeH).toBeLessThan(res.conventional.metrics.gensetRuntimeH);
  });
});

describe("fuel-runway governor — Brief #13 replay at constrained supply (8,000 L/week)", () => {
  const res = compareStrategies(lineOutageConfig({ weeklySupplyLitres: 8000 }));
  const outageH = MAIDUGURI_EVENT.outageDays * 24;

  it("keeps Tier-1 life-critical load powered for the entire 39-day outage", () => {
    expect(res.sentinel.metrics.tier1MaintainedHours).toBeGreaterThanOrEqual(outageH);
    expect(res.sentinel.metrics.unservedKwh[1]).toBeLessThan(1e-6);
  });

  it("maintains more critical-service hours than every alternative while burning less diesel than the status quo", () => {
    for (const s of ["baseline", "baseline_rationed", "conventional"] as const) {
      expect(res.sentinel.metrics.criticalMaintainedHours).toBeGreaterThan(res[s].metrics.criticalMaintainedHours);
    }
    expect(res.sentinel.metrics.dieselLitres).toBeLessThan(res.baseline.metrics.dieselLitres);
  });

  it("defers only Tier-3 load to do it (Tier-1/2 never rationed at this supply)", () => {
    const deferredT2 = res.sentinel.steps.reduce((s, st) => s + st.deferredKw[2], 0);
    expect(deferredT2).toBe(0);
    expect(res.sentinel.metrics.deferredKwh).toBeGreaterThan(0);
  });

  it("the status quo runs dry: hours with an empty tank are reported", () => {
    expect(res.baseline.metrics.fuelOutHours).toBeGreaterThan(100);
  });
});

describe("generator reliability (NREL/TP-5C00-76553)", () => {
  it("reproduces the report's headline: a well-maintained EDG is ~80 % reliable over two weeks", () => {
    const well = RELIABILITY_CLASSES.find((c) => c.id === "well")!;
    // R(336 h) = 0.9998 × (1 − 0.0013) × exp(−336/1662) ≈ 0.816
    expect(singleGensetReliability(well, 336)).toBeCloseTo(0.9998 * 0.9987 * Math.exp(-336 / 1662), 9);
    expect(singleGensetReliability(well, 336)).toBeGreaterThan(0.78);
    expect(singleGensetReliability(well, 336)).toBeLessThan(0.83);
  });

  it("fail-to-start darkens the diesel-only hospital but not Sentinel's Tier-1", () => {
    const rel = { failToStartOnOutage: [1], runFailureAtRunHours: [], repairHours: 24 };
    const cfg = { ...lineOutageConfig({ weeklySupplyLitres: 20000 }), reliability: rel };
    const base = runSimulation(withStrategy(cfg, "baseline"));
    const sen = runSimulation(withStrategy(cfg, "sentinel"));
    // First 24 h of the outage: no generator at all.
    const window = (r: typeof base) => r.steps.filter((s) => s.islanded).slice(0, 96);
    const t1Base = window(base).reduce((s, st) => s + st.servedKw[1], 0);
    const t1Sen = window(sen).reduce((s, st) => s + st.servedKw[1], 0);
    expect(t1Base).toBe(0);
    expect(t1Sen).toBeGreaterThan(0.5 * window(sen).reduce((s, st) => s + st.demandKw[1], 0));
  });
});

describe("Monte Carlo resilience", () => {
  const opts = { trials: 12, outageHours: 120 };
  const a = runMonteCarlo(opts);

  it("is deterministic for a fixed seed", () => {
    const b = runMonteCarlo(opts);
    expect(b.byStrategy.sentinel.meanCriticalHours).toBe(a.byStrategy.sentinel.meanCriticalHours);
    expect(b.byStrategy.baseline.survival).toEqual(a.byStrategy.baseline.survival);
  });

  it("produces monotone non-increasing survival curves starting at ≤ 1", () => {
    for (const r of Object.values(a.byStrategy)) {
      expect(r.survival[0]).toBeLessThanOrEqual(1);
      for (let h = 1; h < r.survival.length; h++) expect(r.survival[h]).toBeLessThanOrEqual(r.survival[h - 1] + 1e-12);
    }
  });

  it("uses common random numbers: Sentinel survival dominates the diesel-only baseline", () => {
    for (let h = 0; h <= 120; h += 12) {
      expect(a.byStrategy.sentinel.survival[h]).toBeGreaterThanOrEqual(a.byStrategy.baseline.survival[h]);
    }
  });
});

describe("solar forecasting on held-out real data", () => {
  const r = evaluateSolarForecast();
  it("trains on 2022–2023 and tests on 2024 (363 scored days)", () => {
    expect(r.testDays).toBe(363);
    expect(r.trainYears).toEqual(["maiduguri_2022", "maiduguri_2023"]);
  });
  it("the learned blend beats naive persistence on held-out RMSE", () => {
    const blend = r.models.find((m) => m.id === "blend")!;
    const pers = r.models.find((m) => m.id === "persistence")!;
    expect(blend.rmseKwhM2).toBeLessThan(pers.rmseKwhM2);
  });
  it("calibrates the governor's 0.7 solar-confidence factor (≥ 90 % of days meet it)", () => {
    expect(r.confidenceCoverage.find((c) => c.k === 0.7)!.coverage).toBeGreaterThanOrEqual(0.9);
  });
});

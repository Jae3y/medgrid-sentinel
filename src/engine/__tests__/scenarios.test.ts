/**
 * Scenario-level behaviour tests — the outcomes the pitch and one-pager rely on.
 */
import { describe, expect, it } from "vitest";
import { runSimulation, compareAgainstBaseline } from "../simulate";
import { SCENARIOS, scenarioById, defaultConfig } from "../scenarios";
import { evaluateEconomics, DEFAULT_FINANCIAL } from "../financial";

describe("brief scenario (12-hour line outage, scenario B)", () => {
  const cfg = scenarioById("B").build();
  const { proposed, baseline } = compareAgainstBaseline(cfg);

  it("records the 12-hour outage plus the 0.5 h reconnection delay", () => {
    expect(proposed.metrics.outageHours).toBeCloseTo(12.5, 3);
  });

  it("maintains critical service through the outage (proposed system)", () => {
    expect(proposed.metrics.criticalServiceHours).toBeGreaterThan(12);
  });

  it("cuts diesel consumption versus the diesel-only baseline", () => {
    expect(baseline.metrics.dieselLitres).toBeGreaterThan(0);
    expect(proposed.metrics.dieselLitres).toBeLessThan(baseline.metrics.dieselLitres);
    // the saving must be material (≥ 20%)
    const saving = 1 - proposed.metrics.dieselLitres / baseline.metrics.dieselLitres;
    expect(saving).toBeGreaterThan(0.2);
  });

  it("produces an economically positive result under default assumptions", () => {
    const econ = evaluateEconomics(cfg, DEFAULT_FINANCIAL);
    expect(econ.annualSavingsNaira).toBeGreaterThan(0);
    expect(econ.dieselLitresAvoidedPerYear).toBeGreaterThan(10_000);
    expect(econ.capex.totalUsd).toBeGreaterThan(0);
  });

  it("has zero unserved tier-1 energy", () => {
    expect(proposed.metrics.unservedKwh[1]).toBeCloseTo(0, 3);
  });
});

describe("extended outage (scenario C)", () => {
  it("survives a 24-hour blackout with generator support", () => {
    const sim = runSimulation(scenarioById("C").build());
    expect(sim.metrics.outageHours).toBeCloseTo(24.5, 3);
    expect(sim.metrics.unservedKwh[1]).toBeCloseTo(0, 3);
  });
});

describe("generator failure (scenario G)", () => {
  it("stays honest about what storage + solar alone can carry", () => {
    const sim = runSimulation(scenarioById("G").build());
    // Without the generator the 06:00–09:00 window (before PV ramps) cannot be fully
    // served from a 600 kWh pack — Sentinel must show that deficit, not hide it.
    const unserved =
      sim.metrics.unservedKwh[1] + sim.metrics.unservedKwh[2] + sim.metrics.unservedKwh[3];
    expect(unserved).toBeGreaterThan(0);
    expect(sim.metrics.criticalServiceHours).toBeLessThan(12.5);
  });
});

describe("undersized system (scenario I)", () => {
  it("pays for under-sizing in diesel, and the report shows it", () => {
    const under = runSimulation(scenarioById("I").build());
    const brief = runSimulation(scenarioById("B").build());
    // Continuity essentially holds (the generator covers deficits)…
    expect(under.metrics.criticalServiceHours).toBeGreaterThan(12);
    // …but the smaller PV+battery forces substantially more generator fuel.
    expect(under.metrics.dieselLitres).toBeGreaterThan(brief.metrics.dieselLitres * 1.2);
  });
});

describe("scenario library integrity", () => {
  it("contains the ten documented scenarios", () => {
    expect(SCENARIOS).toHaveLength(10);
    expect(SCENARIOS.filter((s) => s.briefScenario).length).toBe(2);
  });

  it("every scenario builds and runs deterministically", () => {
    for (const s of SCENARIOS) {
      const a = runSimulation(s.build());
      const b = runSimulation(s.build());
      expect(JSON.stringify(a.metrics)).toBe(JSON.stringify(b.metrics));
    }
  });

  it("keeps the default config self-consistent", () => {
    const cfg = defaultConfig();
    expect(cfg.horizonDays).toBe(3);
    expect(cfg.facility.loads.length).toBe(16);
    expect(cfg.genset.ratedKw).toBeGreaterThan(300);
  });
});

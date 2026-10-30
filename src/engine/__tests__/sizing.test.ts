/**
 * Sizing-optimizer tests on a reduced search grid (keeps the suite fast).
 */
import { describe, expect, it } from "vitest";
import { searchSizing } from "../sizing";
import { scenarioById } from "../scenarios";

describe("sizing search", () => {
  it("finds a feasible design meeting the critical-hours target", () => {
    const cfg = scenarioById("B").build();
    const res = searchSizing(cfg, {
      pvValues: [0, 150, 300],
      batteryValues: [0, 300, 600],
      criticalHoursTarget: 11.4,
    });
    expect(res.best).not.toBeNull();
    expect(res.best!.criticalServiceHours).toBeGreaterThanOrEqual(11.4);
    expect(res.candidates.length).toBeGreaterThan(0);
  });

  it("best feasible design cuts diesel by at least 30% vs the baseline", () => {
    const cfg = scenarioById("B").build();
    const res = searchSizing(cfg, {
      pvValues: [0, 150, 300, 400],
      batteryValues: [200, 600, 1000],
      criticalHoursTarget: 11.4,
    });
    expect(res.best).not.toBeNull();
    expect(res.best!.dieselAvoidedPct).toBeGreaterThanOrEqual(0.3);
  });

  it("ranks by total annualized cost, not by size", () => {
    const cfg = scenarioById("B").build();
    const res = searchSizing(cfg, {
      pvValues: [0, 150, 300, 400],
      batteryValues: [200, 600, 1000],
      criticalHoursTarget: 11.4,
    });
    const feasible = res.candidates.filter((c) => c.feasible);
    for (let i = 1; i < feasible.length; i++) {
      expect(feasible[i - 1].totalAnnualizedCostNaira).toBeLessThanOrEqual(
        feasible[i].totalAnnualizedCostNaira
      );
    }
  });

  it("excludes the diesel-only corner because it avoids no diesel", () => {
    const cfg = scenarioById("B").build();
    const res = searchSizing(cfg, {
      pvValues: [0],
      batteryValues: [0],
      criticalHoursTarget: 11.4,
    });
    // (0 kWp, 0 kWh) keeps continuity via the generator but avoids 0% diesel →
    // infeasible under the brief's dual metrics; no best design may be returned.
    expect(res.best).toBeNull();
    expect(res.candidates[0].feasible).toBe(false);
  });
});

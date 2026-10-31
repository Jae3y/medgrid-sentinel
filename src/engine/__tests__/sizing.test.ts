/**
 * Sizing-optimizer tests on reduced grids (keeps the suite fast).
 * Feasibility = brief metrics in the Maiduguri replay; ranking = 20-yr NPV.
 */
import { describe, expect, it } from "vitest";
import { searchSizing } from "../sizing";
import { defaultConfig } from "../scenarios";

describe("sizing search", () => {
  const res = searchSizing(defaultConfig(), { pvValues: [150, 300, 600], batteryValues: [600] });

  it("finds a feasible design that keeps Tier-1 on for the whole 39-day outage", () => {
    expect(res.best).not.toBeNull();
    expect(res.best!.tier1Hours).toBeGreaterThanOrEqual(res.best!.outageHours);
    expect(res.best!.criticalServiceFraction).toBeGreaterThanOrEqual(0.99);
  });

  it("the selected design cuts annual diesel by at least 30% vs the diesel-only baseline", () => {
    expect(res.best!.dieselAvoidedPct).toBeGreaterThanOrEqual(0.3);
  });

  it("ranks feasible designs by NPV, highest first", () => {
    const feasible = res.candidates.filter((c) => c.feasible);
    for (let i = 1; i < feasible.length; i++) expect(feasible[i - 1].npvNaira).toBeGreaterThanOrEqual(feasible[i].npvNaira);
  });

  it("reports an undersized design as infeasible instead of hiding it", () => {
    const small = res.candidates.find((c) => c.pvKwp === 150)!;
    expect(small.feasible).toBe(false);
    expect(small.criticalServiceHours).toBeLessThan(small.outageHours);
  });
});

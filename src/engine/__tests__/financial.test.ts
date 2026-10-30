/**
 * Financial engine tests with hand-checked anchors and annualization sanity.
 */
import { describe, expect, it } from "vitest";
import {
  capexBreakdown,
  evaluateEconomics,
  annualize,
  DEFAULT_FINANCIAL,
  sensitivity,
} from "../financial";
import { scenarioById } from "../scenarios";
import { runSimulation } from "../simulate";

describe("CapEx breakdown", () => {
  it("hand-checked: 300 kWp + 600 kWh + 250 kW inverter", () => {
    const cfg = scenarioById("B").build();
    const c = capexBreakdown(cfg, DEFAULT_FINANCIAL);
    expect(c.pvUsd).toBeCloseTo(300 * 800, 6); // 240,000
    expect(c.storageUsd).toBeCloseTo(600 * 280, 6); // 168,000
    expect(c.inverterUsd).toBeCloseTo(250 * 120, 6); // 30,000
    expect(c.installUsd).toBeCloseTo(438000 * 0.12, 6); // 52,560
    expect(c.totalUsd).toBeCloseTo(490560, 6);
    expect(c.totalNaira).toBeCloseTo(490560 * 1550, 6);
  });
});

describe("annualization", () => {
  it("maps 3 simulated days onto 320 normal + 45 outage days", () => {
    const sim = runSimulation(scenarioById("B").build());
    const { annual } = annualize(sim, DEFAULT_FINANCIAL);
    // outage day: 12 h window + 0.5 h reconnection delay = 12.5 islanded hours
    expect(annual.outageHours).toBeCloseTo(12.5 * 45, 3);
    expect(annual.opexNaira).toBeGreaterThan(0);
    expect(annual.dieselLitres).toBeGreaterThan(0);
  });
});

describe("evaluateEconomics", () => {
  const econ = evaluateEconomics(scenarioById("B").build(), DEFAULT_FINANCIAL);

  it("shows operating savings versus the diesel-only baseline", () => {
    expect(econ.annualSavingsNaira).toBeGreaterThan(0);
  });

  it("computes a finite simple payback under 15 years", () => {
    expect(econ.simplePaybackYears).not.toBeNull();
    expect(econ.simplePaybackYears!).toBeGreaterThan(0);
    expect(econ.simplePaybackYears!).toBeLessThan(15);
  });

  it("produces an EaaS tariff and blended baseline cost", () => {
    expect(econ.eaasTariffNairaPerKwh).toBeGreaterThan(0);
    expect(econ.baselineBlendedCostNairaPerKwh).toBeGreaterThan(0);
  });

  it("reports avoided diesel and CO₂", () => {
    expect(econ.dieselLitresAvoidedPerYear).toBeGreaterThan(0);
    expect(econ.co2TonnesAvoidedPerYear).toBeGreaterThan(0);
  });

  it("keeps LCOE positive and finite", () => {
    expect(econ.lcoeNairaPerKwh).toBeGreaterThan(0);
    expect(Number.isFinite(econ.lcoeNairaPerKwh)).toBe(true);
  });
});

describe("sensitivity analysis", () => {
  it("returns the full documented set of one-at-a-time variations", () => {
    const rows = sensitivity(scenarioById("B").build(), DEFAULT_FINANCIAL);
    expect(rows).toHaveLength(8);
    for (const r of rows) {
      expect(Number.isFinite(r.eaasTariffNairaPerKwh)).toBe(true);
    }
  });

  it("responds in the right direction: cheaper diesel hurts the case, costlier helps", () => {
    const rows = sensitivity(scenarioById("B").build(), DEFAULT_FINANCIAL);
    const dieselDown = rows.find((r) => r.variable === "Diesel price" && r.change === "−30%")!;
    const dieselUp = rows.find((r) => r.variable === "Diesel price" && r.change === "+30%")!;
    expect(dieselUp.npvNaira).toBeGreaterThan(dieselDown.npvNaira);
  });
});

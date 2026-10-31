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
  it("hand-checked: 600 kWp + 600 kWh + 510 kW PCS + platform", () => {
    const cfg = scenarioById("B").build();
    const c = capexBreakdown(cfg, DEFAULT_FINANCIAL);
    expect(c.pvUsd).toBeCloseTo(600 * 650, 6); // 390,000
    expect(c.storageUsd).toBeCloseTo(600 * 260, 6); // 156,000
    expect(c.inverterUsd).toBeCloseTo(510 * 110, 6); // 56,100
    expect(c.installUsd).toBeCloseTo(602100 * 0.15, 6); // 90,315
    expect(c.platformUsd).toBe(12000);
    expect(c.totalUsd).toBeCloseTo(704415, 6);
    expect(c.totalNaira).toBeCloseTo(704415 * DEFAULT_FINANCIAL.fxNairaPerUsd, 6);
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

describe("evaluateEconomics (full measured year, 20-year lifecycle)", () => {
  const econ = evaluateEconomics(scenarioById("B").build(), DEFAULT_FINANCIAL);

  it("NPV and IRR agree in sign (IRR above the discount rate ⇔ NPV > 0)", () => {
    expect(econ.irr).not.toBeNull();
    expect(econ.npvNaira > 0).toBe(econ.irr! > DEFAULT_FINANCIAL.discountRate);
  });

  it("cumulative cash flow equals −CapEx + Σ net flows (independent sum)", () => {
    const sum = econ.cashFlows.reduce((s, f) => s + f.netNaira, -econ.capex.totalNaira);
    expect(econ.cashFlows[econ.cashFlows.length - 1].cumulativeNaira).toBeCloseTo(sum, 3);
  });

  it("books battery and inverter replacement in year 12", () => {
    const y12 = econ.cashFlows.find((f) => f.year === 12)!;
    const expected =
      (econ.capex.storageUsd * DEFAULT_FINANCIAL.batteryReplacementFrac + econ.capex.inverterUsd * DEFAULT_FINANCIAL.inverterReplacementFrac) *
      DEFAULT_FINANCIAL.fxNairaPerUsd;
    expect(y12.replacementNaira).toBeCloseTo(expected, 3);
  });

  it("re-pricing a cached annual run equals simulating at the new price", () => {
    const cfg = scenarioById("B").build();
    const a = evaluateEconomics(cfg, DEFAULT_FINANCIAL);
    const pricier = { ...cfg, genset: { ...cfg.genset, fuelNairaPerLitre: cfg.genset.fuelNairaPerLitre * 1.1 } };
    const b = evaluateEconomics(pricier, DEFAULT_FINANCIAL);
    // diesel cost scales exactly with price; litres unchanged
    expect(b.baselineAnnual.dieselLitres).toBeCloseTo(a.baselineAnnual.dieselLitres, 6);
    expect(b.baselineAnnual.dieselCostNaira).toBeCloseTo(a.baselineAnnual.dieselCostNaira * 1.1, 0);
  });

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
    expect(rows).toHaveLength(9);
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

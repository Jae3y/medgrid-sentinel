/**
 * Unit tests for the physics/finance primitives.
 * Expected values are hand-calculated here, independent of the implementation.
 */
import { describe, expect, it } from "vitest";
import { pvPowerAc } from "../pv";
import {
  applyCharge,
  applyDischarge,
  maxChargePowerNow,
  maxDischargePowerNow,
} from "../battery";
import { fuelLph, specificFuelConsumptionLperKwh } from "../genset";
import { crf, npvOf, irrOf } from "../financial";
import { dailyIrradiance, mulberry32 } from "../weather";
import type { BatteryConfig, GensetConfig } from "../types";

const batt: BatteryConfig = {
  nominalKwh: 500,
  minSocFrac: 0.15,
  maxSocFrac: 1.0,
  initialSocFrac: 0.5,
  maxChargeKw: 200,
  maxDischargeKw: 200,
  chargeEff: 0.95,
  dischargeEff: 0.95,
  gridReserveSocFrac: 0.8,
  gridChargeEnabled: true,
  gridChargeWindowEndHour: 6,
};

const genset: GensetConfig = {
  ratedKw: 400,
  minLoadKw: 120,
  fuelFixedLph: 10,
  fuelLinearLperKwh: 0.27,
  startupSteps: 1,
  maintenanceNairaPerHour: 3500,
  fuelNairaPerLitre: 1550,
  canSupportGridPeak: false,
  chargesBattery: true,
  failed: false,
};

describe("solar PV model", () => {
  it("applies P = P_rated × G/1000 × PR", () => {
    const r = pvPowerAc({ kwp: 300, performanceRatio: 0.78 }, 800, { ratedKw: 250 });
    expect(r.availableKw).toBeCloseTo(300 * 0.8 * 0.78, 6); // 187.2 kW
    expect(r.cappedKw).toBeCloseTo(187.2, 6);
  });

  it("respects the inverter AC limit", () => {
    const r = pvPowerAc({ kwp: 400, performanceRatio: 0.9 }, 1000, { ratedKw: 250 });
    expect(r.availableKw).toBeCloseTo(360, 6);
    expect(r.cappedKw).toBe(250);
  });

  it("produces nothing at zero irradiance", () => {
    const r = pvPowerAc({ kwp: 300, performanceRatio: 0.78 }, 0, { ratedKw: 250 });
    expect(r.cappedKw).toBe(0);
  });

  it("generates a bell-shaped synthetic day with sensible insolation", () => {
    const irr = dailyIrradiance(
      { type: "sunny", label: "Sunny", peakIrradianceWm2: 920 },
      42
    );
    expect(irr).toHaveLength(96);
    expect(irr[0]).toBe(0); // midnight
    const peak = Math.max(...irr);
    expect(peak).toBeGreaterThan(800);
    expect(peak).toBeLessThanOrEqual(920 * 1.05); // ±4% seeded noise allowed
    const insolation = irr.reduce((s, g) => s + (g * 0.25) / 1000, 0);
    expect(insolation).toBeGreaterThan(4.5); // kWh/m²/day
    expect(insolation).toBeLessThan(7);
  });

  it("is deterministic under the same seed", () => {
    const a = dailyIrradiance({ type: "sunny", label: "Sunny", peakIrradianceWm2: 920 }, 7);
    const b = dailyIrradiance({ type: "sunny", label: "Sunny", peakIrradianceWm2: 920 }, 7);
    expect(a).toEqual(b);
    expect(mulberry32(7)()).toBe(mulberry32(7)());
  });
});

describe("battery model", () => {
  it("charges SOC with η_ch × P × Δt", () => {
    // 100 kW × 0.25 h × 0.95 = 23.75 kWh
    const soc = applyCharge(batt, 250, 100);
    expect(soc - 250).toBeCloseTo(23.75, 6);
  });

  it("discharges SOC by P × Δt / η_dis", () => {
    // 100 kW × 0.25 h / 0.95 = 26.3158 kWh
    const soc = applyDischarge(batt, 250, 100);
    expect(250 - soc).toBeCloseTo(100 * 0.25 / 0.95, 6);
  });

  it("limits charging power by remaining headroom", () => {
    // SOC 499 kWh: headroom = 1 kWh → power ≈ 1/(0.25×0.95) = 4.21 kW
    const p = maxChargePowerNow(batt, 499);
    expect(p).toBeCloseTo(1 / (0.25 * 0.95), 6);
    expect(p).toBeLessThan(batt.maxChargeKw);
  });

  it("limits discharge power by the allowed floor (island floor)", () => {
    // min SOC 15% × 500 = 75 kWh. At SOC 100: available = (100−75)×0.95/0.25 = 95 kW
    const p = maxDischargePowerNow(batt, 100, 0.15);
    expect(p).toBeCloseTo(95, 6);
  });

  it("enforces the grid reserve floor when connected", () => {
    // reserve 80% × 500 = 400 kWh; at SOC 420: available = (420−400)×0.95/0.25 = 76 kW
    const p = maxDischargePowerNow(batt, 420, 0.8);
    expect(p).toBeCloseTo(76, 6);
  });
});

describe("genset fuel model", () => {
  it("uses the two-term consumption curve", () => {
    // At 250 kW: 10 + 0.27×250 = 77.5 L/h
    expect(fuelLph(genset, 250)).toBeCloseTo(77.5, 6);
    expect(fuelLph(genset, 0)).toBe(0);
    expect(fuelLph({ ...genset, failed: true }, 250)).toBe(0);
  });

  it("computes specific fuel consumption", () => {
    expect(specificFuelConsumptionLperKwh(genset, 250)).toBeCloseTo(0.31, 6);
  });
});

describe("financial primitives", () => {
  it("computes the capital recovery factor", () => {
    // CRF(14%, 10y) = 0.14×1.14¹⁰ / (1.14¹⁰ − 1) = 0.1917…
    expect(crf(0.14, 10)).toBeCloseTo(0.19171, 4);
  });

  it("computes NPV of a simple cash-flow series", () => {
    // −1000 now, +200/yr for 10 yr at 10% → −1000 + 200×6.14457 = 228.91
    const flows = [-1000, ...Array(10).fill(200)];
    expect(npvOf(flows, 0.1)).toBeCloseTo(228.91, 1);
  });

  it("solves IRR by bisection", () => {
    const flows = [-1000, 300, 300, 300, 300];
    const r = irrOf(flows);
    expect(r).not.toBeNull();
    // 4 payments of 300 on 1000 → IRR ≈ 7.7% (annuity(0.077,4) ≈ 3.35)
    expect(r!).toBeGreaterThan(0.05);
    expect(r!).toBeLessThan(0.10);
    // NPV at the found IRR must be ~0
    expect(npvOf(flows, r!)).toBeCloseTo(0, 3);
  });

  it("returns null IRR when cash flows never turn positive", () => {
    expect(irrOf([-1000, -100, -100])).toBeNull();
  });
});

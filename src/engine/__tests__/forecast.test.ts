/**
 * Forecasting & intelligence tests.
 */
import { describe, expect, it } from "vitest";
import {
  evaluateForecast,
  forecastDepletion,
  syntheticMeasuredDay,
} from "../forecast";
import { REFERENCE_HOSPITAL } from "../facility";

describe("demand forecasting", () => {
  const ev = evaluateForecast(REFERENCE_HOSPITAL.loads, 7);

  it("produces non-negative accuracy metrics", () => {
    expect(ev.persistenceMAE).toBeGreaterThanOrEqual(0);
    expect(ev.persistenceRMSE).toBeGreaterThanOrEqual(ev.persistenceMAE);
    expect(ev.scheduleAwareMAE).toBeGreaterThanOrEqual(0);
    expect(ev.scheduleAwareRMSE).toBeGreaterThanOrEqual(ev.scheduleAwareMAE);
  });

  it("schedule-aware forecast beats naive persistence on the held-out day", () => {
    expect(ev.scheduleAwareMAE).toBeLessThanOrEqual(ev.persistenceMAE);
  });

  it("detects the injected evening surge as a leave-one-out z-score anomaly", () => {
    const surge = ev.anomalies.filter((a) => a.day === 6 && a.hour >= 17 && a.hour <= 20);
    expect(surge.length).toBeGreaterThan(0);
    for (const a of surge) {
      expect(a.zScore).toBeGreaterThan(2.5);
      expect(a.observedKw).toBeGreaterThan(a.expectedKw);
    }
  });

  it("uses the same synthetic generator for reproducibility", () => {
    const a = syntheticMeasuredDay(REFERENCE_HOSPITAL.loads, 3);
    const b = syntheticMeasuredDay(REFERENCE_HOSPITAL.loads, 3);
    expect(a).toEqual(b);
  });
});

describe("battery depletion forecast", () => {
  it("reports hours of autonomy against forecast demand", () => {
    const d = forecastDepletion(600, 600, 0.15, 0.95, REFERENCE_HOSPITAL.loads, 18);
    expect(d.usableKwhNow).toBeCloseTo(485, 0); // (600−90)×0.95 = 484.5, reported rounded
    expect(d.autonomyHours).toBeGreaterThan(0);
    expect(d.message.length).toBeGreaterThan(10);
  });

  it("warns when storage cannot cover the horizon", () => {
    const d = forecastDepletion(100, 600, 0.15, 0.95, REFERENCE_HOSPITAL.loads, 18);
    expect(d.autonomyHours).toBeLessThan(12);
    expect(d.depletesAtHour).not.toBeNull();
    expect(d.message).toContain("depletes");
  });
});

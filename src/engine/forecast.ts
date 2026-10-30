/**
 * Predictive intelligence layer.
 *
 * All functions operate on explicitly synthetic "measured" history derived from the
 * facility's own profiles with seeded noise — this keeps the 48-hour POC honest:
 * no invented external data. Accuracy numbers (MAE/RMSE) are reported against a
 * held-out synthetic day, and every forecast is labelled as such.
 *
 * 1. Demand forecasting — schedule-aware forecast vs naive persistence baseline.
 * 2. Battery depletion forecasting — hours of autonomy and depletion time.
 * 3. Anomaly detection — z-score screening with plain-language explanations.
 * 4. Recommendation engine — rule-based, each tied to actual simulation numbers.
 */

import { mulberry32 } from "./weather";
import type { LoadDef } from "./types";

export interface HourlyDemand {
  hours: number[]; // 24 values, kW
}

/** Generates one day of "measured" hourly demand from load profiles + seeded noise. */
export function syntheticMeasuredDay(loads: LoadDef[], seed: number, surge = false): number[] {
  const rng = mulberry32(seed);
  return Array.from({ length: 24 }, (_, h) => {
    const base = loads.reduce((s, l) => s + l.ratedKw * (l.profile[h] ?? 0), 0);
    const noise = 1 + (rng() - 0.5) * 0.1;
    let v = base * noise;
    if (surge && h >= 17 && h < 21) v *= 1.18; // e.g. emergency generator-dependent evening shift
    return Math.max(0, v);
  });
}

export interface ForecastEvaluation {
  persistenceMAE: number;
  persistenceRMSE: number;
  scheduleAwareMAE: number;
  scheduleAwareRMSE: number;
  history: number[][]; // 7 measured days
  heldOut: number[]; // day 8 actual
  forecast: number[]; // schedule-aware forecast for day 8
  anomalies: Anomaly[];
}

/**
 * Builds a 7-day history (seeded), injects one evening surge anomaly, then scores
 * two forecasts against a held-out 8th day:
 *  - persistence (mean of history) — the "naive" baseline
 *  - schedule-aware (facility profile) — Sentinel's prior-informed model
 */
export function evaluateForecast(loads: LoadDef[], seed = 7): ForecastEvaluation {
  const history: number[][] = [];
  for (let d = 0; d < 7; d++) {
    history.push(syntheticMeasuredDay(loads, seed + d, d === 5));
  }
  const heldOut = syntheticMeasuredDay(loads, seed + 100, false);

  const meanHistory = Array.from({ length: 24 }, (_, h) =>
    history.reduce((s, day) => s + day[h], 0) / history.length
  );

  const profileExpect = Array.from({ length: 24 }, (_, h) =>
    loads.reduce((s, l) => s + l.ratedKw * (l.profile[h] ?? 0), 0)
  );

  // Hybrid forecast: 50% recent history + 50% schedule prior (avoids overfitting to the surge day).
  const forecast = meanHistory.map((m, h) => 0.5 * m + 0.5 * profileExpect[h]);
  const persistence = meanHistory;

  const mae = (f: number[]) => heldOut.reduce((s, v, h) => s + Math.abs(v - f[h]), 0) / 24;
  const rmse = (f: number[]) =>
    Math.sqrt(heldOut.reduce((s, v, h) => s + (v - f[h]) ** 2, 0) / 24);

  // Anomaly screening on the history: leave-one-out z-score per hour (a point is
  // scored against the statistics of the OTHER days, otherwise a single outlier in a
  // 7-sample window can never exceed z ≈ 2.27 and small surges would be invisible).
  const anomalies: Anomaly[] = [];
  for (let h = 0; h < 24; h++) {
    for (let i = 0; i < history.length; i++) {
      const rest = history.filter((_, j) => j !== i).map((d) => d[h]);
      const mu = rest.reduce((s, v) => s + v, 0) / rest.length;
      const sd =
        Math.sqrt(rest.reduce((s, v) => s + (v - mu) ** 2, 0) / rest.length) || mu * 0.02 || 1e-9;
      const z = (history[i][h] - mu) / sd;
      if (Math.abs(z) >= 3) {
        if (
          anomalies.some((a) => a.hour === h) &&
          Math.abs(anomalies.find((a) => a.hour === h)!.zScore) >= Math.abs(z)
        )
          continue;
        const idx = anomalies.findIndex((a) => a.hour === h);
        const anomaly: Anomaly = {
          hour: h,
          day: i + 1,
          zScore: Math.round(z * 100) / 100,
          observedKw: Math.round(history[i][h] * 10) / 10,
          expectedKw: Math.round(mu * 10) / 10,
          explanation:
            z > 0
              ? `Consumption ${Math.round(((history[i][h] - mu) / mu) * 100)}% above the mean of the other days at ${h}:00 — investigate circuit-level data (possible emergency load shift or equipment fault).`
              : `Consumption ${Math.round(((mu - history[i][h]) / mu) * 100)}% below the mean of the other days at ${h}:00 — possible load loss or metering fault.`,
        };
        if (idx >= 0) anomalies[idx] = anomaly;
        else anomalies.push(anomaly);
      }
    }
  }
  anomalies.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));

  return {
    persistenceMAE: Math.round(mae(persistence) * 10) / 10,
    persistenceRMSE: Math.round(rmse(persistence) * 10) / 10,
    scheduleAwareMAE: Math.round(mae(forecast) * 10) / 10,
    scheduleAwareRMSE: Math.round(rmse(forecast) * 10) / 10,
    history,
    heldOut,
    forecast: forecast.map((v) => Math.round(v * 10) / 10),
    anomalies,
  };
}

export interface Anomaly {
  day: number;
  hour: number;
  zScore: number;
  observedKw: number;
  expectedKw: number;
  explanation: string;
}

export interface DepletionForecast {
  usableKwhNow: number;
  /** Weighted mean critical+total demand over the next 12 h, kW. */
  avgDemandKw: number;
  autonomyHours: number;
  depletesAtHour: number | null;
  message: string;
}

/** Projects hours of autonomy from current SOC against the next 12 h of demand. */
export function forecastDepletion(
  socKwh: number,
  nominalKwh: number,
  minSocFrac: number,
  dischargeEff: number,
  loads: LoadDef[],
  currentHour: number
): DepletionForecast {
  const usable = Math.max(0, socKwh - minSocFrac * nominalKwh) * dischargeEff;
  let energy = 0;
  for (let i = 0; i < 48; i++) {
    const h = (currentHour + Math.floor(i / 4)) % 24;
    energy += (loads.reduce((s, l) => s + l.ratedKw * (l.profile[h] ?? 0), 0) * 0.25);
  }
  const avgDemandKw = energy / 12;
  const autonomyHours = avgDemandKw > 0 ? usable / avgDemandKw : 99;
  const depletesAtHour = autonomyHours < 12 ? (currentHour + autonomyHours) % 24 : null;
  return {
    usableKwhNow: Math.round(usable),
    avgDemandKw: Math.round(avgDemandKw * 10) / 10,
    autonomyHours: Math.round(autonomyHours * 10) / 10,
    depletesAtHour,
    message:
      autonomyHours >= 12
        ? `Storage covers the next 12 h of forecast demand (${Math.round(usable)} kWh usable vs ${Math.round(energy)} kWh needed).`
        : `Storage depletes in ${autonomyHours.toFixed(1)} h (~${depletesAtHour !== null ? fmtHour(depletesAtHour) : "?"}) — generator start required to protect critical loads.`,
  };
}

export interface Recommendation {
  title: string;
  detail: string;
  basis: string;
}

function fmtHour(h: number): string {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

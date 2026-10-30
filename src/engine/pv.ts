/**
 * Solar PV model (baseline transparent model, documented in docs/POWER_SYSTEM_MODEL.md):
 *
 *   P_PV(t) = P_rated × G(t)/1000 × PR        [kW]
 *
 * - P_rated: installed DC capacity (kWp)
 * - G(t):    plane-of-array irradiance (W/m²) — synthetic, clearly labelled
 * - PR:      performance ratio, includes inverter, temperature, soiling and cabling
 *            losses; therefore NO second inverter-efficiency factor is applied
 *            (avoids double counting).
 *
 * The inverter station's AC rating caps deliverable power; excess is curtailed.
 */

import { dailyIrradiance } from "./weather";
import type { InverterConfig, PVConfig, WeatherDay } from "./types";

export function pvPowerAc(pv: PVConfig, irradianceWm2: number, inverter: InverterConfig): {
  availableKw: number;
  cappedKw: number;
} {
  const dc = pv.kwp * (irradianceWm2 / 1000) * pv.performanceRatio;
  const capped = Math.min(dc, inverter.ratedKw);
  return { availableKw: dc, cappedKw: Math.max(0, capped) };
}

export function irradianceAt(weather: WeatherDay[], day: number, t: number, seed: number): number {
  const d = weather[day % weather.length];
  const irr = dailyIrradiance(d, seed + day);
  return irr[t % 96];
}

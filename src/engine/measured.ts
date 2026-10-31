/**
 * Measured weather: NASA POWER hourly all-sky surface irradiance (ALLSKY_SFC_SW_DWN,
 * W/m²) and 2 m air temperature (T2M), local standard time, retrieved 2026-10-31 from
 * https://power.larc.nasa.gov/ (community RE). Converted by scripts/build-weather-data.py.
 *
 * Hourly values are held constant across the four 15-minute steps of each hour, which
 * preserves hourly energy exactly. Global horizontal irradiance is used as plane-of-array
 * irradiance (low-latitude, low-tilt approximation — documented in the methodology).
 */

import mai22 from "../data/irradiance/maiduguri_2022.json";
import mai23 from "../data/irradiance/maiduguri_2023.json";
import mai24 from "../data/irradiance/maiduguri_2024.json";
import lagos24 from "../data/irradiance/lagos_2024.json";
import abuja24 from "../data/irradiance/abuja_2024.json";
import kano24 from "../data/irradiance/kano_2024.json";
import ph24 from "../data/irradiance/portharcourt_2024.json";
import accra24 from "../data/irradiance/accra_2024.json";
import nairobi24 from "../data/irradiance/nairobi_2024.json";
import houston24 from "../data/irradiance/houston_2024.json";

export interface MeasuredYear {
  site: string;
  lat: number;
  lon: number;
  year: number;
  source: string;
  hours: number;
  ghi: number[];
  /** 0.1 °C units */
  t2m: number[];
}

export const MEASURED: Record<string, MeasuredYear> = {
  maiduguri_2022: mai22 as MeasuredYear,
  maiduguri_2023: mai23 as MeasuredYear,
  maiduguri_2024: mai24 as MeasuredYear,
  lagos_2024: lagos24 as MeasuredYear,
  abuja_2024: abuja24 as MeasuredYear,
  kano_2024: kano24 as MeasuredYear,
  portharcourt_2024: ph24 as MeasuredYear,
  accra_2024: accra24 as MeasuredYear,
  nairobi_2024: nairobi24 as MeasuredYear,
  houston_2024: houston24 as MeasuredYear,
};

export const SITE_LABELS: Record<string, string> = {
  maiduguri: "Maiduguri, Borno (NG)",
  lagos: "Lagos (NG)",
  abuja: "Abuja (NG)",
  kano: "Kano (NG)",
  portharcourt: "Port Harcourt (NG)",
  accra: "Accra (GH)",
  nairobi: "Nairobi (KE)",
  houston: "Houston, TX (US)",
};

export function measuredDataset(id: string): MeasuredYear {
  const d = MEASURED[id];
  if (!d) throw new Error(`Unknown measured weather dataset: ${id}`);
  return d;
}

/** Irradiance (W/m²) and ambient temperature (°C) for simulated step t. */
export function measuredAt(id: string, startDayOfYear: number, t: number): { ghi: number; tC: number } {
  const d = measuredDataset(id);
  const days = Math.floor(d.hours / 24);
  const dayIdx = (startDayOfYear + Math.floor(t / 96)) % days;
  const h = dayIdx * 24 + Math.floor((t % 96) / 4);
  return { ghi: d.ghi[h] ?? 0, tC: (d.t2m[h] ?? 250) / 10 };
}

/** Day-of-year (0-based) for an ISO date in the dataset's year. */
export function dayOfYear(iso: string): number {
  const [y, m, dd] = iso.split("-").map(Number);
  const start = Date.UTC(y, 0, 1);
  return Math.round((Date.UTC(y, m - 1, dd) - start) / 86400000);
}

/** Daily insolation series (kWh/m²/day) of a dataset. */
export function dailyInsolation(id: string): number[] {
  const d = measuredDataset(id);
  const out: number[] = [];
  for (let i = 0; i + 24 <= d.ghi.length; i += 24) {
    let s = 0;
    for (let h = 0; h < 24; h++) s += d.ghi[i + h];
    out.push(s / 1000);
  }
  return out;
}

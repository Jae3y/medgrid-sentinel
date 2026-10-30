/**
 * Synthetic weather / irradiance profiles.
 *
 * IMPORTANT: These are explicitly synthetic, clearly-labelled irradiance scenarios
 * shaped from typical clear-sky behaviour for a tropical location (sunrise ~06:12,
 * sunset ~18:42, i.e. ~12.5 h day length near the equator). They are NOT measured
 * meteorological data. For pilot deployments, replace with TMY data (e.g. NASA POWER,
 * Solargis) — see docs/ASSUMPTIONS_AND_LIMITATIONS.md.
 */

import type { WeatherDay } from "./types";

const STEPS_PER_DAY = 96;

/** Deterministic PRNG (mulberry32) so every run with the same seed is identical. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SUNRISE = 6.2;
const SUNSET = 18.7;

/**
 * Generates 96 irradiance values (W/m², one per 15 min) for a single day.
 * Bell-shaped clear-sky curve raised to a soft exponent, with ±4% seeded noise.
 */
export function dailyIrradiance(day: WeatherDay, seed: number): number[] {
  const rng = mulberry32(seed * 7919 + Math.abs(hash(day.type)));
  const values: number[] = [];
  for (let i = 0; i < STEPS_PER_DAY; i++) {
    const h = i / 4; // hour of day at step start
    if (h <= SUNRISE || h >= SUNSET) {
      values.push(0);
      continue;
    }
    const x = (h - SUNRISE) / (SUNSET - SUNRISE);
    const bell = Math.pow(Math.sin(Math.PI * x), 1.35);
    const noise = 1 + (rng() - 0.5) * 0.08;
    values.push(Math.max(0, day.peakIrradianceWm2 * bell * noise));
  }
  return values;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

export const WEATHER_LIBRARY: Record<string, WeatherDay> = {
  sunny: { type: "sunny", label: "Sunny", peakIrradianceWm2: 920 },
  partly_cloudy: { type: "partly_cloudy", label: "Partly cloudy", peakIrradianceWm2: 640 },
  overcast: { type: "overcast", label: "Overcast / rainy", peakIrradianceWm2: 300 },
  harmattan: { type: "harmattan", label: "Harmattan haze", peakIrradianceWm2: 480 },
};

/** Daily insolation (kWh/m²/day) of a generated profile — used in sizing sanity checks. */
export function insolation(irr: number[]): number {
  return irr.reduce((s, g) => s + (g * 0.25) / 1000, 0);
}

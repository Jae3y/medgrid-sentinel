/**
 * Diesel generator model.
 *
 * Fuel consumption uses the standard two-term approximation widely used for genset
 * dispatch studies (see docs/POWER_SYSTEM_MODEL.md):
 *
 *   L/h = fuelFixedLph + fuelLinearLperKwh × P_out
 *
 * Defaults for a ~400 kW-class diesel set: ~10 L/h fixed (cooling, friction at speed)
 * + ~0.27 L/kWh marginal, i.e. ≈ 0.31 L/kWh at 250 kW output — consistent with
 * manufacturer datasheet ranges for well-loaded medium-speed diesel sets.
 */

import type { GensetConfig } from "./types";

export function fuelLph(g: GensetConfig, outputKw: number): number {
  if (outputKw <= 0 || g.failed) return 0;
  return g.fuelFixedLph + g.fuelLinearLperKwh * outputKw;
}

export function specificFuelConsumptionLperKwh(g: GensetConfig, outputKw: number): number {
  if (outputKw <= 0) return 0;
  return fuelLph(g, outputKw) / outputKw;
}

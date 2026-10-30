/**
 * Battery energy storage model — energy-based SOC bookkeeping (kWh).
 *
 *   SOC(t+1) = SOC(t) + η_ch × P_ch × Δt − P_dis × Δt / η_dis
 *
 * All power is AC-side (the lumped one-way efficiencies include inverter and battery
 * losses). The battery never discharges below its allowed floor:
 *   - islanded / outage:   minSocFrac
 *   - grid-connected:      max(minSocFrac, gridReserveSocFrac)
 */

import type { BatteryConfig } from "./types";

export function socLimits(b: BatteryConfig): { minKwh: number; maxKwh: number } {
  return {
    minKwh: b.minSocFrac * b.nominalKwh,
    maxKwh: b.maxSocFrac * b.nominalKwh,
  };
}

export function usableKwh(b: BatteryConfig): number {
  const { minKwh, maxKwh } = socLimits(b);
  return maxKwh - minKwh;
}

/** Maximum charging power the battery can accept right now, kW (AC side). */
export function maxChargePowerNow(b: BatteryConfig, socKwh: number): number {
  const { maxKwh } = socLimits(b);
  const room = Math.max(0, (maxKwh - socKwh) / (0.25 * b.chargeEff));
  return Math.min(b.maxChargeKw, room);
}

/** Maximum discharge power available above the allowed floor, kW (AC side). */
export function maxDischargePowerNow(b: BatteryConfig, socKwh: number, floorFrac: number): number {
  const energy = Math.max(0, (socKwh - floorFrac * b.nominalKwh) * b.dischargeEff) / 0.25;
  return Math.min(b.maxDischargeKw, energy);
}

export function applyCharge(b: BatteryConfig, socKwh: number, kw: number): number {
  return Math.min(socKwh + kw * 0.25 * b.chargeEff, b.maxSocFrac * b.nominalKwh);
}

export function applyDischarge(b: BatteryConfig, socKwh: number, kw: number): number {
  return Math.max(socKwh - (kw * 0.25) / b.dischargeEff, 0);
}

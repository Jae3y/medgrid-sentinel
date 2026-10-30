/**
 * Illustrative facility load library — a ~250-bed Nigerian secondary referral hospital.
 *
 * IMPORTANT: These load definitions are ILLUSTRATIVE reference profiles built from
 * publicly documented hospital load characteristics, not measurements from a specific
 * facility. Every value is user-configurable in the digital twin. For pilots, measured
 * feeder/circuit data replaces these profiles (see docs/ASSUMPTIONS_AND_LIMITATIONS.md).
 *
 * Tiering is a decision-support classification (life-critical / clinical priority /
 * deferrable), not a certification standard. Qualified facility engineers assign actual
 * circuit priorities.
 */

import type { FacilityConfig, LoadDef } from "./types";

const flat = (v: number): number[] => Array(24).fill(v);

/** Low utilization overnight, higher during daytime hours (default 07:00–19:00). */
function dayNight(night: number, day: number): number[] {
  return Array.from({ length: 24 }, (_, h) => (h >= 7 && h < 19 ? day : night));
}

/** Kitchen-style profile with three meal peaks. */
function meals(): number[] {
  return Array.from({ length: 24 }, (_, h) => {
    if ((h >= 6 && h < 9) || (h >= 11 && h < 14)) return 0.9;
    if (h >= 16 && h < 19) return 0.8;
    return 0.15;
  });
}

export function sumProfileKw(load: LoadDef): number {
  return load.profile.reduce((s, f) => s + f, 0) * load.ratedKw;
}

export function dailyEnergyKwh(load: LoadDef): number {
  return sumProfileKw(load);
}

export const REFERENCE_HOSPITAL: FacilityConfig = {
  name: "Reference Secondary Referral Hospital (illustrative)",
  beds: 250,
  loads: [
    // ---- TIER 1: LIFE-CRITICAL -------------------------------------------------
    {
      id: "ot",
      name: "Operating theatres (2) — surgical loads",
      tier: 1,
      ratedKw: 24,
      profile: [0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.3, 0.75, 0.75, 0.75, 0.75, 0.75, 0.75, 0.75, 0.75, 0.75, 0.3, 0.15, 0.15, 0.15, 0.15, 0.15, 0.15],
    },
    { id: "icu", name: "Intensive care unit — ventilators, monitors, infusion", tier: 1, ratedKw: 45, profile: flat(0.8) },
    { id: "fridges", name: "Blood bank & vaccine refrigeration (2–8 °C)", tier: 1, ratedKw: 6, profile: flat(1.0) },
    { id: "critlight", name: "Critical & emergency lighting (OT, ICU, ED)", tier: 1, ratedKw: 12, profile: flat(0.9) },
    { id: "oxygen", name: "Medical air & oxygen plant", tier: 1, ratedKw: 15, profile: flat(0.7) },
    { id: "ed", name: "Emergency department & clinical monitoring", tier: 1, ratedKw: 18, profile: flat(0.75) },
    // ---- TIER 2: CLINICAL PRIORITY --------------------------------------------
    { id: "wards", name: "Ward lighting & ceiling fans", tier: 2, ratedKw: 60, profile: dayNight(0.5, 0.9) },
    { id: "lab", name: "Laboratory & diagnostic imaging", tier: 2, ratedKw: 30, profile: dayNight(0.2, 0.8) },
    { id: "pharmacy", name: "Pharmacy & CSSD sterilization", tier: 2, ratedKw: 15, profile: dayNight(0.4, 0.8) },
    { id: "it", name: "Clinical IT, HMIS & communications", tier: 2, ratedKw: 20, profile: flat(0.9) },
    { id: "kitchen", name: "Kitchen & catering", tier: 2, ratedKw: 25, profile: meals() },
    { id: "water", name: "Water treatment & pumping", tier: 2, ratedKw: 15, profile: dayNight(0.4, 0.8) },
    // ---- TIER 3: DEFERRABLE ----------------------------------------------------
    { id: "admin", name: "Administration & records", tier: 3, ratedKw: 15, profile: dayNight(0.1, 0.7) },
    { id: "hvac", name: "Non-critical HVAC (split units, wards/offices)", tier: 3, ratedKw: 120, profile: dayNight(0.35, 0.9) },
    { id: "laundry", name: "Laundry", tier: 3, ratedKw: 20, profile: dayNight(0.05, 0.6) },
    { id: "staff", name: "Staff areas, security & perimeter lighting", tier: 3, ratedKw: 10, profile: flat(0.5) },
  ],
};

/** Smaller facility profile for scalability demonstrations (rural general hospital). */
export const RURAL_HOSPITAL: FacilityConfig = {
  name: "Rural General Hospital (illustrative)",
  beds: 80,
  loads: REFERENCE_HOSPITAL.loads.map((l) => ({
    ...l,
    ratedKw: Math.round(l.ratedKw * 0.35 * 10) / 10,
  })),
};

export function tierDemandAt(loads: LoadDef[], hourFloor: number): { 1: number; 2: number; 3: number } {
  const d = { 1: 0, 2: 0, 3: 0 } as { 1: number; 2: number; 3: number };
  for (const load of loads) {
    const f = load.profile[hourFloor % 24] ?? 0;
    d[load.tier] += load.ratedKw * f;
  }
  return d;
}

/**
 * Default MedGrid Sentinel dispatch policy and published generator reliability classes.
 */

import type { SentinelPolicy } from "./types";

export const DEFAULT_SENTINEL_POLICY: SentinelPolicy = {
  minHorizonHours: 24,
  maxHorizonHours: 168,
  deliveryMarginHours: 24,
  pvForecastConfidence: 0.7,
  clinicalReserveHours: 2,
  gensetStopSocFrac: 0.9,
  restoreMargin: 0.1,
};

/**
 * Emergency diesel generator reliability classes from Marqusee, Ericson & Jenket,
 * "Emergency Diesel Generator Reliability and Installation Energy Security",
 * NREL/TP-5C00-76553 (April 2020), Tables 3–5 (mean values):
 *   - Fehr data set (well-maintained, 10 kW–2 MW):   FTS 0.13 %, MTTF 1,662 run-hours
 *   - NRC data set (nuclear-industry EDGs):           FTS 0.66 %, MTTF   636 run-hours
 *   - Hong Kong data set (poorly maintained):         FTS 1.65 %, MTTF    61 run-hours
 * Mean time to repair incl. logistics (PREP data, U.S.): 37 h. Repair logistics in a
 * conflict-affected Nigerian city are an explicit, editable ASSUMPTION (default 72 h).
 */
export interface ReliabilityClass {
  id: "well" | "nrc" | "poor";
  label: string;
  failToStartProb: number;
  mttfHours: number;
  source: string;
}

export const RELIABILITY_CLASSES: ReliabilityClass[] = [
  { id: "well", label: "Well-maintained (Fehr data)", failToStartProb: 0.0013, mttfHours: 1662, source: "NREL/TP-5C00-76553 Tables 3–4" },
  { id: "nrc", label: "Average (NRC data)", failToStartProb: 0.0066, mttfHours: 636, source: "NREL/TP-5C00-76553 Tables 3–4" },
  { id: "poor", label: "Poorly maintained (Hong Kong data)", failToStartProb: 0.0165, mttfHours: 61, source: "NREL/TP-5C00-76553 Tables 3–4" },
];

/** NREL single-EDG reliability model: R(t) = OA × (1 − FTS) × exp(−t / MTTF). */
export function singleGensetReliability(cls: ReliabilityClass, hours: number, operationalAvailability = 0.9998): number {
  return operationalAvailability * (1 - cls.failToStartProb) * Math.exp(-hours / cls.mttfHours);
}

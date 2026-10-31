/**
 * Fleet / scalability analysis: the same Sentinel engine configured for a portfolio of
 * Nigerian facilities, each on its own measured NASA POWER weather year and grid regime.
 *
 * What changes per site is configuration, not code: irradiance (measured), feeder regime,
 * line-outage exposure and facility size. Prices are held at the national defaults so
 * differences come from physics and grid reliability, not from unverified local prices.
 * The fleet cost curve (procurement + standardised engineering) is an explicit HYPOTHESIS.
 */

import type { FacilityConfig, FeederRegime, SystemConfig } from "./types";
import { defaultConfig, TYPICAL_FEEDER } from "./scenarios";
import { REFERENCE_HOSPITAL } from "./facility";
import { evaluateEconomics, DEFAULT_FINANCIAL, type FinancialConfig } from "./financial";
import { measuredDataset, SITE_LABELS } from "./measured";

/** Band-A-like urban feeder: fewer, shorter interruptions (assumption, see docs). */
export const BAND_A_FEEDER: FeederRegime = { outagesPerDay: 0.4, medianDurationHours: 2, sigma: 0.7 };

export interface FleetSite {
  id: string;
  datasetId: string;
  label: string;
  regime: "conflict-affected corridor" | "typical feeder" | "Band A urban";
  feeder: FeederRegime;
  lineOutageDays: number;
}

export const FLEET_SITES: FleetSite[] = [
  { id: "maiduguri", datasetId: "maiduguri_2024", label: SITE_LABELS.maiduguri, regime: "conflict-affected corridor", feeder: TYPICAL_FEEDER, lineOutageDays: 39 },
  { id: "kano", datasetId: "kano_2024", label: SITE_LABELS.kano, regime: "typical feeder", feeder: TYPICAL_FEEDER, lineOutageDays: 0 },
  { id: "abuja", datasetId: "abuja_2024", label: SITE_LABELS.abuja, regime: "typical feeder", feeder: TYPICAL_FEEDER, lineOutageDays: 0 },
  { id: "portharcourt", datasetId: "portharcourt_2024", label: SITE_LABELS.portharcourt, regime: "typical feeder", feeder: TYPICAL_FEEDER, lineOutageDays: 0 },
  { id: "lagos", datasetId: "lagos_2024", label: SITE_LABELS.lagos, regime: "Band A urban", feeder: BAND_A_FEEDER, lineOutageDays: 0 },
];

export interface Archetype {
  id: string;
  label: string;
  scale: number;
  beds: number;
}

export const ARCHETYPES: Archetype[] = [
  { id: "referral", label: "250-bed referral hospital", scale: 1, beds: 250 },
  { id: "general", label: "80-bed general hospital", scale: 0.35, beds: 80 },
];

export function scaledFacility(f: FacilityConfig, scale: number, beds: number, name: string): FacilityConfig {
  return { name, beds, loads: f.loads.map((l) => ({ ...l, ratedKw: Math.round(l.ratedKw * scale * 10) / 10 })) };
}

export function siteConfig(archetype: Archetype): SystemConfig {
  const base = defaultConfig();
  const s = archetype.scale;
  return {
    ...base,
    facility: scaledFacility(REFERENCE_HOSPITAL, s, archetype.beds, archetype.label),
    pv: { ...base.pv, kwp: Math.round(base.pv.kwp * s) },
    battery: { ...base.battery, nominalKwh: Math.round(base.battery.nominalKwh * s), maxChargeKw: Math.round(base.battery.maxChargeKw * s), maxDischargeKw: Math.round(base.battery.maxDischargeKw * s) },
    inverter: { ratedKw: Math.round(base.inverter.ratedKw * s) },
    genset: { ...base.genset, ratedKw: Math.round(base.genset.ratedKw * s), minLoadKw: Math.round(base.genset.minLoadKw * s) },
  };
}

export interface FleetRow {
  siteId: string;
  site: string;
  regime: string;
  archetype: string;
  annualGhiKwhM2: number;
  specificYieldKwhPerKwp: number;
  capexUsd: number;
  annualSavingsNaira: number;
  paybackYears: number | null;
  npvNaira: number;
  irr: number | null;
  dieselAvoidedLitres: number;
  dieselAvoidedPct: number;
  co2AvoidedT: number;
  tier1BreaksAvoided: number;
  verdict: "strong" | "viable" | "marginal";
}

export function evaluateSite(site: FleetSite, archetype: Archetype, fin: FinancialConfig = DEFAULT_FINANCIAL): FleetRow {
  const cfg = siteConfig(archetype);
  const f: FinancialConfig = { ...fin, siteDatasetId: site.datasetId, feeder: site.feeder, lineOutageDays: site.lineOutageDays };
  const e = evaluateEconomics(cfg, f);
  const ds = measuredDataset(site.datasetId);
  const ghi = ds.ghi.reduce((a, v) => a + v, 0) / 1000;
  const verdict = e.npvNaira > 0 && (e.simplePaybackYears ?? 99) < 6 ? "strong" : (e.simplePaybackYears ?? 99) < 10 ? "viable" : "marginal";
  return {
    siteId: site.id,
    site: site.label,
    regime: site.regime,
    archetype: archetype.label,
    annualGhiKwhM2: Math.round(ghi),
    specificYieldKwhPerKwp: cfg.pv.kwp > 0 ? Math.round((e.proposedAnnual.pvKwh / cfg.pv.kwp) * 1) : 0,
    capexUsd: Math.round(e.capex.totalUsd),
    annualSavingsNaira: Math.round(e.annualSavingsNaira),
    paybackYears: e.simplePaybackYears,
    npvNaira: Math.round(e.npvNaira),
    irr: e.irr,
    dieselAvoidedLitres: Math.round(e.dieselLitresAvoidedPerYear),
    dieselAvoidedPct: e.dieselAvoidedPct,
    co2AvoidedT: Math.round(e.co2TonnesAvoidedPerYear),
    tier1BreaksAvoided: e.baselineAnnual.tier1Interruptions - e.proposedAnnual.tier1Interruptions,
    verdict,
  };
}

/**
 * Fleet cost factor (HYPOTHESIS): standardised Sentinel engineering + pooled procurement
 * reduce installed cost by an assumed 6 % per doubling of fleet size, floored at 75 %.
 * Global PV module learning rates are ~20 %+ per doubling of cumulative capacity
 * (IRENA); we assume far less because only design, procurement and installation scale here.
 */
export function fleetCostFactor(sites: number, learningPerDoubling = 0.06): number {
  if (sites <= 1) return 1;
  return Math.max(0.75, Math.pow(1 - learningPerDoubling, Math.log2(sites)));
}

export function fleetCurve(capexPerSiteUsd: number, sizes = [1, 2, 5, 10, 20, 50, 100]): { sites: number; factor: number; capexPerSiteUsd: number }[] {
  return sizes.map((n) => ({ sites: n, factor: fleetCostFactor(n), capexPerSiteUsd: Math.round(capexPerSiteUsd * fleetCostFactor(n)) }));
}

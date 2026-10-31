/**
 * Energy-as-a-Service financial engine (docs/FINANCIAL_MODEL.md).
 *
 * Method:
 *  - Annual operations come from a FULL-YEAR 15-minute simulation (35,136 steps) on
 *    measured NASA POWER weather for the site, a stochastic feeder-interruption regime
 *    (frequency calibrated to the World Bank Enterprise Survey for Nigeria) and the
 *    documented multi-week line outage. Baseline (diesel-only) and proposed (PV + BESS +
 *    Sentinel) systems see identical loads, weather and outages; fuel is unconstrained
 *    here so both deliver the same service and the comparison is pure cost.
 *  - Lifecycle: 20-year analysis, PV degradation, battery and inverter replacement,
 *    O&M, and the Sentinel platform's own hardware and subscription cost.
 *  - Ownership: NPV / IRR / payback of the hospital buying the system.
 *  - EaaS: an energy-service provider owns the assets and charges a fixed annual fee set
 *    so the hospital keeps a share of the savings from day one; the provider's IRR shows
 *    whether that is financeable.
 * Every price is an explicit, editable assumption with a source in docs/DATA_SOURCES.md.
 */

import type { FeederRegime, SimResult, Strategy, SystemConfig } from "./types";
import { CO2_KG_PER_LITRE_DIESEL } from "./types";
import { buildBaselineConfig, runSimulation } from "./simulate";
import { DEFAULTS, TYPICAL_FEEDER } from "./scenarios";
import { measuredDataset } from "./measured";

export interface FinancialConfig {
  fxNairaPerUsd: number;
  capexUsdPerKwp: number;
  capexUsdPerKwhStorage: number;
  capexUsdPerInverterKw: number;
  installOverheadPct: number;
  /** Sentinel edge controller, metering & comms per facility (USD, one-off). */
  platformCapexUsd: number;
  /** Sentinel software subscription per facility per year (USD). */
  platformAnnualUsd: number;
  omPctOfCapexPerYear: number;
  discountRate: number;
  financingRate: number;
  financingYears: number;
  analysisYears: number;
  pvDegradationPerYear: number;
  batteryLifeYears: number;
  /** Replacement cost as a fraction of today's storage cost (falling-cost assumption). */
  batteryReplacementFrac: number;
  inverterLifeYears: number;
  inverterReplacementFrac: number;
  /** Operating year simulated for annual performance. */
  siteDatasetId: string;
  feeder: FeederRegime;
  /** Multi-week line outage days per year (Maiduguri 2024: 39). 0 disables. */
  lineOutageDays: number;
  lineOutageStartDayOfYear: number;
  proposedStrategy: Strategy;
  /** Share of the operating savings the hospital keeps under EaaS (rest is the fee). */
  eaasHospitalShare: number;
  /** Legacy fields (3-day extrapolation, kept for the Scenario Lab comparison). */
  annualNormalDays: number;
  annualOutageDays: number;
}

export const DEFAULT_FINANCIAL: FinancialConfig = {
  fxNairaPerUsd: DEFAULTS.fxNairaPerUsd,
  capexUsdPerKwp: 650,
  capexUsdPerKwhStorage: 260,
  capexUsdPerInverterKw: 110,
  installOverheadPct: 0.15,
  platformCapexUsd: 12000,
  platformAnnualUsd: 4800,
  omPctOfCapexPerYear: 0.015,
  discountRate: 0.18,
  financingRate: 0.14,
  financingYears: 10,
  analysisYears: 20,
  pvDegradationPerYear: 0.005,
  batteryLifeYears: 12,
  batteryReplacementFrac: 0.6,
  inverterLifeYears: 12,
  inverterReplacementFrac: 0.7,
  siteDatasetId: "maiduguri_2024",
  feeder: TYPICAL_FEEDER,
  lineOutageDays: 39,
  lineOutageStartDayOfYear: 265, // 22 Sep (leap year 2024)
  proposedStrategy: "sentinel",
  eaasHospitalShare: 0.2,
  annualNormalDays: 320,
  annualOutageDays: 45,
};

export interface CapexBreakdown {
  pvUsd: number;
  storageUsd: number;
  inverterUsd: number;
  platformUsd: number;
  installUsd: number;
  totalUsd: number;
  totalNaira: number;
}

export function capexBreakdown(cfg: SystemConfig, fin: FinancialConfig): CapexBreakdown {
  const pvUsd = cfg.pv.kwp * fin.capexUsdPerKwp;
  const storageUsd = cfg.battery.nominalKwh * fin.capexUsdPerKwhStorage;
  const inverterUsd = cfg.inverter.ratedKw * fin.capexUsdPerInverterKw;
  const platformUsd = cfg.pv.kwp + cfg.battery.nominalKwh > 0 ? fin.platformCapexUsd : 0;
  const subtotal = pvUsd + storageUsd + inverterUsd;
  const installUsd = subtotal * fin.installOverheadPct;
  const totalUsd = subtotal + installUsd + platformUsd;
  return { pvUsd, storageUsd, inverterUsd, platformUsd, installUsd, totalUsd, totalNaira: totalUsd * fin.fxNairaPerUsd };
}

/** Operating-year configuration: same hardware, full measured year, realistic outages. */
export function annualConfig(cfg: SystemConfig, fin: FinancialConfig, strategy: Strategy): SystemConfig {
  const ds = measuredDataset(fin.siteDatasetId);
  const days = Math.floor(ds.hours / 24);
  const windows: SystemConfig["grid"]["outageWindows"] = [];
  for (let d = fin.lineOutageStartDayOfYear; d < Math.min(days, fin.lineOutageStartDayOfYear + fin.lineOutageDays); d++) {
    windows.push({ day: d, startHour: 0, endHour: 24 });
  }
  const proposed: SystemConfig = {
    ...cfg,
    strategy,
    pv: { ...cfg.pv, tempCoeffPerC: cfg.pv.tempCoeffPerC ?? -0.0035, noctC: cfg.pv.noctC ?? 45, performanceRatio: cfg.pv.tempCoeffPerC === undefined ? Math.min(0.86, cfg.pv.performanceRatio + 0.04) : cfg.pv.performanceRatio },
    grid: { ...cfg.grid, available: true, outageWindows: windows },
    feederRegime: fin.feeder,
    // Operating economics assume a serviceable generator and no demand surge: failures and
    // surges are resilience questions (Line Outage / Resilience tabs), not the cost baseline.
    genset: { ...cfg.genset, failed: false },
    loadScale: 1,
    pqEvents: [],
    fuel: undefined,
    reliability: undefined,
    measuredWeather: { datasetId: fin.siteDatasetId, startDayOfYear: 0 },
    horizonDays: days,
    calendarStart: `${ds.year}-01-01`,
    seed: 7,
  };
  return strategy === "baseline" || strategy === "baseline_rationed" ? buildBaselineConfig(proposed, strategy) : proposed;
}

export interface AnnualOps {
  opexNaira: number;
  servedKwh: number;
  demandKwh: number;
  dieselLitres: number;
  gridKwh: number;
  pvKwh: number;
  gensetRuntimeH: number;
  outageHours: number;
  criticalMaintainedHours: number;
  tier1Interruptions: number;
  gridCostNaira: number;
  dieselCostNaira: number;
  maintenanceNaira: number;
}

function opsOf(sim: SimResult): AnnualOps {
  const m = sim.metrics;
  return {
    opexNaira: m.opexNaira,
    servedKwh: m.totalServedKwh,
    demandKwh: m.totalDemandKwh,
    dieselLitres: m.dieselLitres,
    gridKwh: m.gridKwh,
    pvKwh: m.pvUsedKwh,
    gensetRuntimeH: m.gensetRuntimeH,
    outageHours: m.outageHours,
    criticalMaintainedHours: m.criticalMaintainedHours,
    tier1Interruptions: m.tier1Interruptions,
    gridCostNaira: m.gridCostNaira,
    dieselCostNaira: m.dieselCostNaira,
    maintenanceNaira: m.maintenanceNaira,
  };
}

/** Memoized annual physics: price changes re-price, they do not re-simulate. */
const annualCache = new Map<string, AnnualOps>();
function physicsKey(cfg: SystemConfig): string {
  const { genset, grid, ...rest } = cfg;
  return JSON.stringify({
    ...rest,
    genset: { ...genset, fuelNairaPerLitre: 0, maintenanceNairaPerHour: 0 },
    grid: { ...grid, tariffNairaPerKwh: 0 },
  });
}

/** Runs (or recalls) the annual simulation and prices it at the config's tariffs. */
export function annualOperations(cfg: SystemConfig, fin: FinancialConfig, strategy: Strategy): AnnualOps {
  const acfg = annualConfig(cfg, fin, strategy);
  const key = physicsKey(acfg);
  let phys = annualCache.get(key);
  if (!phys) {
    phys = opsOf(runSimulation({ ...acfg, genset: { ...acfg.genset, fuelNairaPerLitre: 1, maintenanceNairaPerHour: 1 }, grid: { ...acfg.grid, tariffNairaPerKwh: 1 } }));
    if (annualCache.size > 200) annualCache.clear();
    annualCache.set(key, phys);
  }
  // Re-price: the cached run used unit prices (₦1/L, ₦1/kWh, ₦1/run-hour).
  const gridCost = phys.gridCostNaira * acfg.grid.tariffNairaPerKwh;
  const dieselCost = phys.dieselCostNaira * acfg.genset.fuelNairaPerLitre;
  const maint = phys.maintenanceNaira * acfg.genset.maintenanceNairaPerHour;
  return { ...phys, gridCostNaira: gridCost, dieselCostNaira: dieselCost, maintenanceNaira: maint, opexNaira: gridCost + dieselCost + maint };
}

/** Legacy 3-day extrapolation (Scenario Lab context only — not used for economics). */
export function annualize(sim: SimResult, fin: FinancialConfig) {
  const days = sim.perDay;
  const outageDay = days.find((d) => d.outageHours >= 6) ?? days[0];
  const normalDays = days.filter((d) => d !== outageDay);
  const avgNormal = {
    opex: avg(normalDays.map((d) => d.opexNaira)),
    served: avg(normalDays.map((d) => d.servedKwh)),
    diesel: avg(normalDays.map((d) => d.dieselLitres)),
    grid: avg(normalDays.map((d) => d.gridKwh)),
    pv: avg(normalDays.map((d) => d.pvKwh)),
  };
  const outageDays = sim.perDay.filter((d) => d.outageHours >= 6);
  const annual = {
    opexNaira: avgNormal.opex * fin.annualNormalDays + outageDay.opexNaira * fin.annualOutageDays,
    servedKwh: avgNormal.served * fin.annualNormalDays + outageDay.servedKwh * fin.annualOutageDays,
    dieselLitres: avgNormal.diesel * fin.annualNormalDays + outageDay.dieselLitres * fin.annualOutageDays,
    gridKwh: avgNormal.grid * fin.annualNormalDays + outageDay.gridKwh * fin.annualOutageDays,
    pvKwh: avgNormal.pv * fin.annualNormalDays + outageDay.pvKwh * fin.annualOutageDays,
    criticalServiceHours: outageDays.reduce((s, d) => s + d.criticalServiceHours, 0) * fin.annualOutageDays,
    outageHours: outageDays.reduce((s, d) => s + d.outageHours, 0) * fin.annualOutageDays,
  };
  return { annual, avgNormal, outageDay };
}

function avg(xs: number[]): number {
  return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0;
}

export function crf(rate: number, years: number): number {
  if (rate === 0) return 1 / years;
  return (rate * Math.pow(1 + rate, years)) / (Math.pow(1 + rate, years) - 1);
}

export interface YearFlow {
  year: number;
  savingsNaira: number;
  omNaira: number;
  platformNaira: number;
  replacementNaira: number;
  netNaira: number;
  cumulativeNaira: number;
}

export interface EconomicResult {
  capex: CapexBreakdown;
  baselineAnnual: AnnualOps;
  proposedAnnual: AnnualOps;
  annualSavingsNaira: number;
  /** Year-1 savings net of O&M and platform subscription. */
  netAnnualBenefitNaira: number;
  simplePaybackYears: number | null;
  npvNaira: number;
  irr: number | null;
  cashFlows: YearFlow[];
  lcoeNairaPerKwh: number;
  baselineLcoeNairaPerKwh: number;
  eaasTariffNairaPerKwh: number;
  eaasAssetTariffNairaPerKwh: number;
  eaasAnnualFeeNaira: number;
  /** Provider IRR when the fee leaves the hospital `eaasHospitalShare` of the savings. */
  eaasProviderIrr: number | null;
  /** Financing rate at which a CRF-based fee equals the savings (breakeven). */
  eaasBreakevenFinancingRate: number | null;
  baselineBlendedCostNairaPerKwh: number;
  dieselLitresAvoidedPerYear: number;
  dieselAvoidedPct: number;
  co2TonnesAvoidedPerYear: number;
  gensetHoursAvoidedPerYear: number;
  serviceTariffPerBedDayNaira: number | null;
  baselineEnergyCostPerBedDayNaira: number;
  proposedEnergyCostPerBedDayNaira: number;
}

export function evaluateEconomics(cfg: SystemConfig, fin: FinancialConfig): EconomicResult {
  const capex = capexBreakdown(cfg, fin);
  const b = annualOperations(cfg, fin, "baseline");
  const p = annualOperations(cfg, fin, fin.proposedStrategy);

  const annualSavings = b.opexNaira - p.opexNaira;
  const omAnnual = (capex.totalNaira - capex.platformUsd * fin.fxNairaPerUsd) * fin.omPctOfCapexPerYear;
  const platformAnnual = capex.platformUsd > 0 ? fin.platformAnnualUsd * fin.fxNairaPerUsd : 0;
  const storageNaira = capex.storageUsd * fin.fxNairaPerUsd;
  const inverterNaira = capex.inverterUsd * fin.fxNairaPerUsd;

  // Conservative: ALL savings are assumed to degrade with PV yield.
  const pvShare = 1;
  const flows: number[] = [-capex.totalNaira];
  const cashFlows: YearFlow[] = [];
  let cum = -capex.totalNaira;
  for (let y = 1; y <= fin.analysisYears; y++) {
    const deg = Math.pow(1 - fin.pvDegradationPerYear, y - 1);
    const savings = annualSavings * (1 - pvShare * (1 - deg));
    let replacement = 0;
    if (fin.batteryLifeYears > 0 && y % fin.batteryLifeYears === 0 && y < fin.analysisYears) replacement += storageNaira * fin.batteryReplacementFrac;
    if (fin.inverterLifeYears > 0 && y % fin.inverterLifeYears === 0 && y < fin.analysisYears) replacement += inverterNaira * fin.inverterReplacementFrac;
    const net = savings - omAnnual - platformAnnual - replacement;
    cum += net;
    flows.push(net);
    cashFlows.push({ year: y, savingsNaira: savings, omNaira: omAnnual, platformNaira: platformAnnual, replacementNaira: replacement, netNaira: net, cumulativeNaira: cum });
  }
  const npv = npvOf(flows, fin.discountRate);
  const irrVal = irrOf(flows);
  const firstNet = annualSavings - omAnnual - platformAnnual;
  const payback = firstNet > 0 ? paybackYears(capex.totalNaira, cashFlows) : null;

  // Discounted LCOE of the energy the facility consumes (capex + O&M + platform + replacements + residual opex).
  let pvE = 0;
  let pvCost = capex.totalNaira;
  let pvBaseCost = 0;
  for (let y = 1; y <= fin.analysisYears; y++) {
    const df = Math.pow(1 + fin.discountRate, -y);
    pvE += p.servedKwh * df;
    pvCost += (p.opexNaira + omAnnual + platformAnnual + cashFlows[y - 1].replacementNaira) * df;
    pvBaseCost += b.opexNaira * df;
  }
  const lcoe = pvE > 0 ? pvCost / pvE : 0;
  const baseLcoe = pvE > 0 ? pvBaseCost / pvE : 0;

  // EaaS: provider owns PV + BESS + platform, carries O&M and replacements.
  const fee = annualSavings * (1 - fin.eaasHospitalShare);
  const providerFlows = [-capex.totalNaira, ...cashFlows.map((c) => fee - c.omNaira - c.platformNaira - c.replacementNaira)];
  const providerIrr = irrOf(providerFlows);
  const assetKwh = p.pvKwh;
  let breakeven: number | null = null;
  {
    const g = (r: number) => capex.totalNaira * crf(r, fin.financingYears) + omAnnual + platformAnnual - annualSavings;
    let lo = 0.001;
    let hi = 0.8;
    if (g(lo) <= 0 && g(hi) >= 0) {
      for (let i = 0; i < 60; i++) {
        const mid = (lo + hi) / 2;
        if (g(mid) > 0) hi = mid;
        else lo = mid;
      }
      breakeven = (lo + hi) / 2;
    } else if (g(hi) < 0) breakeven = hi;
  }

  const beds = cfg.facility.beds;
  return {
    capex,
    baselineAnnual: b,
    proposedAnnual: p,
    annualSavingsNaira: annualSavings,
    netAnnualBenefitNaira: firstNet,
    simplePaybackYears: payback,
    npvNaira: npv,
    irr: irrVal,
    cashFlows,
    lcoeNairaPerKwh: lcoe,
    baselineLcoeNairaPerKwh: baseLcoe,
    eaasTariffNairaPerKwh: p.servedKwh > 0 ? fee / p.servedKwh : 0,
    eaasAssetTariffNairaPerKwh: assetKwh > 0 ? fee / assetKwh : 0,
    eaasAnnualFeeNaira: fee,
    eaasProviderIrr: providerIrr,
    eaasBreakevenFinancingRate: breakeven,
    baselineBlendedCostNairaPerKwh: b.servedKwh > 0 ? b.opexNaira / b.servedKwh : 0,
    dieselLitresAvoidedPerYear: b.dieselLitres - p.dieselLitres,
    dieselAvoidedPct: b.dieselLitres > 0 ? 1 - p.dieselLitres / b.dieselLitres : 0,
    co2TonnesAvoidedPerYear: ((b.dieselLitres - p.dieselLitres) * CO2_KG_PER_LITRE_DIESEL) / 1000,
    gensetHoursAvoidedPerYear: b.gensetRuntimeH - p.gensetRuntimeH,
    serviceTariffPerBedDayNaira: beds > 0 ? fee / 365 / beds : null,
    baselineEnergyCostPerBedDayNaira: beds > 0 ? b.opexNaira / 365 / beds : 0,
    proposedEnergyCostPerBedDayNaira: beds > 0 ? (p.opexNaira + fee) / 365 / beds : 0,
  };
}

function paybackYears(capex: number, flows: YearFlow[]): number | null {
  let cum = -capex;
  for (const f of flows) {
    const next = cum + f.netNaira;
    if (next >= 0 && f.netNaira > 0) return f.year - 1 + -cum / f.netNaira;
    cum = next;
  }
  return null;
}

export function npvOf(flows: number[], rate: number): number {
  return flows.reduce((s, f, i) => s + f / Math.pow(1 + rate, i), 0);
}

export function irrOf(flows: number[]): number | null {
  let lo = -0.9;
  let hi = 3;
  const f = (r: number) => npvOf(flows, r);
  let flo = f(lo);
  const fhi = f(hi);
  if (flo * fhi > 0) return null;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    const fm = f(mid);
    if (flo * fm <= 0) hi = mid;
    else {
      lo = mid;
      flo = fm;
    }
  }
  return (lo + hi) / 2;
}

export interface SensitivityRow {
  variable: string;
  change: string;
  paybackYears: number | null;
  npvNaira: number;
  irr: number | null;
  eaasTariffNairaPerKwh: number;
}

/** One-variable-at-a-time sensitivity on the decision-relevant inputs. */
export function sensitivity(cfg: SystemConfig, fin: FinancialConfig): SensitivityRow[] {
  const rows: SensitivityRow[] = [];
  const run = (f: (x: SystemConfig, g: FinancialConfig) => void, label: string, change: string): void => {
    const c = structuredClone(cfg);
    const g = structuredClone(fin);
    f(c, g);
    const r = evaluateEconomics(c, g);
    rows.push({ variable: label, change, paybackYears: r.simplePaybackYears, npvNaira: r.npvNaira, irr: r.irr, eaasTariffNairaPerKwh: r.eaasTariffNairaPerKwh });
  };
  run((c) => void (c.genset.fuelNairaPerLitre *= 0.7), "Diesel price", "−30%");
  run((c) => void (c.genset.fuelNairaPerLitre *= 1.3), "Diesel price", "+30%");
  run((_, g) => {
    g.capexUsdPerKwp *= 1.3;
    g.capexUsdPerKwhStorage *= 1.3;
    g.capexUsdPerInverterKw *= 1.3;
  }, "Equipment CapEx", "+30%");
  run((_, g) => {
    g.capexUsdPerKwp *= 0.8;
    g.capexUsdPerKwhStorage *= 0.8;
    g.capexUsdPerInverterKw *= 0.8;
  }, "Equipment CapEx", "−20%");
  run((_, g) => void (g.fxNairaPerUsd *= 1.2), "Naira depreciation", "+20% ₦/$");
  run((c) => void (c.pv.performanceRatio *= 0.9), "Solar yield (PR)", "−10%");
  run((_, g) => void (g.lineOutageDays = 0), "Line outage", "none this year");
  run((_, g) => void (g.feeder = { ...g.feeder, outagesPerDay: g.feeder.outagesPerDay / 2 }), "Feeder interruptions", "halved");
  run((_, g) => void (g.discountRate = 0.1), "Discount rate", "18% → 10%");
  return rows;
}

export { CO2_KG_PER_LITRE_DIESEL };

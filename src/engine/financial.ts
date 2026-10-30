/**
 * Energy-as-a-Service financial engine.
 *
 * Method (docs/FINANCIAL_MODEL.md):
 *  - Annual operations are extrapolated from a representative 3-day simulation:
 *      320 "normal" days + 45 "outage" days (12 h line outage each) + allowance that
 *      day 3 of the sim is partly cloudy. This mix is an explicit, editable assumption.
 *  - Ownership: CapEx financed at the discount rate; NPV and simple payback computed
 *    on operating savings (grid + diesel + genset O&M avoided).
 *  - EaaS: provider owns assets; hospital pays a fixed service tariff that must cover
 *    annualized CapEx (CRF at the financing rate) + O&M. Tariff is compared with the
 *    hospital's blended baseline cost of electricity — honestly, including when it
 *    does not yet beat the grid tariff alone.
 */

import type { SimResult, SystemConfig } from "./types";
import { buildBaselineConfig, runSimulation } from "./simulate";
import { DEFAULTS } from "./scenarios";

export interface FinancialConfig {
  fxNairaPerUsd: number;
  capexUsdPerKwp: number;
  capexUsdPerKwhStorage: number;
  capexUsdPerInverterKw: number;
  installOverheadPct: number;
  omPctOfCapexPerYear: number;
  annualNormalDays: number;
  annualOutageDays: number;
  discountRate: number;
  financingRate: number;
  financingYears: number;
  analysisYears: number;
}

export const DEFAULT_FINANCIAL: FinancialConfig = {
  fxNairaPerUsd: DEFAULTS.fxNairaPerUsd,
  capexUsdPerKwp: 800,
  capexUsdPerKwhStorage: 280,
  capexUsdPerInverterKw: 120,
  installOverheadPct: 0.12,
  omPctOfCapexPerYear: 0.02,
  annualNormalDays: 320,
  annualOutageDays: 45,
  discountRate: 0.18,
  financingRate: 0.14,
  financingYears: 10,
  analysisYears: 10,
};

export interface CapexBreakdown {
  pvUsd: number;
  storageUsd: number;
  inverterUsd: number;
  installUsd: number;
  totalUsd: number;
  totalNaira: number;
}

export function capexBreakdown(cfg: SystemConfig, fin: FinancialConfig): CapexBreakdown {
  const pvUsd = cfg.pv.kwp * fin.capexUsdPerKwp;
  const storageUsd = cfg.battery.nominalKwh * fin.capexUsdPerKwhStorage;
  const inverterUsd = cfg.inverter.ratedKw * fin.capexUsdPerInverterKw;
  const subtotal = pvUsd + storageUsd + inverterUsd;
  const installUsd = subtotal * fin.installOverheadPct;
  const totalUsd = subtotal + installUsd;
  return {
    pvUsd,
    storageUsd,
    inverterUsd,
    installUsd,
    totalUsd,
    totalNaira: totalUsd * fin.fxNairaPerUsd,
  };
}

/** Extrapolates a 3-day simulation (normal / outage / normal) to annual operations. */
export function annualize(sim: SimResult, fin: FinancialConfig) {
  // day 0: normal (sunny), day 1: outage day, day 2: partly-cloudy normal
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
  const annual = {
    opexNaira:
      avgNormal.opex * fin.annualNormalDays + outageDay.opexNaira * fin.annualOutageDays,
    servedKwh:
      avgNormal.served * fin.annualNormalDays + outageDay.servedKwh * fin.annualOutageDays,
    dieselLitres:
      avgNormal.diesel * fin.annualNormalDays + outageDay.dieselLitres * fin.annualOutageDays,
    gridKwh: avgNormal.grid * fin.annualNormalDays + outageDay.gridKwh * fin.annualOutageDays,
    pvKwh: avgNormal.pv * fin.annualNormalDays + outageDay.pvKwh * fin.annualOutageDays,
    // continuity metrics annualized from outage days only
    criticalServiceHours: sim.perDay
      .filter((d) => d.outageHours >= 6)
      .reduce((s, d) => s + d.criticalServiceHours, 0) * fin.annualOutageDays,
    outageHours: sim.perDay
      .filter((d) => d.outageHours >= 6)
      .reduce((s, d) => s + d.outageHours, 0) * fin.annualOutageDays,
  };
  return { annual, avgNormal, outageDay };
}

function avg(xs: number[]): number {
  return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0;
}

export function crf(rate: number, years: number): number {
  return (rate * Math.pow(1 + rate, years)) / (Math.pow(1 + rate, years) - 1);
}

export interface EconomicResult {
  capex: CapexBreakdown;
  baselineAnnual: ReturnType<typeof annualize>["annual"];
  proposedAnnual: ReturnType<typeof annualize>["annual"];
  annualSavingsNaira: number;
  simplePaybackYears: number | null;
  npvNaira: number;
  irr: number | null;
  lcoeNairaPerKwh: number;
  /** Full EaaS service fee / total served kWh — context only, see asset tariff below. */
  eaasTariffNairaPerKwh: number;
  /** EaaS fee ÷ energy actually delivered by the assets (PV + battery discharge). */
  eaasAssetTariffNairaPerKwh: number;
  /** Annual EaaS fee, naira. */
  eaasAnnualFeeNaira: number;
  /** Financing rate at which the EaaS fee equals the operating savings (breakeven). */
  eaasBreakevenFinancingRate: number | null;
  baselineBlendedCostNairaPerKwh: number;
  dieselLitresAvoidedPerYear: number;
  co2TonnesAvoidedPerYear: number;
  serviceTariffPerBedDayNaira: number | null;
}

export function evaluateEconomics(cfg: SystemConfig, fin: FinancialConfig): EconomicResult {
  const capex = capexBreakdown(cfg, fin);
  const baseline = runSimulation(baselineOf(cfg));
  const proposed = runSimulation(cfg);
  const b = annualize(baseline, fin).annual;
  const p = annualize(proposed, fin).annual;

  const annualSavings = b.opexNaira - p.opexNaira;
  const omAnnual = capex.totalNaira * fin.omPctOfCapexPerYear;

  // Ownership cash flows: -capex now, + (savings - O&M) each year.
  const flows: number[] = [-capex.totalNaira];
  for (let y = 1; y <= fin.analysisYears; y++) flows.push(annualSavings - omAnnual);

  const npv = npvOf(flows, fin.discountRate);
  const irrVal = irrOf(flows);
  const payback =
    annualSavings - omAnnual > 0 ? capex.totalNaira / (annualSavings - omAnnual) : null;

  // LCOE over the analysis period at the discount rate.
  let pvEnergy = 0;
  let pvCost = capex.totalNaira;
  for (let y = 1; y <= fin.analysisYears; y++) {
    const df = Math.pow(1 + fin.discountRate, -y);
    pvEnergy += p.servedKwh * df;
    pvCost += omAnnual * df;
  }
  const lcoe = pvEnergy > 0 ? pvCost / pvEnergy : 0;

  // EaaS at the provider's financing terms. The fee buys the asset service (PV
  // generation + storage duty + maintenance), while the hospital keeps buying grid
  // power for the remainder — so the honest comparisons are (a) fee vs operating
  // savings, and (b) fee per unit of asset-delivered energy.
  const crfVal = crf(fin.financingRate, fin.financingYears);
  const eaasAnnual = capex.totalNaira * crfVal + omAnnual;
  const eaasTariff = p.servedKwh > 0 ? eaasAnnual / p.servedKwh : 0;
  const assetKwh = p.pvKwh;
  const eaasAssetTariff = assetKwh > 0 ? eaasAnnual / assetKwh : 0;
  // breakeven financing rate: crf(r, N)×capex + om = savings  →  solve by bisection
  let breakeven: number | null = null;
  {
    let lo = 0.001;
    let hi = 0.5;
    const g = (r: number) => capex.totalNaira * crf(r, fin.financingYears) + omAnnual - annualSavings;
    if (g(lo) <= 0 && g(hi) >= 0) {
      for (let i = 0; i < 60; i++) {
        const mid = (lo + hi) / 2;
        if (g(mid) > 0) hi = mid;
        else lo = mid;
      }
      breakeven = (lo + hi) / 2;
    }
  }

  const baselineBlended = b.servedKwh > 0 ? b.opexNaira / b.servedKwh : 0;

  return {
    capex,
    baselineAnnual: b,
    proposedAnnual: p,
    annualSavingsNaira: annualSavings,
    simplePaybackYears: payback,
    npvNaira: npv,
    irr: irrVal,
    lcoeNairaPerKwh: lcoe,
    eaasTariffNairaPerKwh: eaasTariff,
    eaasAssetTariffNairaPerKwh: eaasAssetTariff,
    eaasAnnualFeeNaira: eaasAnnual,
    eaasBreakevenFinancingRate: breakeven,
    baselineBlendedCostNairaPerKwh: baselineBlended,
    dieselLitresAvoidedPerYear: b.dieselLitres - p.dieselLitres,
    co2TonnesAvoidedPerYear: ((b.dieselLitres - p.dieselLitres) * 2.68) / 1000,
    serviceTariffPerBedDayNaira:
      cfg.facility.beds > 0 ? eaasAnnual / 365 / cfg.facility.beds : null,
  };
}

function baselineOf(cfg: SystemConfig): SystemConfig {
  return buildBaselineConfig(cfg);
}

export function npvOf(flows: number[], rate: number): number {
  return flows.reduce((s, f, i) => s + f / Math.pow(1 + rate, i), 0);
}

export function irrOf(flows: number[]): number | null {
  let lo = -0.9;
  let hi = 3;
  const f = (r: number) => npvOf(flows, r);
  let flo = f(lo);
  let fhi = f(hi);
  if (flo * fhi > 0) return null;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const fm = f(mid);
    if (flo * fm <= 0) {
      hi = mid;
      fhi = fm;
    } else {
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
  eaasTariffNairaPerKwh: number;
}

/** One-variable-at-a-time sensitivity on the four most decision-relevant inputs. */
export function sensitivity(cfg: SystemConfig, fin: FinancialConfig): SensitivityRow[] {
  const rows: SensitivityRow[] = [];
  const run = (f: (x: SystemConfig, g: FinancialConfig) => void, label: string, change: string): void => {
    const c = structuredClone(cfg);
    const g = structuredClone(fin);
    f(c, g);
    const r = evaluateEconomics(c, g);
    rows.push({
      variable: label,
      change,
      paybackYears: r.simplePaybackYears,
      npvNaira: r.npvNaira,
      eaasTariffNairaPerKwh: r.eaasTariffNairaPerKwh,
    });
  };

  run((c, g) => {
    c.genset.fuelNairaPerLitre = DEFAULTS.dieselNairaPerLitre * 0.7;
  }, "Diesel price", "−30%");
  run((c, g) => {
    c.genset.fuelNairaPerLitre = DEFAULTS.dieselNairaPerLitre * 1.3;
  }, "Diesel price", "+30%");
  run((c, g) => {
    g.capexUsdPerKwp *= 1.2;
    g.capexUsdPerKwhStorage *= 1.2;
    g.capexUsdPerInverterKw *= 1.2;
  }, "Equipment CapEx", "+20%");
  run((c, g) => {
    g.capexUsdPerKwp *= 0.8;
    g.capexUsdPerKwhStorage *= 0.8;
    g.capexUsdPerInverterKw *= 0.8;
  }, "Equipment CapEx", "−20%");
  run((c) => {
    c.pv.performanceRatio = c.pv.performanceRatio * 0.9;
  }, "Solar yield (PR)", "−10%");
  run((c, g) => {
    c.grid.tariffNairaPerKwh = DEFAULTS.gridTariffNairaPerKwh * 0.8;
  }, "Grid tariff", "−20%");
  run((c, g) => {
    g.annualOutageDays = 20;
  }, "Outage frequency", "45 → 20 days/yr");
  run((c, g) => {
    g.annualOutageDays = 70;
  }, "Outage frequency", "45 → 70 days/yr");

  return rows;
}

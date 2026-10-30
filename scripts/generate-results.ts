/**
 * Generates results/demo-results.json — the canonical, reproducible output snapshot
 * used by the documentation, pitch deck and one-page summary. Run: npm run results
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import {
  compareAgainstBaseline,
  SCENARIOS,
  runSimulation,
  evaluateEconomics,
  DEFAULT_FINANCIAL,
  annualize,
  evaluateForecast,
  searchSizing,
  capexBreakdown,
  REFERENCE_HOSPITAL,
  dailyEnergyKwh,
} from "../src/engine";

const brief = SCENARIOS.find((s) => s.id === "B")!;
const cfg = brief.build();
const { proposed, baseline } = compareAgainstBaseline(cfg);
const fin = DEFAULT_FINANCIAL;
const econ = evaluateEconomics(cfg, fin);
const ann = { b: annualize(baseline, fin).annual, p: annualize(proposed, fin).annual };
const forecast = evaluateForecast(REFERENCE_HOSPITAL.loads, 7);
const sizing = searchSizing(cfg, {
  pvValues: [0, 100, 150, 200, 250, 300, 400],
  batteryValues: [0, 200, 400, 600, 800, 1000],
  criticalHoursTarget: 11.4,
});

const scenarioTable = SCENARIOS.map((s) => {
  const c = s.build();
  const r = runSimulation(c);
  const bl = runSimulation(
    // baseline mirror
    { ...structuredClone(c), pv: { kwp: 0, performanceRatio: 0.78 }, battery: { ...c.battery, nominalKwh: 0 }, inverter: { ratedKw: 0 }, islandOnSeverePQ: false, peakShaveKw: null }
  );
  const m = r.metrics;
  return {
    id: s.id,
    name: s.name,
    outageHours: +m.outageHours.toFixed(2),
    criticalServiceHours: +m.criticalServiceHours.toFixed(2),
    continuity: m.outageHours > 0 ? +(m.criticalServiceHours / m.outageHours).toFixed(3) : 1,
    dieselLitres: +m.dieselLitres.toFixed(0),
    baselineDieselLitres: +bl.metrics.dieselLitres.toFixed(0),
    dieselAvoidedPct: bl.metrics.dieselLitres > 0 ? +((1 - m.dieselLitres / bl.metrics.dieselLitres) * 100).toFixed(1) : null,
    unservedKwh: +(m.unservedKwh[1] + m.unservedKwh[2] + m.unservedKwh[3]).toFixed(1),
    opexNaira: +m.opexNaira.toFixed(0),
  };
});

const result = {
  generatedAt: new Date().toISOString(),
  engine: "deterministic 15-min step model, 3-day horizon, seed 42; all values reproducible via `npm run results`",
  facility: {
    name: cfg.facility.name,
    beds: cfg.facility.beds,
    dailyEnergyKwh: +cfg.facility.loads.reduce((s, l) => s + dailyEnergyKwh(l), 0).toFixed(0),
    tierKw: {
      t1: +cfg.facility.loads.filter((l) => l.tier === 1).reduce((s, l) => s + l.ratedKw, 0).toFixed(0),
      t2: +cfg.facility.loads.filter((l) => l.tier === 2).reduce((s, l) => s + l.ratedKw, 0).toFixed(0),
      t3: +cfg.facility.loads.filter((l) => l.tier === 3).reduce((s, l) => s + l.ratedKw, 0).toFixed(0),
    },
  },
  systemDesign: {
    pvKwp: cfg.pv.kwp,
    batteryKwh: cfg.battery.nominalKwh,
    inverterKw: cfg.inverter.ratedKw,
    gensetKw: cfg.genset.ratedKw,
  },
  briefScenario_B: {
    description: brief.description,
    proposed: {
      outageHours: +proposed.metrics.outageHours.toFixed(2),
      criticalServiceHours: +proposed.metrics.criticalServiceHours.toFixed(2),
      continuityPct: +((proposed.metrics.criticalServiceHours / proposed.metrics.outageHours) * 100).toFixed(1),
      tier1UnservedKwh: +proposed.metrics.unservedKwh[1].toFixed(2),
      dieselLitres: +proposed.metrics.dieselLitres.toFixed(0),
      gensetRuntimeH: +proposed.metrics.gensetRuntimeH.toFixed(1),
      pvUsedKwh: +proposed.metrics.pvUsedKwh.toFixed(0),
      renewableShare: +proposed.metrics.renewableShare.toFixed(3),
      opexNaira: +proposed.metrics.opexNaira.toFixed(0),
      co2Kg: +proposed.metrics.co2Kg.toFixed(0),
      totalDemandKwh: +proposed.metrics.totalDemandKwh.toFixed(0),
    },
    baseline: {
      dieselLitres: +baseline.metrics.dieselLitres.toFixed(0),
      gensetRuntimeH: +baseline.metrics.gensetRuntimeH.toFixed(1),
      opexNaira: +baseline.metrics.opexNaira.toFixed(0),
      co2Kg: +baseline.metrics.co2Kg.toFixed(0),
      criticalServiceHours: +baseline.metrics.criticalServiceHours.toFixed(2),
    },
    comparison: {
      dieselAvoidedLitres3day: +(baseline.metrics.dieselLitres - proposed.metrics.dieselLitres).toFixed(0),
      dieselAvoidedPct: +((1 - proposed.metrics.dieselLitres / baseline.metrics.dieselLitres) * 100).toFixed(1),
      opexSavingPct3day: +((1 - proposed.metrics.opexNaira / baseline.metrics.opexNaira) * 100).toFixed(1),
    },
  },
  annualized: {
    mix: "320 normal days + 45 outage days (12.5 islanded hours each, incl. 30-min reconnection delay)",
    baselineOpexNaira: +ann.b.opexNaira.toFixed(0),
    proposedOpexNaira: +ann.p.opexNaira.toFixed(0),
    annualSavingsNaira: +econ.annualSavingsNaira.toFixed(0),
    dieselLitresBaseline: +ann.b.dieselLitres.toFixed(0),
    dieselLitresProposed: +ann.p.dieselLitres.toFixed(0),
    dieselLitresAvoided: +econ.dieselLitresAvoidedPerYear.toFixed(0),
    co2TonnesAvoided: +econ.co2TonnesAvoidedPerYear.toFixed(1),
    criticalServiceHoursPerYear: +ann.p.criticalServiceHours.toFixed(0),
  },
  economics: {
    capex: {
      pvUsd: +econ.capex.pvUsd.toFixed(0),
      storageUsd: +econ.capex.storageUsd.toFixed(0),
      inverterUsd: +econ.capex.inverterUsd.toFixed(0),
      installUsd: +econ.capex.installUsd.toFixed(0),
      totalUsd: +econ.capex.totalUsd.toFixed(0),
      totalNaira: +econ.capex.totalNaira.toFixed(0),
    },
    simplePaybackYears: econ.simplePaybackYears ? +econ.simplePaybackYears.toFixed(1) : null,
    npvNaira10y: +econ.npvNaira.toFixed(0),
    irr: econ.irr ? +(econ.irr * 100).toFixed(1) : null,
    lcoeNairaPerKwh: +econ.lcoeNairaPerKwh.toFixed(0),
    eaasTariffNairaPerKwh: +econ.eaasTariffNairaPerKwh.toFixed(0),
    eaasAssetTariffNairaPerKwh: +econ.eaasAssetTariffNairaPerKwh.toFixed(0),
    eaasAnnualFeeNaira: +econ.eaasAnnualFeeNaira.toFixed(0),
    eaasBreakevenFinancingRatePct: econ.eaasBreakevenFinancingRate
      ? +(econ.eaasBreakevenFinancingRate * 100).toFixed(1)
      : null,
    baselineBlendedNairaPerKwh: +econ.baselineBlendedCostNairaPerKwh.toFixed(0),
    serviceTariffPerBedDayNaira: econ.serviceTariffPerBedDayNaira
      ? +econ.serviceTariffPerBedDayNaira.toFixed(0)
      : null,
    sensitivity: econ_sens(),
  },
  forecasting: {
    persistenceMAE: forecast.persistenceMAE,
    persistenceRMSE: forecast.persistenceRMSE,
    scheduleAwareMAE: forecast.scheduleAwareMAE,
    scheduleAwareRMSE: forecast.scheduleAwareRMSE,
    anomalies: forecast.anomalies.length,
  },
  sizingSearch: {
    target: sizing.target,
    best: sizing.best,
    top: sizing.candidates.slice(0, 6),
  },
  scenarios: scenarioTable,
};

function econ_sens() {
  // sensitivity() re-runs the economics 8 times; reuse it directly
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { sensitivity } = require("../src/engine/financial") as typeof import("../src/engine/financial");
  return sensitivity(cfg, fin).map((r) => ({
    variable: r.variable,
    change: r.change,
    paybackYears: r.paybackYears ? +r.paybackYears.toFixed(1) : null,
    npvNaira: +r.npvNaira.toFixed(0),
    eaasTariffNairaPerKwh: +r.eaasTariffNairaPerKwh.toFixed(0),
  }));
}

mkdirSync("results", { recursive: true });
writeFileSync(join("results", "demo-results.json"), JSON.stringify(result, null, 2));
console.log("Wrote results/demo-results.json");
console.log("— Brief scenario B —");
console.log(`  outage ${proposed.metrics.outageHours.toFixed(1)} h · critical continuity ${proposed.metrics.criticalServiceHours.toFixed(2)} h · T1 unserved ${proposed.metrics.unservedKwh[1].toFixed(2)} kWh`);
console.log(`  diesel ${proposed.metrics.dieselLitres.toFixed(0)} L vs baseline ${baseline.metrics.dieselLitres.toFixed(0)} L (−${result.briefScenario_B.comparison.dieselAvoidedPct}%)`);
console.log("— Annualized —");
console.log(`  savings ${econ.annualSavingsNaira.toLocaleString()} ₦/yr · diesel avoided ${econ.dieselLitresAvoidedPerYear.toFixed(0)} L/yr · CO₂ ${econ.co2TonnesAvoidedPerYear.toFixed(1)} t/yr`);
console.log("— Economics —");
console.log(`  CapEx ${econ.capex.totalNaira.toLocaleString()} ₦ · payback ${econ.simplePaybackYears?.toFixed(1)} yr · NPV ${econ.npvNaira.toLocaleString()} ₦ · EaaS ${econ.eaasTariffNairaPerKwh.toFixed(0)} ₦/kWh vs blended baseline ${econ.baselineBlendedCostNairaPerKwh.toFixed(0)} ₦/kWh`);

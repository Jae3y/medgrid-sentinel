/**
 * Generates results/demo-results.json — the canonical, reproducible snapshot used by the
 * documentation, pitch deck, one-page summary and video scripts. Run: npm run results
 * Every number quoted anywhere in the submission must trace to this file.
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import {
  compareStrategies,
  lineOutageConfig,
  DEFAULT_LINE_OUTAGE,
  MAIDUGURI_EVENT,
  STRATEGIES,
  SCENARIOS,
  runSimulation,
  buildBaselineConfig,
  evaluateEconomics,
  DEFAULT_FINANCIAL,
  sensitivity,
  searchSizing,
  runMonteCarlo,
  RELIABILITY_CLASSES,
  singleGensetReliability,
  evaluateSolarForecast,
  FLEET_SITES,
  ARCHETYPES,
  evaluateSite,
  fleetCurve,
  defaultConfig,
  annualConfig,
  smsFeed,
  REFERENCE_HOSPITAL,
  dailyEnergyKwh,
  tierTable,
} from "../src/engine";

const t0 = Date.now();
const r1 = (v: number, d = 0) => Number(v.toFixed(d));
const log = (s: string) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${s}`);

// ---------- Brief #13 replay ----------
const outageH = MAIDUGURI_EVENT.outageDays * 24;
const replay = (weekly: number) => {
  const res = compareStrategies(lineOutageConfig({ weeklySupplyLitres: weekly }));
  const row: Record<string, unknown> = {};
  for (const s of STRATEGIES) {
    const m = res[s.id].metrics;
    row[s.id] = {
      criticalHours: r1(m.criticalMaintainedHours, 2),
      tier1Hours: r1(m.tier1MaintainedHours, 2),
      dieselLitres: r1(m.dieselLitres),
      fuelOutHours: r1(m.fuelOutHours, 2),
      tier1Interruptions: m.tier1Interruptions,
      deferredMWh: r1(m.deferredKwh / 1000, 1),
      gensetHours: r1(m.gensetRuntimeH, 2),
      litresPerCriticalHour: r1(m.litresPerCriticalHour, 1),
      pvUsedMWh: r1(m.pvUsedKwh / 1000, 1),
    };
  }
  return { res, row };
};
const headline = replay(DEFAULT_LINE_OUTAGE.weeklySupplyLitres);
log("replay done");
const supplyCurve = [0, 2000, 4000, 6000, 8000, 10000, 12000, 14000, 16000].map((w) => {
  const { row } = replay(w);
  return { weeklySupplyLitres: w, ...Object.fromEntries(Object.entries(row).map(([k, v]) => [k, { criticalHours: (v as { criticalHours: number }).criticalHours, tier1Hours: (v as { tier1Hours: number }).tier1Hours, dieselLitres: (v as { dieselLitres: number }).dieselLitres }])) };
});
log("supply curve done");
const stress = (() => {
  const cfg = { ...lineOutageConfig(), reliability: { failToStartOnOutage: [], runFailureAtRunHours: [150], repairHours: 72 } };
  const res = compareStrategies(cfg);
  return Object.fromEntries(STRATEGIES.map((s) => [s.id, { criticalHours: r1(res[s.id].metrics.criticalMaintainedHours, 2), tier1Hours: r1(res[s.id].metrics.tier1MaintainedHours, 2), dieselLitres: r1(res[s.id].metrics.dieselLitres) }]));
})();
const sms = smsFeed(headline.res.sentinel, 8).map((a) => a.text);

// The moment the demo film opens on: the first quarter-hour (rounded up to a whole hour) in which the
// status-quo hospital loses more than half of its Tier-1 demand. Same rule as the app's "First blackout" button.
const fbBase = headline.res.baseline.steps;
const fbRaw = fbBase.findIndex((s) => s.islanded && s.demandKw[1] > 0 && s.servedKw[1] < 0.5 * s.demandKw[1]);
const fbStep = fbRaw + ((4 - (fbRaw % 4)) % 4);
const fbDate = new Date(`${MAIDUGURI_EVENT.simStart}T00:00:00Z`);
fbDate.setUTCDate(fbDate.getUTCDate() + Math.floor(fbStep / 96));
const firstBlackout = {
  step: fbStep,
  isoDate: fbDate.toISOString().slice(0, 10),
  hourOfDay: (fbStep % 96) / 4,
  outageHour: (fbStep - MAIDUGURI_EVENT.outageStartDay * 96) / 4,
  byController: Object.fromEntries(
    STRATEGIES.map((st) => {
      const steps = headline.res[st.id].steps;
      const cur = steps[fbStep];
      let crit = 0;
      for (const x of steps.slice(0, fbStep + 1)) {
        const gap = x.startGapSec > 0 && x.startGapSec <= 90;
        if (x.islanded && (gap || x.servedKw[1] + x.servedKw[2] >= 0.995 * (x.demandKw[1] + x.demandKw[2]))) crit += 0.25;
      }
      return [st.id, { dieselOnSiteLitres: r1(cur.fuelLitres), tier1ServedKw: r1(cur.servedKw[1]), tier1DemandKw: r1(cur.demandKw[1]), tier2ServedKw: r1(cur.servedKw[2]), tier3ServedKw: r1(cur.servedKw[3]), criticalHoursSoFar: r1(crit, 2), pvKw: r1(cur.pvKw), batteryKw: r1(cur.battKw), socPct: r1(cur.socFrac * 100), generatorKw: r1(cur.gensetKw), generatorUnavailable: cur.gensetUnavailable }];
    })
  ),
};

// ---------- Normal-year diesel (for the "x normal weekly use" framing) ----------
const normalYear = runSimulation(annualConfig(defaultConfig(), { ...DEFAULT_FINANCIAL, lineOutageDays: 0 }, "baseline"));
const normalWeeklyLitres = normalYear.metrics.dieselLitres / (normalYear.metrics.horizonHours / 168);
log("normal year done");

// ---------- Economics ----------
const cfg = defaultConfig();
const econ = evaluateEconomics(cfg, DEFAULT_FINANCIAL);
const sens = sensitivity(cfg, DEFAULT_FINANCIAL);
log("economics done");
const concessional = evaluateEconomics(cfg, { ...DEFAULT_FINANCIAL, discountRate: 0.1 });

// ---------- Monte Carlo ----------
const mc = Object.fromEntries(
  RELIABILITY_CLASSES.map((c) => {
    const r = runMonteCarlo({ trials: 300, reliabilityClassId: c.id, outageHours: 336 });
    return [
      c.id,
      {
        label: c.label,
        trials: 300,
        outageHours: 336,
        nrelSingleGensetR336: r1(singleGensetReliability(c, 336), 3),
        byStrategy: Object.fromEntries(
          Object.entries(r.byStrategy).map(([k, v]) => [
            k,
            {
              pTier1_72h: r1(v.survival[72], 3),
              pTier1_168h: r1(v.survival[168], 3),
              pTier1_336h: r1(v.survival[336], 3),
              pZeroBreaks: r1(v.pZeroBreaks, 3),
              meanTier1Hours: r1(v.meanTier1Hours, 1),
              meanCriticalHours: r1(v.meanCriticalHours, 1),
              p10CriticalHours: v.p10CriticalHours,
              p50CriticalHours: v.p50CriticalHours,
              p90CriticalHours: v.p90CriticalHours,
              meanDieselLitres: r1(v.meanDieselLitres),
              meanGensetRunHours: r1(v.meanGensetRunHours, 1),
            },
          ])
        ),
      },
    ];
  })
);
log("monte carlo done");

// ---------- Forecast, sizing, fleet ----------
const solar = evaluateSolarForecast();
const sizing = searchSizing(cfg);
log("sizing done");
const fleet = ARCHETYPES.flatMap((a) => FLEET_SITES.map((s) => evaluateSite(s, a)));
log("fleet done");

// ---------- Legacy 3-day stress scenarios (Scenario Lab) ----------
const scenarioTable = SCENARIOS.map((s) => {
  const c = s.build();
  const r = runSimulation(c);
  const bl = runSimulation(buildBaselineConfig(c));
  const m = r.metrics;
  return {
    id: s.id,
    name: s.name,
    outageHours: r1(m.outageHours, 2),
    criticalHours: r1(m.criticalMaintainedHours, 2),
    tier1Hours: r1(m.tier1MaintainedHours, 2),
    baselineCriticalHours: r1(bl.metrics.criticalMaintainedHours, 2),
    dieselLitres: r1(m.dieselLitres),
    baselineDieselLitres: r1(bl.metrics.dieselLitres),
    tier1Interruptions: m.tier1Interruptions,
    baselineTier1Interruptions: bl.metrics.tier1Interruptions,
    unservedKwh: r1(m.unservedKwh[1] + m.unservedKwh[2] + m.unservedKwh[3], 1),
  };
});

const tiers = tierTable(REFERENCE_HOSPITAL.loads);
const result = {
  generatedAt: new Date().toISOString(),
  reproduce: "npm run results (deterministic; seeds fixed)",
  facility: {
    name: REFERENCE_HOSPITAL.name,
    beds: REFERENCE_HOSPITAL.beds,
    dailyEnergyKwh: r1(REFERENCE_HOSPITAL.loads.reduce((s, l) => s + dailyEnergyKwh(l), 0)),
    tierAvgKw: {
      t1: r1(tiers.reduce((s, d) => s + d[1], 0) / 24, 1),
      t2: r1(tiers.reduce((s, d) => s + d[2], 0) / 24, 1),
      t3: r1(tiers.reduce((s, d) => s + d[3], 0) / 24, 1),
    },
  },
  referenceDesign: { pvKwp: cfg.pv.kwp, batteryKwh: cfg.battery.nominalKwh, inverterKw: cfg.inverter.ratedKw, gensetKw: cfg.genset.ratedKw, statusQuoGensetKw: buildBaselineConfig(cfg).genset.ratedKw },
  brief13Replay: {
    event: MAIDUGURI_EVENT,
    outageHours: outageH,
    assumptions: { ...DEFAULT_LINE_OUTAGE, deliveriesEveryDays: 3.5, dieselNairaPerLitre: cfg.genset.fuelNairaPerLitre },
    normalYearWeeklyDieselLitres: r1(normalWeeklyLitres),
    supplyMultipleOfNormal: r1(DEFAULT_LINE_OUTAGE.weeklySupplyLitres / normalWeeklyLitres, 2),
    results: headline.row,
    withGeneratorTripAt150h: stress,
    supplyCurve,
    firstBlackout,
    sampleSms: sms,
  },
  monteCarlo14Day: mc,
  annualEconomics: {
    site: DEFAULT_FINANCIAL.siteDatasetId,
    feeder: DEFAULT_FINANCIAL.feeder,
    lineOutageDays: DEFAULT_FINANCIAL.lineOutageDays,
    capex: Object.fromEntries(Object.entries(econ.capex).map(([k, v]) => [k, r1(v)])),
    baseline: Object.fromEntries(Object.entries(econ.baselineAnnual).map(([k, v]) => [k, r1(v as number, 1)])),
    proposed: Object.fromEntries(Object.entries(econ.proposedAnnual).map(([k, v]) => [k, r1(v as number, 1)])),
    annualSavingsNaira: r1(econ.annualSavingsNaira),
    netAnnualBenefitNaira: r1(econ.netAnnualBenefitNaira),
    paybackYears: econ.simplePaybackYears ? r1(econ.simplePaybackYears, 2) : null,
    npv20yAt18pct: r1(econ.npvNaira),
    npv20yAt10pct: r1(concessional.npvNaira),
    irr: econ.irr !== null ? r1(econ.irr, 4) : null,
    lcoeNairaPerKwh: r1(econ.lcoeNairaPerKwh),
    baselineLcoeNairaPerKwh: r1(econ.baselineLcoeNairaPerKwh),
    dieselLitresAvoidedPerYear: r1(econ.dieselLitresAvoidedPerYear),
    dieselAvoidedPct: r1(econ.dieselAvoidedPct, 3),
    co2TonnesAvoidedPerYear: r1(econ.co2TonnesAvoidedPerYear, 1),
    gensetHoursAvoidedPerYear: r1(econ.gensetHoursAvoidedPerYear),
    eaasAnnualFeeNaira: r1(econ.eaasAnnualFeeNaira),
    eaasMonthlyFeeNaira: r1(econ.eaasAnnualFeeNaira / 12),
    eaasProviderIrr: econ.eaasProviderIrr !== null ? r1(econ.eaasProviderIrr, 4) : null,
    eaasBreakevenFinancingRate: econ.eaasBreakevenFinancingRate !== null ? r1(econ.eaasBreakevenFinancingRate, 4) : null,
    energyCostPerBedDay: { baseline: r1(econ.baselineEnergyCostPerBedDayNaira), proposedEaaS: r1(econ.proposedEnergyCostPerBedDayNaira) },
    sensitivity: sens.map((s) => ({ ...s, npvNaira: r1(s.npvNaira), paybackYears: s.paybackYears ? r1(s.paybackYears, 1) : null, irr: s.irr !== null ? r1(s.irr, 3) : null })),
  },
  solarForecast: { ...solar, series: undefined },
  sizing: { target: sizing.target, best: sizing.best, candidates: sizing.candidates },
  fleet: { rows: fleet, costCurve: fleetCurve(econ.capex.totalUsd) },
  scenarioLab: scenarioTable,
};

mkdirSync(join(__dirname, "..", "results"), { recursive: true });
writeFileSync(join(__dirname, "..", "results", "demo-results.json"), JSON.stringify(result, null, 2));
log(`wrote results/demo-results.json`);

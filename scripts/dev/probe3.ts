import { lineOutageConfig, evaluateEconomics, DEFAULT_FINANCIAL, sensitivity, annualConfig, runSimulation } from "../../src/engine";
const cfg = lineOutageConfig();
let t0 = Date.now();
const e = evaluateEconomics(cfg, DEFAULT_FINANCIAL);
console.log("ms", Date.now() - t0);
const f = (n: number) => Math.round(n).toLocaleString();
console.log({ capexUsd: f(e.capex.totalUsd), capexN: f(e.capex.totalNaira), savings: f(e.annualSavingsNaira), net: f(e.netAnnualBenefitNaira), payback: e.simplePaybackYears?.toFixed(2), npv: f(e.npvNaira), irr: e.irr, lcoe: e.lcoeNairaPerKwh.toFixed(0), baseLcoe: e.baselineLcoeNairaPerKwh.toFixed(0), dieselB: f(e.baselineAnnual.dieselLitres), dieselP: f(e.proposedAnnual.dieselLitres), avoidedPct: e.dieselAvoidedPct, gridB: f(e.baselineAnnual.gridKwh), gridP: f(e.proposedAnnual.gridKwh), pv: f(e.proposedAnnual.pvKwh), outH: e.baselineAnnual.outageHours, gensetH: [e.baselineAnnual.gensetRuntimeH, e.proposedAnnual.gensetRuntimeH], provIrr: e.eaasProviderIrr, fee: f(e.eaasAnnualFeeNaira), bed: [e.baselineEnergyCostPerBedDayNaira.toFixed(0), e.proposedEnergyCostPerBedDayNaira.toFixed(0)], co2: e.co2TonnesAvoidedPerYear.toFixed(0), opexB: f(e.baselineAnnual.opexNaira), opexP: f(e.proposedAnnual.opexNaira), crit: [e.baselineAnnual.criticalMaintainedHours, e.proposedAnnual.criticalMaintainedHours], int: [e.baselineAnnual.tier1Interruptions, e.proposedAnnual.tier1Interruptions] });
t0 = Date.now();
for (const r of sensitivity(cfg, DEFAULT_FINANCIAL)) console.log(r.variable, r.change, r.paybackYears?.toFixed(1), f(r.npvNaira), r.irr?.toFixed(3));
console.log("sens ms", Date.now() - t0);
// normal (no line outage) weekly diesel for baseline
const nl = runSimulation(annualConfig(cfg, { ...DEFAULT_FINANCIAL, lineOutageDays: 0 }, "baseline"));
console.log("baseline no-line-outage diesel L/week", Math.round(nl.metrics.dieselLitres / 52.3), "outage h/yr", nl.metrics.outageHours);

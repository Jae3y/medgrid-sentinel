import { runMonteCarlo } from "../../src/engine";
for (const cls of ["well", "nrc", "poor"] as const) {
  const r = runMonteCarlo({ trials: 150, reliabilityClassId: cls });
  console.log(`\n== ${cls} (${r.elapsedMs} ms)`);
  for (const [k, v] of Object.entries(r.byStrategy)) {
    console.log(k.padEnd(13), `S(24)=${v.survival[24].toFixed(2)} S(72)=${v.survival[72].toFixed(2)} S(168)=${v.survival[168].toFixed(2)} S(336)=${v.survival[336].toFixed(2)} zeroBreak=${v.pZeroBreaks.toFixed(2)} T1h=${v.meanTier1Hours.toFixed(0)} crit=${v.meanCriticalHours.toFixed(0)} [p10 ${v.p10CriticalHours} p50 ${v.p50CriticalHours} p90 ${v.p90CriticalHours}] L=${v.meanDieselLitres.toFixed(0)} run=${v.meanGensetRunHours.toFixed(0)}`);
  }
}

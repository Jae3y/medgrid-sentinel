import { compareStrategies, lineOutageConfig, runMonteCarlo, evaluateEconomics, DEFAULT_FINANCIAL, STRATEGIES } from "../../src/engine";
for (const hw of [{ pvKwp: 300, batteryKwh: 600, inverterKw: 250 }, { pvKwp: 600, batteryKwh: 600, inverterKw: 510 }, { pvKwp: 600, batteryKwh: 900, inverterKw: 510 }]) {
  console.log("\n#####", JSON.stringify(hw));
  for (const w of [6000, 8000]) {
    const r = compareStrategies(lineOutageConfig({ ...hw, weeklySupplyLitres: w }));
    console.log(w, STRATEGIES.map((s) => `${s.short}: crit ${r[s.id].metrics.criticalMaintainedHours.toFixed(0)} t1 ${r[s.id].metrics.tier1MaintainedHours.toFixed(0)} L ${Math.round(r[s.id].metrics.dieselLitres)}`).join(" | "));
  }
  const mc = runMonteCarlo({ trials: 120, hardware: hw });
  for (const [k, v] of Object.entries(mc.byStrategy)) console.log(k, `S72 ${v.survival[72].toFixed(2)} S168 ${v.survival[168].toFixed(2)} S336 ${v.survival[336].toFixed(2)} T1h ${v.meanTier1Hours.toFixed(0)} crit ${v.meanCriticalHours.toFixed(0)} L ${v.meanDieselLitres.toFixed(0)}`);
}

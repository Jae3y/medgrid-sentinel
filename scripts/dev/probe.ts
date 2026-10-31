import { lineOutageConfig, compareStrategies, STRATEGIES } from "../../src/engine";
const supplies = [0, 4000, 6000, 8000, 10000, 12000, 14000, 16000, 20000];
for (const w of supplies) {
  const t0 = Date.now();
  const r = compareStrategies(lineOutageConfig({ weeklySupplyLitres: w }));
  const row = STRATEGIES.map((s) => {
    const m = r[s.id].metrics;
    return `${s.short.padEnd(19)} crit ${m.criticalMaintainedHours.toFixed(0).padStart(4)} t1 ${m.tier1MaintainedHours.toFixed(0).padStart(4)}/${m.outageHours.toFixed(0)} L ${Math.round(m.dieselLitres).toString().padStart(6)} int ${m.tier1Interruptions} fuelOut ${m.fuelOutHours.toFixed(0)} def ${Math.round(m.deferredKwh)} gRun ${m.gensetRuntimeH.toFixed(0)}`;
  });
  console.log(`\n== weekly ${w} L (${Date.now() - t0} ms)\n` + row.join("\n"));
}

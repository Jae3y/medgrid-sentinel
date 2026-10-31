import { compareStrategies, lineOutageConfig } from "../../src/engine";
const r = compareStrategies(lineOutageConfig());
const i = r.baseline.steps.findIndex((s) => s.islanded && s.demandKw[1] > 0 && s.servedKw[1] < 0.5 * s.demandKw[1]);
const t = i + ((4 - (i % 4)) % 4);
console.log("t", t, "day", Math.floor(t / 96), "hour", (t % 96) / 4);
for (const k of ["baseline", "conventional", "sentinel"] as const) {
  let c = 0;
  for (const s of r[k].steps.slice(0, t + 1)) if (s.islanded && (s.servedKw[1] + s.servedKw[2] >= 0.995 * (s.demandKw[1] + s.demandKw[2]) || (s.startGapSec > 0 && s.startGapSec <= 90))) c += 0.25;
  const s = r[k].steps[t];
  console.log(k, "crit so far", c, "fuel", Math.round(s.fuelLitres), "T1", Math.round(s.servedKw[1]), "/", Math.round(s.demandKw[1]), "T2", Math.round(s.servedKw[2]), "T3", Math.round(s.servedKw[3]), "pv", Math.round(s.pvKw), "batt", Math.round(s.battKw), Math.round(s.socFrac * 100) + "%", "gen", Math.round(s.gensetKw), "unav", s.gensetUnavailable);
}

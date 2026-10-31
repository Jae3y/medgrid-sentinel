import { compareStrategies, lineOutageConfig } from "../../src/engine";
const r = compareStrategies(lineOutageConfig());
const d = (t: number) => { const x = new Date("2024-09-20T00:00:00Z"); x.setUTCDate(x.getUTCDate() + Math.floor(t / 96)); return x.toISOString().slice(0, 10) + " " + ((t % 96) / 4); };
for (const k of ["baseline", "conventional", "sentinel"] as const) {
  const i = r[k].steps.findIndex((s) => s.islanded && s.demandKw[1] > 0 && s.servedKw[1] < 0.5 * s.demandKw[1]);
  console.log(k, i, i >= 0 ? d(i) : "never");
}
console.log(d(616));

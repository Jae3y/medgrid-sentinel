import { searchSizing, defaultConfig } from "../../src/engine";
const t0 = Date.now();
const r = searchSizing(defaultConfig());
console.log("ms", Date.now() - t0, r.target);
for (const c of r.candidates) console.log(c.pvKwp, c.batteryKwh, c.inverterKw, c.feasible, c.criticalServiceHours, c.tier1Hours, (c.npvNaira/1e6).toFixed(0)+"M", c.paybackYears?.toFixed(1), (c.capexNaira/1e6).toFixed(0), c.dieselAvoidedPct);

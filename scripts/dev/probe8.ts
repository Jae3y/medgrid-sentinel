import { FLEET_SITES, ARCHETYPES, evaluateSite } from "../../src/engine";
const t0 = Date.now();
for (const a of ARCHETYPES) for (const s of FLEET_SITES) { const r = evaluateSite(s, a); console.log(r.site.padEnd(24), a.id.padEnd(9), r.annualGhiKwhM2, r.specificYieldKwhPerKwp, r.capexUsd, r.paybackYears?.toFixed(1), (r.npvNaira/1e6).toFixed(0)+"M", r.irr?.toFixed(3), r.dieselAvoidedLitres, r.dieselAvoidedPct.toFixed(2), r.tier1BreaksAvoided, r.verdict); }
console.log("ms", Date.now() - t0);

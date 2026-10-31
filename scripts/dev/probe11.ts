import { scenarioById, runSimulation, withStrategy } from "../../src/engine";
for (const st of ["conventional","sentinel"] as const) { const sim = runSimulation(withStrategy(scenarioById("G").build(), st)); const m = sim.metrics; console.log(st, m.outageHours, m.criticalMaintainedHours, m.tier1MaintainedHours, m.unservedKwh, m.deferredKwh.toFixed(0)); }
